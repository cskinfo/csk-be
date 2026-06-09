const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const Job = require("./models/Job");
const Gallery = require("./models/Gallery");
const multer = require("multer");
const path = require("path");

const Application = require(
  "./models/Application"
);

const app = express();


app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));


// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/csk")

  

  
  .then(() => console.log("✅ Mongo Connected"))
  .catch((err) => console.log(err));

  const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({
  storage,
});

// GET ALL JOBS
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// CREATE JOB
app.post("/api/jobs", async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// DELETE JOB
app.delete("/api/jobs/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// UPDATE JOB
app.put("/api/jobs/:id", async (req, res) => {
  try {
    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


app.get("/api/gallery", async (req, res) => {
  try {
    const items = await Gallery.find().sort({
      createdAt: -1,
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


app.post(
  "/api/gallery",
  upload.single("image"),
  async (req, res) => {
    try {
      const item = new Gallery({
        title: req.body.title,
        category: req.body.category,
        span: req.body.span,
        image: `http://localhost:5000/uploads/${req.file.filename}`,
      });

      await item.save();

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

app.put("/api/gallery/:id", async (req, res) => {
  try {
    const updated = await Gallery.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


app.delete("/api/gallery/:id", async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.post(
  "/api/applications",
  upload.single("resume"),
  async (req, res) => {
    try {
      const application = new Application({
        jobTitle: req.body.jobTitle,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        experience: req.body.experience,
        message: req.body.message,
        resume: req.file
          ? `http://localhost:5000/uploads/${req.file.filename}`
          : "",
      });

      await application.save();

      res.status(201).json(application);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

app.get("/api/applications", async (req, res) => {
  try {
    const applications =
      await Application.find().sort({
        createdAt: -1,
      });

    res.json(applications);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.delete(
  "/api/applications/:id",
  async (req, res) => {
    try {
      await Application.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

app.listen(5000, () => {
  console.log("🚀 Server Running On Port 5000");
});