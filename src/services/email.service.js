const nodemailer = require('nodemailer');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const Otp = require('../models/otpSent.model');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const transport = nodemailer.createTransport(config.email.smtp);

if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

const sendResetPasswordEmail = async (to, userID) => {
  const subject = 'Reset password';
  const token = jwt.sign({ userID: userID }, 'thisisasamplesecret', { expiresIn: '1h' });
  const code = Math.floor(100000 + Math.random() * 900000);
  await Otp.create({
    otp: code,
    email: to,
    method: 'forgot-password',
    lastOtpSentTime: new Date(),
  });

  const text = `Dear user,
  To reset your password:
  - Use this verification code: ${code}
  If you didn't request this, please ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendVerificationEmail = async (email) => {
  const user = await User.findOne({ email });
  if (user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'email already registered');
  }
  const subject = 'Email Verification';
  const code = Math.floor(100000 + Math.random() * 900000);
  await Otp.create({
    otp: code,
    email: email,
    method: 'verify Email',
    lastOtpSentTime: new Date(),
  });
  const text = `Dear user, to verify your email:
- Use this code: ${code}  
If you didn't create an account, please ignore this email.`;

  await sendEmail(email, subject, text);
};

const verifyOtp = async (otp, email) => {
  const isOtpValid = await Otp.findOne({
    $and: [{ otp }, { email }],
  });
  if (!isOtpValid) {
    throw new ApiError(httpStatus.NOT_FOUND, 'please provide correct otp!');
  }
  if (new Date().getTime() > new Date(isOtpValid.lastOtpSentTime).getTime() + 10 * 60 * 10000) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Otp Expired!');
  }
  await Otp.deleteMany({ email });
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  verifyOtp,
};
