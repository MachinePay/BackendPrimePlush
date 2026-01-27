const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Category = sequelize.define("Category", {
  name: { type: DataTypes.STRING, allowNull: false },
  icon: DataTypes.STRING,
});

module.exports = Category;
