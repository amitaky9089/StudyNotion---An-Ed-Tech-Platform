const mongoose=require("mongoose");
require("dotenv").config();

exports.connect=()=>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=>console.log("Connection with database successful."))
    .catch((error)=>{
        console.error(error);
        console.log("Issue in database connection.")
        process.exit(1);
    })
};