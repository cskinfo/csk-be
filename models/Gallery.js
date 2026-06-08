const mongoose = require("mongoose");

const GallerySchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    image: String,
    span: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", GallerySchema);