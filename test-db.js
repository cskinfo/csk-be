const sequelize = require("./config/database");

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ MySQL Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ Connection Error:", err);
  });