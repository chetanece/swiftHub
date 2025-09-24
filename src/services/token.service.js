const jwt = require("jsonwebtoken");
const moment = require("moment");
const httpStatus = require("http-status");
const config = require("../config/config");
const userService = require("./user.service");
const Token = require("../models/token.model");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");
const { userType } = require("../constants/constant");
const User = require("../models/user.model");

const generateToken = (
  userId,
  userType,
  expires,
  type,
  secret = config.jwt.secret
) => {
  const payload = {
    sub: userId,
    userType,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  console.log("payload122", payload, "secreteeee", secret);
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
  });
  return tokenDoc;
};

const verifyToken = async (token, type) => {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log("Decoded Token", payload);

    const tokenDoc = await token.findOne({
      token,
      type,
      user: payload.sub,
    });
    if (!tokenDoc) {
      throw new Error("Token not found");
    }
    tokenDoc.userType = payload.userType;

    return tokenDoc;
  } catch (error) {
    throw new Error("Token verification failed: " + error.message);
  }
};

const generateAuthTokens = async (user, userType) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes,'minutes');
  const accessToken = generateToken( user.id,userType,accessTokenExpires,tokenTypes.ACCESS);
  console.log('accessToken', accessToken);
  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays,'days')
  const refreshToken = generateToken(user.id, userType,refreshTokenExpires,tokenTypes.REFRESH);
  console.log('refreshToken', refreshToken);
  await saveToken(refreshToken,user.id,refreshTokenExpires,tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires:  accessTokenExpires.toDate() ,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const generateResetPasswordToken = async(userBody) => {
  const user = await checkuserByEmail(userBody.email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes,'minutes');
  const resetPasswordToken = generateToken(user.id,expires,tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken,user.id,expires,tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
}

const generateVerifyEmailToken = async(user) => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes,"minutes");
    const verifyEmailToken = generateToken(verifyEmailToken,user.id,expires,tokenTypes.VERIFY_EMAIL);
    await saveToken(verifyEmailToken,user.id, expires,tokenTypes.VERIFY_EMAIL);
}
const checkUserByEmail = async (email) => {
  const user = await User.findOne({ email }); 
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'No user found with this email'); 
  return user;
};

module.exports =  {
  generateAuthTokens,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  checkUserByEmail
}
