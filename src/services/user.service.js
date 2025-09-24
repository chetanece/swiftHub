const httpStatus = require('http-status');
const admin = require('../models/admin.model');
const ApiError = require('../utils/ApiError');
const { responseMessage } = require('../constants/constant');

const queryUsers = async (filter, options) => {
  const admin = await admin.paginate(filter, options);
  return users;
};

const getUserById = async (id) => {
  return admin.findById(id);
};

const getUserByEmail = async (email) => {
  return admin.findOne({ email });
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, responseMessage.USER_NOT_FOUND);
  }
  if (user.email && (await User.isEmailTaken(user.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, responseMessage.EMAIL_ALREADY_TAKEN);
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, responseMessage.USER_NOT_FOUND);
  }
  await user.remove();
  return user;
};


module.exports = {
  queryUsers,
  getUserById,
  getUserByEmail,
  deleteUserById,
  updateUserById,
};
