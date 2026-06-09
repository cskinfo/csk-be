const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Job = sequelize.define(
  "Job",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    badge: DataTypes.STRING,

    badgeColor: DataTypes.STRING,

    experience: DataTypes.STRING,

    location: DataTypes.STRING,

    department: DataTypes.STRING,

    category: DataTypes.STRING,

    skills: DataTypes.STRING,

    ctaLabel: DataTypes.STRING,
  },
  {
    timestamps: true,
  }
);

module.exports = Job;