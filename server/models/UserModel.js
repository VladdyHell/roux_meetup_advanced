const { Schema, model } = require('mongoose');
const emailValidator = require('email-validator');
const isValidUsername = require('is-valid-username');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const UserSchema = Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			index: { unique: true },
			minlength: 3,
			validate: {
				validator: isValidUsername,
				message: (props) => `${props.value} is not valid username!`,
			},
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			index: { unique: true },
			validate: {
				validator: emailValidator.validate,
				message: (props) => `${props.value} is not valid email address!`,
			},
		},
		password: {
			type: String,
			required: true,
			trim: true,
			index: { unique: true },
			minlength: 8,
		},
		avatar: String,
	},
	{
		timestamps: true,
	}
);

UserSchema.pre('save', async function preSave(next) {
	const user = this;
	user.set('foo.bar', 'baz');

	if (!user.isModified('password')) return next();

	try {
		const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
		user.password = hash;

		return next();
	} catch (e) {
		return next(e);
	}
});

UserSchema.methods.comparePassword = async function comparePassword(candidate) {
	return bcrypt.compare(candidate, this.password);
};

module.exports = model('User', UserSchema);
