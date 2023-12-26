const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty']
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0']
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A review must belong to a user.']
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'A review must belong to a tour.']
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);


reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

// populating tour and user in the review model
reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: "name"
    // }).populate({
    //     path: 'user',
    //     select: "name photo"
    // })

    this.populate({
        path: 'user',
        select: "name photo"
    })

    next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

reviewSchema.post('save', function () {
    // this points to current reviews 
    this.constructor.calcAverageRating(this.tour);
});


reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.revw = await this.clone().findOne();
    console.log(this.revw);
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    // this.revw = await this.findOne(); does not work here query is already executed
    await this.revw.constructor.calcAverageRating(this.revw.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;