const fs = require('fs');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./../controllers/handlerFactory');


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.useer.id;
    next();
}

// Route Handlers
// exports.getAllUsers = catchAsync(async (req, res) => {
//     const users = await User.find();

//     // SEND RESPONSE
//     res.status(200).json({
//         status: "success",
//         requestedAT: req.requestTime,
//         result: users.length,
//         data: {
//             users
//         }
//     })
// });

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not defined use /singup instead!"
    })
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates.', 400
            )
        );
    }

    // 2) Filter out unwanted fields that are not allowed to be updates
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update User document
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false })

    res.status(204).json({
        status: "success",
        data: null,
    });
})

exports.getUser = factory.getOne(User);

// Do not update password with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.getAllUsers = factory.getAll(User);