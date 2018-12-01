import { expect } from 'chai';
import fakeLogEntry from '../util/fake-log-entry';
import faker from 'faker';
import Joi from 'joi';
import { NewEntrySchema, UpdateEntrySchema } from '../../service/validation/log-entry';

let logEntry;

function validateUpdate(expectedError) {
	Joi.validate(logEntry, UpdateEntrySchema, null, (err) => {
		if (expectedError) {
			expect(err.details.length).to.equal(1);
			return expect(err.details[0].type).to.equal(expectedError);
		}

		expect(err).to.not.exist;
	});
}

function validateCreate(expectedError) {
	Joi.validate(logEntry, NewEntrySchema, null, (err) => {
		if (expectedError) {
			expect(err.details.length).to.equal(1);
			return expect(err.details[0].type).to.equal(expectedError);
		}

		expect(err).to.not.exist;
	});
}

describe('Log entry validation' , () => {
	
	beforeEach(() => {
		logEntry = fakeLogEntry();
	});

	it('Update requires an entry Id', () => {
		logEntry.entryId = undefined;
		validateUpdate('any.required');
	});

	it('Create does not allow an entry Id', () => {
		logEntry.entryId = '088fc3b2787d4aa6f4e024d3';
		validateCreate('object.allowUnknown');
	});

	it('Entry time is a valid ISO date', () => {
		logEntry.entryTime = 'Tuesday?';
		validateCreate('date.isoDate');
	});

	it('Entry time is required', () => {
		logEntry.entryTime = undefined;
		validateCreate('any.required');
	});

	it('Bottom time cannot be zero', () => {
		logEntry.bottomTime = 0;
		validateCreate('number.positive');
	});

	it('Bottom time cannot be negative', () => {
		logEntry.bottomTime = -1;
		validateCreate('number.positive');
	});

	it('Bottom time can be fractional', () => {
		logEntry.bottomTime = 29.23;
		logEntry.totalTime = logEntry.bottomTime + 2.3;
		validateCreate();
	});

	it('Total time cannot be zero', () => {
		logEntry.bottomTime = undefined;
		logEntry.totalTime = 0;
		validateCreate('number.positive');
	});

	it('Total time cannot be negative', () => {
		logEntry.bottomTime = undefined;
		logEntry.totalTime = -4;
		validateCreate('number.positive');
	});

	it('Total time can be fractional', () => {
		logEntry.totalTime = logEntry.bottomTime + 7.38;
		validateCreate();
	});

	it('Total time cannot be less than bottom time', () => {
		logEntry.bottomTime = logEntry.bottomTime + 5;
		logEntry.totalTime = logEntry.bottomTime - 5;
		validateCreate('number.min');
	});

	it('Location is required', () => {
		logEntry.location = '';
		validateCreate('any.empty');
	});

	it('Location must be a string', () => {
		logEntry.location = true;
		validateCreate('string.base');
	});

	it('Location cannot exceed 200 characters', () => {
		logEntry.location = faker.lorem.paragraph(7);
		validateCreate('string.max');
	});

	it('Site is required', () => {
		logEntry.site = '';
		validateCreate('any.empty');
	});

	it('Site cannot exceed 200 characters', () => {
		logEntry.site = faker.lorem.paragraph(7);
		validateCreate('string.max');
	});

	it('Average depth cannot be zero', () => {
		logEntry.averageDepth = 0;
		validateCreate('number.positive');
	});

	it('Average depth cannot be negative', () => {
		logEntry.averageDepth = -3;
		validateCreate('number.positive');
	});

	it('Average depth can be fractional', () => {
		logEntry.averageDepth = logEntry.maxDepth - 2.23;
		validateCreate();
	});

	it('Max depth cannot be zero', () => {
		logEntry.maxDepth = 0;
		validateCreate('number.positive');
	});

	it('Max depth cannot be negative', () => {
		logEntry.maxDepth = -22;
		validateCreate('number.positive');
	});

	it('Max depth can be fractional', () => {
		logEntry.maxDepth += 14.35;
		validateCreate();
	});

	it('Max depth cannot be less than average depth', () => {
		logEntry.maxDepth = logEntry.averageDepth - 2;
		validateCreate('number.min');
	});

});
