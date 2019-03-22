import _ from 'lodash';
import { App } from '../../service/server';
import createFakeAccount from '../util/create-fake-account';
import { ErrorIds } from '../../service/utils/error-response';
import { expect } from 'chai';
import faker from 'faker';
import fakeLogEntry from '../util/fake-log-entry';
import LogEntry from '../../service/data/log-entry';
import mongoose from '../../service/data/database';
import request from 'supertest';
import Session from '../../service/data/session';
import sinon from 'sinon';
import User from '../../service/data/user';

const SameyEntryTimes = [
	faker.date.past(3).toISOString(),
	faker.date.past(3).toISOString(),
	faker.date.past(3).toISOString(),
	faker.date.past(3).toISOString(),
	faker.date.past(3).toISOString(),
	faker.date.past(3).toISOString()
];
const SameyMaxDepths = [ 35, 45, 55, 65, 75, 85 ];
const SameyBottomTimes = [ 10, 20, 30, 40, 50, 60 ];

describe('Log Entry Searching', () => {
	let friendsOnlyUser = null;
	let privateUser = null;
	let publicUser = null;
	let adminUser = null;

	before(async () => {
		publicUser = await createFakeAccount('user', 'public');
		friendsOnlyUser = await createFakeAccount('user', 'friends-only');
		privateUser = await createFakeAccount('user', 'private');
		adminUser = await createFakeAccount('admin');

		await Promise.all(
			_.map(new Array(500), () => new LogEntry(fakeLogEntry(friendsOnlyUser.user.id)).save())
		);
		await Promise.all(
			_.map(new Array(20), () => new LogEntry(fakeLogEntry(publicUser.user.id)).save())
		);
		await Promise.all(
			_.map(new Array(100), () => {
				const newEntry = new LogEntry(fakeLogEntry(privateUser.user.id));
				newEntry.entryTime = faker.random.arrayElement(SameyEntryTimes);
				newEntry.maxDepth = faker.random.arrayElement(SameyMaxDepths);
				newEntry.bottomTime = faker.random.arrayElement(SameyBottomTimes);
				return newEntry.save();
			})
		);
	});

	after(async () => {
		await Promise.all([
			LogEntry.deleteMany({}),
			User.deleteMany({}),
			Session.deleteMany({})
		]);
	});

	describe('Security', () => {
		it('Anonymous users can view public log books', async () => {
			const result = await request(App).get(`/users/${ publicUser.user.username }/logs`);
			expect(result.status).to.equal(200);
			expect(result.body).to.be.an('Array');
		});

		it('Anonymous users cannot view friends-only log books', async () => {
			const result = await request(App).get(`/users/${ friendsOnlyUser.user.username }/logs`);
			expect(result.status).to.equal(403);
			expect(result.body.status).to.equal(403);
			expect(result.body.errorId).to.equal(ErrorIds.forbidden);
		});

		it('Anonymous users cannot view private log books', async () => {
			const result = await request(App).get(`/users/${ privateUser.user.username }/logs`);
			expect(result.status).to.equal(403);
			expect(result.body.status).to.equal(403);
			expect(result.body.errorId).to.equal(ErrorIds.forbidden);
		});

		it('Users can view public log books', async () => {
			const result = await request(App)
				.get(`/users/${ publicUser.user.username }/logs`)
				.set(...privateUser.authHeader);
			expect(result.status).to.equal(200);
			expect(result.body).to.be.an('Array');
		});

		it.skip('Users can view friends-only log books if they are friends with the owner', async () => {
			// TODO: Test once we have friends logic.
		});

		it('Users cannot view friends-only log books if they are not friends of the owner', async () => {
			const result = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...privateUser.authHeader);
			expect(result.status).to.equal(403);
			expect(result.body.status).to.equal(403);
			expect(result.body.errorId).to.equal(ErrorIds.forbidden);
		});

		it('Users cannot view private log books', async () => {
			const result = await request(App)
				.get(`/users/${ privateUser.user.username }/logs`)
				.set(...publicUser.authHeader);
			expect(result.status).to.equal(403);
			expect(result.body.status).to.equal(403);
			expect(result.body.errorId).to.equal(ErrorIds.forbidden);
		});

		it('Admins can view public log books', async () => {
			const result = await request(App)
				.get(`/users/${ publicUser.user.username }/logs`)
				.set(...adminUser.authHeader);
			expect(result.status).to.equal(200);
			expect(result.body).to.be.an('Array');
		});

		it('Admins can view friends-only log books', async () => {
			const result = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...adminUser.authHeader);
			expect(result.status).to.equal(200);
			expect(result.body).to.be.an('Array');
		});

		it('Admins can view private log books', async () => {
			const result = await request(App)
				.get(`/users/${ privateUser.user.username }/logs`)
				.set(...adminUser.authHeader);
			expect(result.status).to.equal(200);
			expect(result.body).to.be.an('Array');
		});
	});

	describe('Parameters', () => {
		let stub = null;

		afterEach(() => {
			if (stub) {
				stub.restore();
				stub = null;
			}
		});

		it('Will return an array of log entries', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader);
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(100);

			for (let i = 0; i < results.length; i++) {
				expect(results[i]).to.have.keys(
					'entryId',
					'entryTime',
					'maxDepth',
					'location',
					'site',
					'bottomTime'
				);

				if (i > 0) {
					expect(Date.parse(results[i].entryTime))
						.to.be.at.most(Date.parse(results[i - 1].entryTime));
				}
			}
		});

		it('Will return entry times in descending order', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({
					sortBy: 'entryTime',
					sortOrder: 'desc'
				});
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(100);

			for (let i = 1; i < results.length; i++) {
				expect(Date.parse(results[i].entryTime))
					.to.be.at.most(Date.parse(results[i - 1].entryTime));
			}
		});

		it('Will return entry times in ascending order', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({
					sortBy: 'entryTime',
					sortOrder: 'asc'
				});
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(100);

			for (let i = 1; i < results.length; i++) {
				expect(Date.parse(results[i].entryTime))
					.to.be.at.least(Date.parse(results[i - 1].entryTime));
			}
		});

		it('Will return maxDepths in descending order', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({
					sortBy: 'maxDepth',
					sortOrder: 'desc'
				});
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(100);

			for (let i = 1; i < results.length; i++) {
				expect(results[i].maxDepth).to.be.at.most(results[i - 1].maxDepth);
			}
		});

		it('Will return maxDepths in ascending order', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({
					sortBy: 'maxDepth',
					sortOrder: 'asc'
				});
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(100);

			for (let i = 1; i < results.length; i++) {
				expect(results[i].maxDepth).to.be.at.least(results[i - 1].maxDepth);
			}
		});

		it('Will return bottomTime in descending order', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({
					sortBy: 'bottomTime',
					sortOrder: 'desc'
				});
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(100);

			for (let i = 1; i < results.length; i++) {
				expect(results[i].bottomTime).to.be.at.most(results[i - 1].bottomTime);
			}
		});

		it('Will return bottomTime in ascending order', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({
					sortBy: 'bottomTime',
					sortOrder: 'asc'
				});
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(100);

			for (let i = 1; i < results.length; i++) {
				expect(results[i].bottomTime).to.be.at.least(results[i - 1].bottomTime);
			}
		});

		it('Number of entries returned can be set', async () => {
			let results = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({ count: 50 });
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(50);
		});

		it('Will return an empty array if no log entries are found', async () => {
			const results = await request(App)
				.get(`/users/${ adminUser.user.username }/logs`)
				.set(...adminUser.authHeader);
			expect(results.body).to.be.an('Array');
			expect(results.body).to.be.empty;
		});

		it('Will return Not Found if requested username does not exist', async () => {
			const result = await request(App)
				.get('/users/Jonny_Nonexistent/logs')
				.set(...friendsOnlyUser.authHeader);

			expect(result.status).to.equal(404);
			expect(result.body.status).to.equal(404);
			expect(result.body.errorId).to.equal(ErrorIds.notFound);
		});

		it('Will return Bad Request if query string fails validation', async () => {
			const result = await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.query({
					invalid: 'Yup',
					count: -5
				});

			expect(result.status).to.equal(400);
			expect(result.body.errorId).to.equal(ErrorIds.badRequest);
			expect(result.body.status).to.equal(400);
		});

		it('Will return Server Error if something goes wrong querying the database', async () => {
			stub = sinon.stub(mongoose.Query.prototype, 'exec');
			stub.rejects('Nope!');

			await request(App)
				.get(`/users/${ friendsOnlyUser.user.username }/logs`)
				.set(...friendsOnlyUser.authHeader)
				.expect(500);
		});
	});

	describe('Load more', () => {
		[
			{ sortBy: 'entryTime', sortOrder: 'desc' },
			{ sortBy: 'entryTime', sortOrder: 'asc' },
			{ sortBy: 'maxDepth', sortOrder: 'desc' },
			{ sortBy: 'maxDepth', sortOrder: 'asc' },
			{ sortBy: 'bottomTime', sortOrder: 'desc' },
			{ sortBy: 'bottomTime', sortOrder: 'asc' }
		].forEach(t => it(`Will resume a search by ${ t.sortBy } in ${ t.sortOrder } order`, async () => {
			const { sortOrder, sortBy } = t;

			let results = await request(App)
				.get(`/users/${ privateUser.user.username }/logs`)
				.query({
					count: 50,
					sortBy,
					sortOrder
				})
				.set(...privateUser.authHeader);
			results = results.body;
			expect(results).to.be.an('Array');
			expect(results).to.have.length(50);

			const seenIds = [];
			const lastSeen = results[results.length - 1][sortBy];

			for (let i = results.length - 1; i >= 0; i--) {
				if (results[i][sortBy] === lastSeen) {
					seenIds.push(results[i].entryId);
				} else {
					break;
				}
			}

			const more = await request(App)
				.get(`/users/${ privateUser.user.username }/logs`)
				.query({
					count: 50,
					sortBy,
					sortOrder,
					lastSeen,
					seenIds
				})
				.set(...privateUser.authHeader);

			expect(more.status).to.equal(200);
			results = _.concat(results, more.body);
			expect(results).to.have.length(100);

			if (sortBy === 'entryTime') {
				if (sortOrder === 'asc') {
					for (let i = 1; i < results.length; i++) {
						expect(Date.parse(results[i].entryTime))
							.to.be.at.least(Date.parse(results[i - 1].entryTime));
					}
				} else {
					for (let i = 1; i < results.length; i++) {
						expect(Date.parse(results[i].entryTime))
							.to.be.at.most(Date.parse(results[i - 1].entryTime));
					}
				}
			} else if (sortOrder === 'asc') {
				for (let i = 1; i < results.length; i++) {
					expect(results[i][sortBy]).to.be.at.least(results[i - 1][sortBy]);
				}
			} else {
				for (let i = 1; i < results.length; i++) {
					expect(results[i][sortBy]).to.be.at.most(results[i - 1][sortBy]);
				}
			}
		}));
	});
});