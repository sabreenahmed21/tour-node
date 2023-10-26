const asyncWrapper = require('../middleware/asyncWrapper');
const User = require('../models/userModel');
const jwt  = require('jsonwebtoken');
const appError = require('../utilits/appError');
const sendMail = require('../utilits/email');
const crypto = require('crypto');


const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRATION,
  });
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions =
  {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token,cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status:'success',
    token,
    data: {
      user
    }
  })
}

const signup =asyncWrapper (async (req, res, next) => {
  // const { name, email, password, passwordConfirm } = req.body;
  // const user = await User.findOne({ email });
  // if (user) {
  //   return res.status(400).json({ error: 'User already exists' });
  // }
  // const newUser = new User({
  //   name,
  //   email,
  //   password,
  //   passwordConfirm,
  // });
  // const savedUser = await newUser.save();
  // res.status(201).json(savedUser);
  //! or
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
});

const login =asyncWrapper (async (req, res, next) => {
  const {email, password} = req.body;
  //1) check if email & password already exists
  if (!email || !password) {
    return next(appError.create('Please provide your Email and Password', 400, 'fail'));
  }
  //2) check if user already exists & password is correct
  const user = await User.findOne({email }).select('+password');
  const correct = await user.correctPassword(password, user.password);
  if (!user ||!correct) {
    return next(appError.create('Invalid email or password', 401, 'fail'));
  }
  //3) check if everything ok , send token to client
  createSendToken(user, 200, res)
});

const protect = asyncWrapper(async (req, res, next) => {
  // 1) Getting the token and checking if it's there
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(appError('You are not logged in! Please log in to get access', 401, 'fail'));
    }
  //2) verification token 
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //3) check if user still exists
  const user = await User.findById(decoded.id);
  if(!user) {
    return next(appError('User belonging to this token does not longer exist.', 404, 'fail'))
  }
  //4) check if user is still active
  if(user.isActive === false) {
    return next(appError('Your account has been deactivated', 401, 'fail'))
  }
  //5) check if user changed password after token was issued
  if(user.changedPasswordAfter(decoded.iat)) {
    return next(appError('User recently changed password! Please login again', 401, 'fail'))
  }
  //6) if everything ok, save user in req
  req.user = user;
  next();
});

const restrictTo = (...roles) => {
  return async (req, res, next) => {
    if(!roles.includes(req.user.role)) {
      return next(appError.create('You are not permission to do this action', 403, 'fail'))
    }
    next();
  }
};

const forgetPassword = asyncWrapper(async(req, res, next)=>{
  //1) get user based on email
  const user = await User.findOne({email :req.body.email});
  if(!user) {
    return next(appError.create('There is no user with bemail address', 404, 'fail'));
  };
  //2) create reset token
  const resetToken = await user.createPasswordResetToken();
  await user.save({validateBeforeSave : false});
  //3) send email
  try{
    sendMail({
      email: user.email,
      subject: 'Password Reset',
      message: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`
    });
    res.status(200).json({
      status:'success',
      message: 'An email has been sent to you with further instructions'
    })
  } catch (err) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save({validateBeforeSave : false});
    return next(appError.create('There was an error sending the email. Please try again!', 500, 'error'))
  }
});

const resetPassword =asyncWrapper (async(req, res, next)=>{
   // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(appError.create('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Log the user in, send JWT
  createSendToken(user, 200, res)
});

const updatePassword =asyncWrapper (async (req, res, next) => {
  //1) get user from collection
    const user = await User.findById(req.user.id).select('+password');
    if(!user) {
      return next(appError.create('User not found', 404, 'fail'));
    };
  //2) check if current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return next(appError.create('Your current password is wrong', 400, 'fail'));
    }
  //3) update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = Date.now();
  await user.save();
  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgetPassword,
  resetPassword,
  updatePassword
}