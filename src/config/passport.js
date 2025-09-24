const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require("./config");
const User = require("../models/user.model");
const { tokenTypes } = require('./tokens');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }
    let user;
    switch (payload.userType) {
      case "user":
        user = await User.findById(payload.sub);
        break;
      default:
        throw new Error("Invalid user type");
    }
    if (!user) return done(null, false);
    done(null, { ...user.toObject(), role: payload.userType });
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
