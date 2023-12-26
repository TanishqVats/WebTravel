
const { json } = require('express');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');
// const Review = require('../models/reviewModel');

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// Route Handlers

exports.aliasTopTours = async (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    next();
}


// exports.getAllTours = catchAsync(async (req, res, next) => {

//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();

//     const tours = await features.query;

//     // const tours = await Tour.find()
//     //     .where(duration).equals(5)
//     //     .where(difficulty).equals("easy")

//     // SEND RESPONSE
//     res.status(200).json({
//         status: "success",
//         requestedAT: req.requestTime,
//         result: tours.length,
//         data: {
//             tours
//         }
//     })

// });
exports.getAllTours = factory.getAll(Tour);


// exports.getTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews');

//     if (!tour) {
//         return next(new AppError('No tour found with ID', 404));
//     }

//     res.status(200).json({
//         status: "success",
//         data: {
//             tour
//         }
//     });

// });
exports.getTour = factory.getOne(Tour, { path: 'reviews' });


// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body)

//     res.status(201).json({
//         status: "success",
//         data: {
//             tour: newTour
//         }
//     });
// });
exports.createTour = factory.createOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findOneAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     });

//     if (!tour) {
//         return next(new AppError('No tour found with ID', 404));
//     }

//     res.status(200).json({
//         status: "success",
//         data: {
//             tour
//         }
//     });

// });
exports.updateTour = factory.updateOne(Tour);


// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findOneAndDelete(req.params.id)

//     if (!tour) {
//         return next(new AppError('No tour found with ID', 404));
//     }

//     res.status(204).json({
//         status: "success",
//         data: null
//     });
// });
exports.deleteTour = factory.deleteOne(Tour);

// AGGREGATION

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                // _id: '$ratingsAverage',
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ])

    res.status(200).json({
        status: "success",
        data: {
            stats
        }
    });
});


exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numToursStarts: -1
            }
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: "success",
        result: plan.length,
        data: {
            plan
        }
    });

});

// When we have multiple export we will make those an object of 'exports'.

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format  lat,lng',
                400)
        );
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[Number(lng), Number(lat)], radius]
            }
        }
    });

    res.status(200).json({
        status: 'success',
        result: tours.length,
        data: {
            data: tours
        }
    })
});