const dotenv = require('dotenv');
const express = require('express');
const app = express();
const  morgan = require('morgan');
const tourRouter = require('./routs/tourRouter');
const userRouter = require('./routs/userRouter');
const globalError = require('./controller/errorController');
const rateLimit = require('express-rate-limit'); 
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp = require('hpp');

app.use(express.json());

dotenv.config({path:'./config.env'});

//set security http headers
app.use(helmet())
//development logging
if(process.env.NODE_ENV === 'development'){
  app.use(morgan('dev'));
}
//limit requests from the same api
const limiter = rateLimit({
  max: 100,
  windowMs:60 * 60 * 1000,
  message: 'Too many requests from this IP b, Please try again in an hour!'
});
app.use('/api', limiter);


//reading data from body into req.body
app.use(express.json({limit: '10kb'}));

//data santization against nosql query injection
app.use(mongoSanitize());

//prevent parameter pollution
app.use(hpp({
  whitelist : ['duration', 'price', 'difficulty', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize']
}));

//data santization against xss
app.use(xss());

//serving satic files
app.use(express.static(`${__dirname}/public`));


const mongoose = require('mongoose');
const db = process.env.BASE_URL.replace('<password>',process.env.PASSWORD_URL)
mongoose.connect(db, {
  useNewUrlParser: true
}).then(() => {
  console.log('Connected to MongoDB');
})

app.use('/api/tours', tourRouter);
app.use('/api/users',userRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: '404',
  //   message: `Not found ${req.originalUrl} on this server`
  // });
  const err = new Error (`Not found ${req.originalUrl} on this server`);
  err.statusCode = 404;
  next(err);
});
app.use(globalError);



const port = process.env.PORT || 5000;
app.listen(port ,() => {
  console.log(`Server running on port ${port}`);
});