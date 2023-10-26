const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const userController = require('../controller/userController');


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword',authController.protect ,authController.updatePassword);


router.patch('/updateMe', authController.protect , userController.updateMe);
router.patch('/deleteMe', authController.protect , userController.deleteMe);


router.get('/' , userController.getAllUsers);
router.get('/:id', userController.getOneUser);

module.exports = router;