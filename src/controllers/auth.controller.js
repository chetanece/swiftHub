const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const emailService = require('../services/email.service');
const userService = require('../services/user.service');
const { responseMessage, userTypes } = require('../constants/constant');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');
const admin = require('../models/admin.model');

const register = catchAsync(async (req, res) => {
  const { roleType } = req.body;
  const user = await authService.register(req.body);
  const token = await tokenService.generateAuthTokens(user, req.body.roleType);
  res.status(201).send({ success: true, user, token });
});

const login = catchAsync(async (req, res) => {
  const user = await authService.login(req.body);
  console.log('User returned from login:', user);
  const tokens = await tokenService.generateAuthTokens(user);
  console.log('User returned from login:', user);
  res.status(200).send({ success: true, user, tokens });
});

const logout = catchAsync(async (req, res) => {
  const { message } = await authService.logout(req);
  res.status(201).send({ success: true, message });
});

// const refreshTokens = catchAsync(async (req, res) => {
//   const tokens = await authService.refreshAuth(req.body.refreshToken);
//   res.send({ ...tokens });
// });

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  let user = await admin.findOne({ email });
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body);
  await emailService.sendResetPasswordEmail(email, resetPasswordToken);
  return res.status(200).send({
    success: true,
    message: responseMessage.OTP_SENT_MESSAGE,  
    token: resetPasswordToken,
  });
}); 

const verifyOtp = catchAsync(async (req, res) => {
  const { otp, email } = req.query;
  const otpVerify = await emailService.verifyOtp(otp, email);
  res.send({ success: true, otpVerify, message: 'otp verified Successfully' });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body);
  const requestObj = {
    message: responseMessage.RESET_PASSWORD_MESSAGE,
  };
  let data = requestObj;
  res.send({ success: true, message: data.message });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  await emailService.sendVerificationEmail(req.body.email);
  return res.status(200).send({
    success: true,
    message: responseMessage.OTP_SENT_MESSAGE,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(201).send();
});

const changePassword = catchAsync(async (req, res) => {
  const updatedPassword = await authService.changePassword(req);
  const userData = {
    ...updatedPassword._doc,
  };
  res.status(httpStatus.OK).send({ success: true, userData });
});

// const setIsVerified = catchAsync(async (req, res) => {
//   const verified = await authService.isIdVerified(req);
//   res.status(httpStatus.OK).send({ success: true, verified });
// });



module.exports = {
  register,
  login,
  logout,
  // refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  verifyOtp,
  changePassword,
  // setIsVerified,
};
