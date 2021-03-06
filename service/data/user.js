import _ from 'lodash';
import moment from 'moment';
import mongoose from './database';

const userSchema = mongoose.Schema({
	usernameLower: {
		type: String,
		unique: true,
		required: true
	},
	emailLower: {
		type: String,
		unique: true,
		required: true
	},
	username: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	googleId: {
		type: String,
		unique: true,
		sparse: true
	},
	role: {
		type: String,
		required: true,
		index: true,
		default: 'user'
	},
	createdAt: {
		type: Date,
		required: true
	},
	passwordHash: String,
	passwordResetToken: String,
	passwordResetExpiration: Date,
	isLockedOut: {
		type: Boolean,
		required: true,
		default: false
	},
	logsVisibility: {
		type: String,
		required: true,
		default: 'friends-only'
	},
	weightUnit: {
		type: String,
		default: 'kg',
		required: true
	},
	distanceUnit: {
		type: String,
		default: 'm',
		required: true
	},
	temperatureUnit: {
		type: String,
		default: 'c',
		required: true
	},
	pressureUnit: {
		type: String,
		default: 'bar',
		required: true
	},
	firstName: String,
	lastName: String,
	location: String,
	occupation: String,
	gender: String,
	birthdate: Date,
	typeOfDiver: String,
	startedDiving: Number,
	certificationLevel: String,
	certificationAgencies: String,
	specialties: String,
	about: String
});

userSchema.statics.findByUsername = function (username, done) {
	return this.findOne({ usernameLower: username.toLowerCase() }, done);
};

userSchema.statics.findByEmail = function (email, done) {
	return this.findOne({ emailLower: email.toLowerCase() }, done);
};

userSchema.methods.getAccountJSON = function () {
	let hasPassword = false;
	if (this.passwordHash) {
		hasPassword = true;
	}

	const clean = {
		..._.pick(
			this.toJSON(),
			[
				'username',
				'email',
				'role',
				'isLockedOut',
				'weightUnit',
				'distanceUnit',
				'pressureUnit',
				'temperatureUnit'
			]),
		isAnonymous: false,
		hasPassword,
		createdAt: moment(this.createdAt).utc().toISOString()
	};

	return clean;
};

userSchema.methods.getProfileJSON = function () {
	return {
		..._.pick(
			this.toJSON(),
			[
				'logsVisibility',
				'firstName',
				'lastName',
				'location',
				'occupation',
				'gender',
				'typeOfDiver',
				'startedDiving',
				'certificationLevel',
				'certificationAgencies',
				'specialties',
				'about',
				'weightUnit',
				'distanceUnit',
				'temperatureUnit',
				'pressureUnit'
			]
		),
		memberSince: moment(this.createdAt).toISOString(),
		birthdate: this.birthdate ? moment(this.birthdate).local().format('YYYY-MM-DD') : null
	};
};

userSchema.methods.getFriendlyName = function () {
	return this.firstName || this.username;
};

userSchema.methods.getFullName = function () {
	if (this.firstName && this.lastName) {
		return `${ this.firstName } ${ this.lastName }`;
	}

	return this.firstName || this.username;
};

export default mongoose.model('User', userSchema);

export function cleanUpUser(user) {
	if (!user) {
		return {
			username: 'Anonymous_User',
			email: '',
			createdAt: null,
			role: 'user',
			isAnonymous: true,
			isLockedOut: false
		};
	}

	return user.getAccountJSON();
}
