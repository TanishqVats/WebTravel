const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanatize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));




// 1. GLOBAL MIDDLEWARES

//To serve static file
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));


// Set Security HTTP headers
app.use(helmet());

// Development Looging
if (process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
    max: 10,
    windowMS: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
})

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" })); //middleware

// Data Sanitization against NoSQL query injection
app.use(mongoSanatize());

// Data Sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());


// app.use((req, res, next) => {
//     console.log('Hello from middleware');
//     next();
// });

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
});

/*
app.get(('/'),(req,res)=>{
    res
    .status(200)
    .json({message:"Hello from the server side!",app:"Natours"});
}); 

app.post(('/'),(req,res)=>{
    res.send("You can post to this endpoint...")
})
*/

// 3.ROUTES
// app.get(('/api/v1/tours'),getAllTours);
// app.get(('/api/v1/tours/:id'),getTour); //:id is a variable that will store the value
// app.post(('/api/v1/tours'),createTour);
// app.patch(('/api/v1/tours/:id'),updateTour);
// app.delete(('/api/v1/tours/:id'),deleteTour);

// Mount routers
app.get('/', (req, res) => {
    res.status(200).render('base');
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handling Unhandled routes
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server!`
    // })

    // const error = new Error(`Can't find ${req.originalUrl} on this server!`);
    // error.status = 'fail';
    // error.statusCode = 404;



    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})

app.use(globalErrorHandler);

// 4. START SERVER

module.exports = app;
