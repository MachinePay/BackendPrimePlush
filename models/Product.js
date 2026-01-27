const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
});

const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Category = require("./Category");

const Product = sequelize.define("Product", {
  name: { type: DataTypes.STRING, allowNull: false },
  image: DataTypes.STRING,
  price: { type: DataTypes.FLOAT, allowNull: false },
});

Product.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Product, { foreignKey: "categoryId" });

module.exports = Product;
