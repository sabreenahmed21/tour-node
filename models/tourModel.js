const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true, 'A tour must have a name'],
    undefined: false,
    trim: true,
    maxLength: [40, 'A tour name must be at most 40 characters'],
    minLength: [10, 'A tour name must be at least 10 characters'],
  },
  slug: String,
  duration:{
    type: Number,
    required: true
  },
  maxGroupSize:{
    type: Number,
    required: true
  },
  difficulty:{
    type: String,
    required: true,
    enum : {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty must be easy, medium or difficult'
    }
  },
  price:{
    type: Number,
    required: true
  },
  description:{
    type: String,
    trim: true
  },
  summary:{
    type: String,
    trim: true
  },
  ratingsAverage :{
    type: Number,
    default : 5.0
  },
  ratingsQuantity:{
    type: Number,
    default : 0
  },
  images:[String],
  startDates:[String],
  secretTour: {
    type: Boolean,
    default: false
  },
  imageCover:{
    type: String,
    required: true
  },
  createdAt :{
    type: Date,
    default: Date.now(),
    select:false
  },
  startDates:[Date]
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
);

tourSchema.virtual('durationsWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.pre('save', function (next){
  //console.log(this);
  this.slug = slugify(this.name, {lower: true});
  next();
});

tourSchema.pre('find', function (next){
  this.find({secretTour : {$ne: true}});
  next();
});

tourSchema.pre('aggregate', function (next){
  this.pipeline().unshift( {$match : {secretTour : {$ne: true} } } )
  console.log(this.pipeline());
  next();
})


const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

// const testtour = new tour({
//   title: 'test',
//   price: 100,
//   description: 'test',
//   category: 'test'
// })
// testtour.save().then((doc) => {console.log(doc)}).catch((err) =>{console.log(err)});
