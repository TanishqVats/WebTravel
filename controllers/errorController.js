const AppError = require('./../utils/appError')

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateFieldDB = err => {
    const value = err.keyValue.name;
    // console.log(value);

    const message = `Duplicate field values ${value}. Please use another value.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input Data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid Token. Please log in again', 401);

const handleJWTExpireError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (error, res) => {
    res.status(error.statusCode).json({
        status: error.status,
        error: error,
        message: error.message,
        stack: error.stack
    })
}

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    // console.log(err.isOperational)
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    }
    // Programming or other errors: don't leak error details
    else {
        // 1) Log error 
        // console.error('Error', error)

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }
}

module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        console.log(Object.values(error));
        sendErrorDev(error, res);
    } else if (process.env.NODE_ENV === 'production ') {
        let err = Object.assign({}, error); //Shallow copy of error object
        // console.log(err);
        if (err.name === "CastError") err = handleCastErrorDB(err);
        if (err.code === 11000) err = handleDuplicateFieldDB(err);
        if (err._message == "Validation failed") err = handleValidationErrorDB(err);
        if (err.name === "JsonWebTokenError") err = handleJWTError();
        if (err.name === "TokenExpiredError") err = handleJWTExpireError();


        sendErrorProd(err, res);
    }
}