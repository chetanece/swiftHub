const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const User = require('../models/user.model');
const admin = require('../models/admin.model');
const { responseMessage, userTypes } = require('../constants/constant');

const { isVerified } = require('../validation/auth.validation');
const { successHandler } = require('../config/morgan');

const register = async (userBody) => {
  const { roleType, email, firstName, lastName, password, fcmToken } = userBody;
  console.log('userBody', userBody);

  const emailTakenInUser = await admin.isEmailTaken(email);
  if (emailTakenInUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Email already registered as another user`);
  }
  // const phoneTakenInUser = await admin.isPhoneNumberTaken(phoneNumber);
  // if (phoneTakenInUser) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already taken');
  // }
  const userData = {
    ...userBody,
    fcmToken,
  };

  const newUser = await admin.create(userData);
  return newUser;
};

const login = async (userBody) => {
  const { email, password, fcmToken } = userBody;
  let user = await admin.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid credentials');
  }
  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password is required');
  }
  const isPasswordCorrect = await user.isPasswordMatch(password);
  if (!isPasswordCorrect) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid credentials');
  }
  user.fcmToken = fcmToken;
  await user.save();
  return user;
};

// const getUserByPhoneNumber = async (req) => {
//   const userExist = await User.findOne({
//     _id: req.user._id,
//   });
//   if (!userExist) {
//     throw new Error('User does not exist');
//   }
//   const { phoneNumber } = req.query;
//   let user = await User.findOne({ phoneNumber: phoneNumber });
//   if (!user) {
//     user = await subAdmin.findOne({ phoneNumber: phoneNumber });
//   }
//   return user;
// };

// const getUsersById = async (req) => {
//   const userExist = await User.findOne({ _id: req.user._id });
//   if (!userExist) {
//     throw new Error('User does not exist');
//   }
//   const id = req.body.id;
//   if (!Array.isArray(id) || id.length === 0) {
//     throw new Error('Please provide a valid array of user IDs in the body.');
//   }
//   const usersFromUser = await User.find({ _id: { $in: id } });
//   const usersFromSubAdmin = await subAdmin.find({ _id: { $in: id } });
//   const allUsers = [...usersFromUser, ...usersFromSubAdmin];

//   return allUsers;
// };

const logout = async (req) => {
  const { refreshToken } = req.body;
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, responseMessage.NOT_FOUND);
  }
  // Find the user by the ID stored in the refresh token
  const userId = refreshTokenDoc.user;
  await Token.deleteOne({ _id: refreshTokenDoc._id });
  await admin.findOneAndUpdate({ _id: userId }, { $set: { fcmToken: null } });
  return {
    message: 'User logged out successfully',
  };
};

// const refreshAuth = async (refreshToken) => {
//   try {
//     const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
//     const user = await userService.getUserById(refreshTokenDoc.user);
//     if (!user) {
//       throw new Error();
//     }
//     await refreshTokenDoc.remove();
//     return tokenService.generateAuthTokens(user);
//   } catch (error) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, error.message);
//   }
// };

const resetPassword = async (resetPasswordToken, userBody) => {
  try {
    const { password, confirmNewPassword } = userBody;
    if (password !== confirmNewPassword) {
      throw new Error('Passwords do not match');
    }
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    console.log('Token Payload:', resetPasswordTokenDoc);
    const userType = resetPasswordTokenDoc.userType;
    const user = await checkUserById(resetPasswordTokenDoc.user, userType);
    if (!user) {
      throw new Error(responseMessage.USER_NOT_FOUND);
    }
    await updateUserById(user.id, userType, { password });
    await Token.deleteMany({
      user: user.id,
      type: tokenTypes.RESET_PASSWORD,
    });

    console.log('Password reset successfully');
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, error.message);
  }
};

const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.admin);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, responseMessage.EMAIL_VERIFICATION_FAILED);
  }
};

const changePassword = async (req) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.params.id;
    const userRole = req.user;
    const userType = userRole.userType;
    console.log('userRole', userRole);
    const user = await checkUserById(userId, userType);
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, responseMessage.USER_NOT_FOUND);
    }
    if (userRole.role !== 'admin' && !(await user.isPasswordMatch(currentPassword))) {
      throw new ApiError(httpStatus.BAD_REQUEST, responseMessage.CURRENT_PASSWORD_NOT_MATCH);
    }
    if (newPassword !== confirmPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, responseMessage.PASSWORD_NOT_MATCH);
    }
    const updatedUser = await updateUserById(userId, userType, { password: newPassword });
    return updatedUser;
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};

const checkUserById = async (userId, role) => {
  let userData;
  switch (role) {
    case userTypes.USER:
      userData = await userService.getUserById(userId);
      break;
    case userTypes.ADMIN:
      userData = await admin.findById(userId);
      break;
    default:
      throw new Error('Invalid user type');
  }
  return userData;
};

const updateUserById = async (userId, role, password) => {
  let userData;
  switch (role) {
    case userTypes.USER:
      userData = await userService.updateUserById(userId, password);
      break;
    case userTypes.ADMIN:
      userData = await admin.findByIdAndUpdate(userId, password, { new: true });
      break;
    default:
      throw new Error('Invalid user type');
  }
  return userData;
};

// const isIdVerified = async (req) => {
//   const { userId } = req.query;

//   if (!userId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'UserId is required');
//   }

//   const user = await User.findById(userId);

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
//   }

//   // if (user.isProfileVerified === req.body.isProfileVerified) {
//   //   throw new ApiError(httpStatus.BAD_REQUEST, 'User is already verified');
//   // }

//   const verified = await User.findByIdAndUpdate({ isProfileVerified: req.body.isProfileVerified }, { new: true });

//   return verified;
// };
// const isIdVerified = async (req) => {
//   const { userId } = req.query;

//   if (!userId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'UserId is required');
//   }

//   const user = await User.findById(userId);

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
//   }

//   // Optional check if the same value is already set
//   if (user.isProfileVerified === req.body.isProfileVerified) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'User is already Verified');
//   }

//   const verified = await User.findByIdAndUpdate(
//     userId, // <-- ID
//     { isProfileVerified: req.body.isProfileVerified }, // <-- update
//     { new: true } // <-- options
//   );

//   return verified;
// };


module.exports = {
  register,
  login,
  logout,
  // refreshAuth,
  resetPassword,
  verifyEmail,
  changePassword,
  // getUserByPhoneNumber,
  // getUsersById,

};
