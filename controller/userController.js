const User = require("../models/userModel");
const asyncWrapper = require("../middleware/asyncWrapper");
const appError = require("../utilits/appError");

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    state: "success",
    data: {
      users,
    },
  });
});

const getOneUser = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = appError.create('User not found', 404, 'fail');
    return next(err);
  }
  res.status(200).json({
    state: "success",
    data: {
      user,
    },
  });
});

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if(allowedFields.includes(el)) {
      newObj[el] = obj[el]
    }
  });
  return newObj;
};

const updateMe = asyncWrapper(async (req, res, next) => {
  if(req.body.password || req.body.passwordConfirm) {
    return next(appError.create('This route is not for password update.', 400, 'fail'));
    }
  const filteredBody = filteredObj(req.body, 'name',' email');
  const updatedUser = User.findByIdAndUpdate(req.user.id, filteredBody, {new:true, runValidators:true});
  res.status(200).json({
    state: "success",
    data: {
      user: updatedUser
    }
  });
});

const deleteMe = asyncWrapper(async (req, res, next) => {
  await  User.findByIdAndUpdate(req.user.id,{active:false});
  res.status(200).json({
    state : "success",
    data: null
  })
});

module.exports = {
  getAllUsers,
  getOneUser,
  updateMe,
  deleteMe
}