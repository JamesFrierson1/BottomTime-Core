/* eslint no-process-exit: 0, no-process-env: 0 */

import AWS from 'aws-sdk';
import chalk from 'chalk';
import { Client } from '@elastic/elasticsearch';
import config from '../service/config';
import log from 'fancy-log';
import mongoose from '../service/data/database';
import request from 'supertest';

const storage = new AWS.S3({
	apiVersion: '2006-03-01',
	signatureVersion: 'v4',
	endpoint: new AWS.Endpoint(process.env.BT_S3_ENDPOINT || 'http://localhost:4569/')
});

let esClient = null;

function sleep(duration) {
	return new Promise(resolve => setTimeout(resolve, duration));
}

(async () => {
	log('Creating local S3 Buckets...');
	try {
		await storage.createBucket({
			Bucket: 'BottomTime-Media'
		}).promise();
		log('Buckets have been created.');

		log('Attempting to connect to ElasticSearch...');
		for (let i = 0; i < 5; i++) {
			try {
				await request(config.elasticSearchEndpoint).get('/').expect(200);
			} catch (err) {
				log(`Connection unavailable. Attempting ${ chalk.bold(4 - i) } more times...`);
				if (i === 4) {
					return process.exit(5);
				}
				await sleep(2000);
			}
		}

		log('Creating ElasticSearch index...');
		esClient = new Client({
			log: 'debug',
			node: config.elasticSearchEndpoint
		});

		await esClient.indices.create({
			index: config.elasticSearchIndex
		});

		log('Creating Dive Sites type...');
		require('../service/data/sites');
		log('ElasticSearch has been initialized.');

	} catch (err) {
		log.error(chalk.red(err));
		process.exitCode = 1;
	} finally {
		log('Closing connections...');
		esClient.close();
		require('../service/search').close();
		mongoose.connection.close();
	}
})();
