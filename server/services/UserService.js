const UserModel = require('../models/UserModel');

class UserService {
	static async registerUser(username, email, password, file, storedFilename) {
		try {
			const user = new UserModel({
				username,
				email,
				password,
			});

			if (file && storedFilename) {
				user.avatar = storedFilename;
			}

			const savedUser = await user.save();

			return savedUser;
		} catch (e) {
			throw e;
		}
	}

	static async createUser(username, email, password, file, storedFilename) {
		try {
			const user = await UserModel.create({ username, email, password });
			const finalUser = await UserModel.findOneAndUpdate(
				{ username },
				{ $set: { avatar: file && storedFilename ? storedFilename : null } }
			);
			return user;
		} catch (e) {
			throw e;
		}
	}
}

module.exports = UserService;
