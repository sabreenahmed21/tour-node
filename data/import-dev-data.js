const fs = require('fs');
const Tour = require('./../models/tourModel');
const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});

const mongoose = require('mongoose');
const db = process.env.BASE_URL.replace('<password>',process.env.PASSWORD_URL)
mongoose.connect(db, {
  useNewUrlParser: true
}).then(() => {
  console.log('Connected to MongoDB');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tour.json`, 'utf8')); 
console.log(tours);

const importData = async()=> {
  try {
    await Tour.create(tours);
    console.log('Data Imported');
  } catch (error) {
    console.log(error);
  }
}

const deleteData = async()=> {
  try {
    await Tour.deleteMany();
    console.log('Data Deleted');
  } catch (error) {
    console.log(error);
  }
};

if(process.argv[2] ===  '--import') {
  importData();
} else if(process.argv[2] === '--delete') {
  deleteData();
}
console.log(process.argv);