/* eslint no-process-exit: 0 */

import applyAuth from './auth';
import bodyParser from 'body-parser';
import busboy from 'connect-busboy';
import containerMetadata from './utils/container-metadata';
import compression from 'compression';
import config from './config';
import express from 'express';
import glob from 'glob';
import http from 'http';
import log, { requestLogger } from './logger';
import modRewrite from 'connect-modrewrite';
import { notFound, serverErrorMiddleware } from './utils/error-response';
import path from 'path';
import useragent from 'express-useragent';

// Wire up process-wide event handlers.
process.on('unhandledRejection', (reason, p) => {
	log.fatal('Catastrophic failure - unhandled rejection! Details:', {
		reason,
		promise: p,
		ecsInstanceId: containerMetadata.ContainerInstanceARN,
		ecsTaskId: containerMetadata.TaskARN
	});
	process.exit(187);
});

process.on('uncaughtException', err => {
	// This is pretty serious... end the process because it's likely
	// we're in an inconsistent state.
	log.fatal(
		'Catastrophic failure - unhandled exception! Details:',
		{
			ecsInstanceId: containerMetadata.ContainerInstanceARN,
			ecsTaskId: containerMetadata.TaskARN
		},
		err);
	process.exit(187);
});

// Express middleware
const app = express();
app.use(compression());
app.use(busboy({
	highWaterMark: 2 * 1024 * 1024
}));
app.use(useragent.express());
app.use(modRewrite([ '^/api/(.*) /$1' ]));
applyAuth(app);
app.use(requestLogger);
app.use(serverErrorMiddleware);
app.use(bodyParser.json());

// Load routes
glob.sync(path.join(__dirname, 'routes/*.routes.js')).forEach(loader => {
	log.debug('Route loader:', loader);
	require(loader)(app);
});

// Generic 404 for all other routes
app.all('*', (req, res) => {
	notFound(req, res);
});

// Launch server
const server = http.createServer(app);
server.listen(config.port);
log.info(`Service is now listening on port ${ config.port }.`);

export const App = app;
export const Server = server;
