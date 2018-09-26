import bunyan from 'bunyan';
import config from './config';
import expressLogger from 'express-bunyan-logger';

let stream;

if (config.logFileName) {
	stream = {
		path: config.logFileName
	};
} else {
	stream = {
		stream: process.stdout
	};
}

const logger = bunyan.createLogger({
	name: 'bt_log_main',
	level: config.logLevel,
	streams: [
		stream
	]
});

export const requestLogger = expressLogger({
	name: 'bt_log_request',
	level: config.logLevel,
	streams: [
		stream
	],
	excludes: [
		'req-headers',
		'res-headers',
		'body',
		'short-body',
		'req',
		'res',
		'response-hrtime'],
	includesFn: (req) => {
		return {
			user: req.user
		};
	}
});

export default logger;
