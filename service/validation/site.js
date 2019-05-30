import Joi from 'joi';
import { TagsArraySchema } from './common';

export const DiveSiteSchema = Joi.object().keys({
	name: Joi.string().required().max(200),
	location: Joi.string().max(100).allow(null),
	country: Joi.string().max(100).allow(null),
	description: Joi.string().max(1000).allow(null),
	tags: TagsArraySchema,
	gps: Joi.object().keys({
		lat: Joi.number().min(-90.0).max(90.0).required(),
		lon: Joi.number().min(-180.0).max(180.0).required()
	})
});

export const DiveSiteCollectionSchema = Joi
	.array()
	.items(DiveSiteSchema)
	.min(1)
	.max(250);

export const DiveSiteSearchSchema = Joi.object().keys({
	query: Joi.string().allow(''),
	closeTo: Joi.array().ordered(
		Joi.number().min(-180.0).max(180.0).required(),
		Joi.number().min(-90.0).max(90.0).required()
	).length(2),
	distance: Joi.number().positive().max(1000),
	count: Joi.number().integer().positive().max(1000),
	skip: Joi.number().integer().min(0),
	sortBy: Joi.string().only([ 'name' ]),
	sortOrder: Joi.string().only([ 'asc', 'desc' ])
}).with('distance', 'closeTo');