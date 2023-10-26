const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: 'Please provide a valid email',
    },
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    minlength: 4,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: 'Passwords do not match',
    }
  },
  passwordChangedAt : Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active :{
    type: Boolean,
    select: false,
    default: true
  },
  role:{
    type: String,
    enum: ['user', 'admin','manager'],
    default: 'user'
  }
});

userSchema.pre('save',async function (next) {
  //only run this function if the user modify the password
  if (!this.isModified('password')) return next();
  //hash the password
  this.password =await bcrypt.hash(this.password, 12);
  // delete passwordconfirm
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next){
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next){
  this.find({active: {$ne: false}});
  next();
});

// check if password  is correct
userSchema.methods.correctPassword =async function(candidatePassword, userPassword){
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimesTamp){
  if (this.passwordChangedAt ) {
    return this.passwordChangedAt > JWTTimesTamp;
  }
  // false means that the password was not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
