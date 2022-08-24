const express = require('express');
const { readToken } = require('../config/encrypt');
const { uploader } = require('../config/uploader');
const { authController } = require('../controllers');
const route = express.Router();

const uploadeFile = uploader('/imgProfile', 'IMGPROF').array('profile_img', 1)

route.get('/all', authController.getData);
route.post('/register', authController.register);
route.post('/login', authController.login);
route.get('/keep', readToken, authController.keepLogin);
route.patch('/edit/:id', authController.editProfile);
route.patch('/editPicts/:id', uploadeFile, authController.editProfileImg);
route.get('/sendverify', readToken, authController.sendVerify);
route.patch('/verify', readToken, authController.verify);
route.get('/reset/:idusers', authController.sendResetPassword);
route.patch('/reset', readToken, authController.resetPassword);


module.exports = route;