const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('Unhandled Exception');
    console.log(err.name, err.message);
    process.exit(1);
})


const package = require('./package.json')
dotenv.config({ path: './config.env' });

const app = require('./app');

// if (package.scripts['start:prod'] === 'nodemon server.js NODE_ENV=production') {
//     process.env.Node_ENV = 'production'
// }

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD) //DB stores Database URL from config.env file

//Below method returns promise
mongoose.connect(DB, {})
    .then(() => console.log("DB connection successful"))
    .catch((error => {
        console.error("MongoDB connection failed: ", error.message)
    }));//Connect DataBase with Express using Mongoose



//testTour is instance of model Tours

// const testTour = new Tour({
//     name: "The Park Camper",
//     price: 997
// });

// testTour.save().then(doc => {
//     console.log(doc);
// }).catch(err => {
//     console.log("Error: ", err)
// });

// console.log(app.get('env'))
// console.log(process.env)

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
    console.log('Unhandled Rejection');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

