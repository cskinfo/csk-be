const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    jobTitle: String,
    name: String,
    email: String,
    phone: String,
    experience: String,
    message: String,
    resume: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Application",
  ApplicationSchema
);