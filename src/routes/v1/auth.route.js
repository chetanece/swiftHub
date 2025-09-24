     const express = require('express');
     const validate = require('../../middleware/validate');
     const authValidation = require('../../validation/auth.validation');
     const authController = require('../../controllers/auth.controller');
     const auth = require('../../middleware/auth');

     const router = express.Router();

     router.post('/registerAdmin',
     validate(authValidation.register), authController.register);
     router.post('/login', validate(authValidation.login), authController.login);
     router.post('/sendVerificationEmail', authController.sendVerificationEmail);
     router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
     router.get('/verify-otp', authController.verifyOtp);
     router.post('/reset-password', authController.resetPassword);
     // router.put('/change-password/:id', auth(), validate(authValidation.changePassword), authController.changePassword);
     router.post('/logout', authController.logout);
     router.put('/isVerified', validate(authValidation.isVerified), authController.setIsVerified);
     module.exports = router;