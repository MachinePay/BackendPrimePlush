const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Category = require("./Category");

const Product = sequelize.define("Product", {
  name: { type: DataTypes.STRING, allowNull: false },
  image: DataTypes.STRING,
  costPrice: { type: DataTypes.FLOAT, allowNull: false },
  sellingPrice: { type: DataTypes.FLOAT, allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false },
  minStock: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.STRING },
});

Product.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Product, { foreignKey: "categoryId" });

module.exports = Product;
