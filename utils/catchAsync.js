module.exports = asyncFunction => {
    return (req, res, next) => {
        asyncFunction(req, res, next).catch(err => next(err));
    }
}
/* catchAsync takes a single argument which is expected to be an asynchronous function
   which takes the argument req,res and next and we can take any name in  place of 'asyncFunction'.*/