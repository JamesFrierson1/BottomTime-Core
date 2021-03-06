import moment from 'moment';
import mongoose from './database';

const friendSchema = mongoose.Schema({
	user: {
		type: String,
		required: true,
		index: true
	},
	friend: {
		type: String,
		required: true,
		index: true
	},
	approved: {
		type: Boolean,
		index: true,
		sparse: true
	},
	requestedOn: Date,
	evaluatedOn: Date,
	reason: String
});

friendSchema.methods.toCleanJSON = function () {
	const clean = this.toJSON();
	delete clean._id;
	delete clean.__v;

	if (clean.requestedOn) {
		clean.requestedOn = moment(this.requestedOn).utc().toISOString();
	}

	if (clean.evaluatedOn) {
		clean.evaluatedOn = moment(this.evaluatedOn).utc().toISOString();
	}

	if (typeof (clean.approved) === 'undefined') {
		clean.approved = null;
	}

	return clean;
};

export default mongoose.model('Friend', friendSchema);
