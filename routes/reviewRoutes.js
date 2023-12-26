const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const { models } = require('mongoose');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/')
    .get(authController.restrictTo('admin', 'lead-guide'),
        reviewController.getAllReviews)
    .post(authController.restrictTo('user'),
        reviewController.setUsersIds,
        reviewController.createReview)

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'),
        reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'),
        reviewController.deleteReview);

module.exports = router;