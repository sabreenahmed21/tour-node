const express = require('express');
const router = express.Router();
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');


router.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStatus);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect,tourController.getAllTours)
  .post(tourController.addTour);

router
  .route('/:id')
  .patch(tourController.updateTour)
  .get(tourController.getOneTour)
  .delete(authController.protect,authController.restrictTo('admin', 'manager'),tourController.removeTour);

  module.exports = router;