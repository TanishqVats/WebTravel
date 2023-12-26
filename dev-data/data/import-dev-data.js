const fs = require('fs')
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel')
const Reviews = require('./../../models/reviewModel')

dotenv.config({ path: './config.env' });



const DB = process.env.DATABASE.replace(
    '<PASSWORD>', process.env.DATABASE_PASSWORD) //DB stores Database URL from config.env file


//Below method returns promise
mongoose.connect(DB, {})
    .then(() => console.log("DB connection successful"))
    .catch((error => {
        console.error("MongoDB connection failed: ", error.message)
    }));//Connect DataBase with Express using Mongoose

// Read JSON  File 
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Import Data into DB
const importData = async () => {
    try {
        await Tour.create(tours)
        await User.create(users, { validateBeforeSave: false })
        await Reviews.create(reviews)
        console.log("Data Succesfully loaded!!!")
        process.exit()
    } catch (error) {
        console.log(error)
    }
}

// Delete all data from Collection(DB)
const deleteData = async () => {
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Reviews.deleteMany()
        console.log("Data Succesfully deleted!!!")
        process.exit()
    } catch (error) {
        console.log(error)
    }
}

// console.log(process.argv)

if (process.argv[2] === "--import") {
    importData();
}
if (process.argv[2] === "--delete") {
    deleteData();
}