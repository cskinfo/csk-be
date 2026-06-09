require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Import AFTER dotenv is loaded ──
const { uploadToFTP, deleteFromFTP } = require("./utils/ftp");

const sequelize = require("./config/database");
const Job = require("./models/Job");
const Gallery = require("./models/Gallery");
const Application = require("./models/Application");

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ─── UPLOADS FOLDER AUTO-CREATE ─────────────────────────────
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// ─── MULTER CONFIG ───────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImages = ["image/jpeg", "image/png", "image/webp"];
  const allowedDocs = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const allowed = [...allowedImages, ...allowedDocs];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend Running" });
});

// ════════════════════════════════════════════════════════════
// JOBS
// ════════════════════════════════════════════════════════════

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.findAll({ order: [["createdAt", "DESC"]] });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/jobs/:id", async (req, res) => {
  try {
    await Job.update(req.body, { where: { id: req.params.id } });
    const updated = await Job.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    await Job.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// GALLERY
// ════════════════════════════════════════════════════════════

app.get("/api/gallery", async (req, res) => {
  try {
    const items = await Gallery.findAll({ order: [["createdAt", "DESC"]] });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Upload new gallery photo ──
app.post("/api/gallery", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Upload to FTP — temp file cleanup is handled inside uploadToFTP()
    const imageUrl = await uploadToFTP(req.file.path, req.file.filename);

    const item = await Gallery.create({
      title: req.body.title,
      category: req.body.category,
      span: req.body.span,
      image: imageUrl,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Gallery upload error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ── Edit gallery item (title/category/span only — no re-upload) ──
app.put("/api/gallery/:id", async (req, res) => {
  try {
    await Gallery.update(req.body, { where: { id: req.params.id } });
    const updated = await Gallery.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Delete gallery item + FTP file ──
app.delete("/api/gallery/:id", async (req, res) => {
  try {
    const item = await Gallery.findByPk(req.params.id);

    if (item && item.image) {
      // FIX: FTP URL format is https://cskinfotech.com/csk_gallery/FILENAME
      // Must use .split("/").pop() — NOT .split("/uploads/")[1]
      const filename = item.image.split("/").pop();

      // Delete from FTP server
      await deleteFromFTP(filename);

      // Also clean any leftover local temp file (edge case)
      const localPath = path.join(uploadDir, filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await Gallery.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// APPLICATIONS
// ════════════════════════════════════════════════════════════

// ── Submit application with resume (stored locally, NOT on FTP) ──
app.post("/api/applications", upload.single("resume"), async (req, res) => {
  try {
    let resumeUrl = "";

    if (req.file) {
      // Resumes stay local — served via /uploads/ static route
     resumeUrl = await uploadToFTP(
  req.file.path,
  req.file.filename
);
    }

    const application = await Application.create({
      jobTitle: req.body.jobTitle,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      experience: req.body.experience,
      message: req.body.message,
      resume: resumeUrl,
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/applications", async (req, res) => {
  try {
    const applications = await Application.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Delete application + local resume file ──
app.delete("/api/applications/:id", async (req, res) => {
  try {
    const app_item = await Application.findByPk(req.params.id);

    if (app_item && app_item.resume) {
      // FTP URL se filename nikalo
      const filename = app_item.resume.split("/").pop();

      if (filename) {
        // FTP se file delete karo
        await deleteFromFTP(filename);

        console.log("🧹 Resume deleted from FTP:", filename);
      }
    }

    // Database record delete
    await Application.destroy({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Application delete error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// ─── START SERVER ────────────────────────────────────────────
sequelize
  .sync()
  .then(() => {
    console.log("✅ MySQL Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server Running On Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  });