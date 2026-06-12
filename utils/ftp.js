const ftp = require("basic-ftp");
const fs = require("fs");

// ─── UPLOAD TO FTP ───────────────────────────────────────────
async function uploadToFTP(localFilePath, fileName) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log("🚀 FTP Upload Start:", fileName);

    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: Number(process.env.FTP_PORT) || 21,
      secure: false,
    });

    console.log("✅ FTP Connected");

    // csk_gallery folder me chala jao
    await client.ensureDir(process.env.FTP_UPLOAD_DIR);

    console.log("📁 Directory OK:", process.env.FTP_UPLOAD_DIR);

    // IMPORTANT FIX
    await client.uploadFrom(
      localFilePath,
      fileName
    );

    console.log("✅ FTP Upload Success:", fileName);

    // Local temp file delete
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.warn("⚠️ Temp file cleanup failed:", err.message);
      } else {
        console.log("🧹 Local temp file deleted:", fileName);
      }
    });

    return `https://gallery.cskinfotech.com/${fileName}`;

  } catch (err) {
    console.error("❌ FTP Upload Error:", err.message);

    if (fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, () => {});
    }

    throw err;
  } finally {
    client.close();
  }
}

// ─── DELETE FROM FTP ─────────────────────────────────────────
async function deleteFromFTP(fileName) {
  if (!fileName) return;

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: Number(process.env.FTP_PORT) || 21,
      secure: false,
    });

    await client.ensureDir(process.env.FTP_UPLOAD_DIR);

    await client.remove(fileName);

    console.log("✅ FTP File Deleted:", fileName);

  } catch (err) {
    console.warn("⚠️ FTP Delete Warning:", err.message);
  } finally {
    client.close();
  }
}

module.exports = {
  uploadToFTP,
  deleteFromFTP,
};
