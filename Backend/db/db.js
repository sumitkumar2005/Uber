const mongoose = require('mongoose');


function connectToDb() {
    mongoose.connect(process.env.MONGO_URI
    ).then(() => {
        console.log('Connected to DB');
    }).catch(err => console.log(err));
}


module.exports = connectToDb;