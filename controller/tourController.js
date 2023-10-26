const Tour = require("../models/tourModel");
const asyncWrapper = require("../middleware/asyncWrapper");
const ApiFeatures = require("../utilits/apifeatures");
const appError = require("../utilits/appError");

const getAllTours = asyncWrapper(async (req, res, next) => {
  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  //send response
  res.status(200).json({
    state: "success",
    data: {
      tours,
    },
  });
});

const getOneTour = asyncWrapper(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    const err = appError.create('Tour not found', 404, 'fail');
    return next(err);
  }
  res.status(200).json({
    state: "success",
    data: {
      tour,
    },
  });
});

const updateTour = asyncWrapper(async (req, res, next) => {
  const TourId = req.params.id;
  const updateData = req.body;
  // const tour = await Tour.findOneAndUpdate(
  //   { _id: TourId },
  //   updateData,
  //   { new: true }
  // );
  const tour = await Tour.findByIdAndUpdate(TourId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    const err = appError.create('Tour not found', 404, 'fail');
    return next(err);
  }
  res.status(200).json({
    state: "success",
    data: {
      tour,
    },
  });
});

const addTour = asyncWrapper(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    state: "success",
    data: {
      tour: newTour,
    },
  });
});

const removeTour = asyncWrapper(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    const err = appError.create('Tour not found', 404, 'fail');
    return next(err);
  }
  res.status(200).json({
    state: "success",
    data: {
      tour: null,
    },
  });
});

const aliasTopTours = (req, res, next) => {
  (req.query.limit = "5"),
  (req.query.sort = "-ratingsAverage"),
  (req.query.fields = "name, price, ratingAverage, summary, difficulty"),
  next();
};

const getTourStatus = asyncWrapper(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        numRating: { $sum: "$ratingsQuantity" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    state: "success",
    data: {
      stats,
    },
  });
});

const getMonthlyPlan = asyncWrapper(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tour: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

module.exports = {
  getAllTours,
  getOneTour,
  addTour,
  removeTour,
  updateTour,
  aliasTopTours,
  getTourStatus,
  getMonthlyPlan,
};
