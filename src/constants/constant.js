const responseMessage = {
  RESET_PASSWORD_MESSAGE: "password reset successfully",
  OTP_SENT_MESSAGE: "otp sent successfully",
  WRONG_CREDENTIAL_MESSAGE: "Incorrect email or password",
  NOT_FOUND: "Not found",
  USER_NOT_FOUND: "user not found",
  PASSWORD_RESET_FAILED: "Password reset failed",
  EMAIL_VERIFICATION_FAILED: "Email verification failed",
  CURRENT_PASSWORD_NOT_MATCH: "Current password does not match",
  PASSWORD_NOT_MATCH: "New password and confirm password do not match",
  EMAIL_ALREADY_TAKEN: "Email already taken",
  PASSWORDS_MUST_MATCH: "Both password should be same",
};

const userType = {
  USER: "user",
};
module.exports = { responseMessage, userType };
