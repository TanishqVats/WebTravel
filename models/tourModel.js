/**
 * Mongoose Schema for Tours
 * @typedef {object} TourSchema
 * @property {string} name - The name of the tour. Must be unique, between 10 to 40 characters long.
 * @property {string} slug - The slugified version of the tour name.
 * @property {number} duration - The duration of the tour in days.
 * @property {number} maxGroupSize - The maximum number of people allowed in a tour group.
 * @property {string} difficulty - The difficulty level of the tour ('easy', 'medium', or 'difficult').
 * @property {number} ratingsAverage - The average rating of the tour, ranging from 1 to 5.
 * @property {number} ratingsQuantity - The number of ratings received for the tour.
 * @property {number} price - The regular price of the tour.
 * @property {number} priceDiscount - The discounted price of the tour, if applicable.
 * @property {string} summary - A brief summary or description of the tour.
 * @property {string} description - A detailed description of the tour.
 * @property {string} imageCover - The cover image URL of the tour.
 * @property {string[]} image - An array of image URLs related to the tour.
 * @property {Date} createdAt - The date when the tour was created.
 * @property {Date[]} startDates - An array of start dates for the tour.
 * @property {boolean} secretTour - A flag indicating whether the tour is secret or not.
 * @property {object} startLocation - The geographical start location of the tour.
 * @property {string} startLocation.type - The type of geographical location (default is 'Point').
 * @property {number[]} startLocation.coordinates - The coordinates [longitude, latitude] of the start location.
 * @property {string} startLocation.address - The address of the start location.
 * @property {string} startLocation.description - Description of the start location.
 * @property {object[]} locations - An array of tour locations.
 * @property {string} locations.type - The type of geographical location (default is 'Point').
 * @property {number[]} locations.coordinates - The coordinates [longitude, latitude] of the location.
 * @property {string} locations.address - The address of the location.
 * @property {string} locations.description - Description of the location.
 * @property {number} locations.day - The day number corresponding to the location.
 * @property {object[]} guides - An array of ObjectIds referencing User documents, representing tour guides.
 */

/**
 * Mongoose Virtuals for Tours
 * @typedef {object} TourVirtuals
 * @property {number} durationWeeks - The duration of the tour in weeks (calculated from days).
 * @property {object[]} reviews - An array of Review documents associated with the tour.
 */

/**
 * Mongoose Model representing a tour.
 * @class Tour
 * @property {TourSchema} schema - The schema definition for the Tour model.
 * @property {TourVirtuals} virtuals - The virtual properties for the Tour model.
 * @property {function} index - The indexing configuration for the Tour model.
 * @property {function} pre - Mongoose middleware that runs before specified model operations.
 * @property {function} post - Mongoose middleware that runs after specified model operations.
 */


const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

//  Model Creation using Mongoose in MongoDB
const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour Must have a name'],
            unique: true,
            trim: true,
            maxlenght: [40, "A tour name must have less than equals to 40 characters."],
            minlength: [10, "A tour name must have greater than equals to 10 characters."],
            // validate: [validator.isAlpha, 'Tour name must only contain character.']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, "A tour must have duration"]
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have a group size"]
        },
        difficulty: {
            type: String,
            required: [true, "A tour must have difficulty"],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: val => Math.round(val * 10) / 10
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour Must have a price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (value) {
                    // this only points to current doc on NEW documeent creation
                    return value < this.price
                },
                message: "Discount price ({VALUE}) should be below than regular price"
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, "A tour must have a description"]
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, "A tour must have a cover image"]
        },
        image: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// indexing
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' })

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
})

// Virtual Populating
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create( commands) 
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
})

// tourSchema.pre('save', function (next) {
//     console.log('Will Save document...');
//     next();
// })

// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// }) // .post function not only has access t5o next but also access to recently saved document

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) { //use regular expression 
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
})

tourSchema.pre(/^find/, function (next) { //populating
    this.populate({
        path: 'guides',
        select: "-__v -passwordChangeAt"
    });

    next();
})

tourSchema.post(/^find/, function (doc, next) { //use regular expression 
    console.log(`Query Took ${Date.now() - this.start} milliseconds!`);
    next();
})

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    console.log(this.pipeline());
    next();
})

const Tour = mongoose.model('Tour', tourSchema);//Tour is the model

module.exports = Tour;