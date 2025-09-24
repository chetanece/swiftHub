const mongoose = require("mongoose");
const { mongoURI } = require("./config.js");

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("mongodb Connected");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
