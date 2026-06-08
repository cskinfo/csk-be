const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: String,
    badge: String,
    badgeColor: String,
    experience: String,
    location: String,
    department: String,
    category: String,
    skills: String,
    ctaLabel: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", JobSchema);