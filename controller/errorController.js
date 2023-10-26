const appError = require("../utilits/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return  appError.create(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    data: null,
    stack: err.stack,
  });
}

const sendErrorProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    code: err.statusCode,
    message: err.message,
    data: null,
  });
}

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data : ${errors.join('. ')}`
  return appError.create(message, 400);
};

const handleErrorJwt = (err) => {
  return appError.create('Invalid token, please login again!', 401,' fail');
}

const handleTokenExpiredError = (err) => {
  return appError.create('Token has expired, please login again!', 401,' fail');
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res)
  } 
  else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (err.name === "CastError" && err.kind === "ObjectId") {
      error = handleCastErrorDB(err);
    }
    if(err.name === 'ValidationError') {
      error = handleValidationError(err);
    }
    if(err.name === 'JsonWebTokenError'){
      error = handleErrorJwt(err);
    }
    if(err.name === 'TokenExpiredError'){
      error = handleTokenExpiredError(err);
    }
    sendErrorProd(error, res)
  }
};
