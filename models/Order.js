const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");
const Product = require("./Product");

const Order = sequelize.define("Order", {
  total: { type: DataTypes.FLOAT, allowNull: false },
  status: {
    type: DataTypes.ENUM(
      "pending_payment",
      "active",
      "completed",
      "cancelled",
      "expired",
    ),
    defaultValue: "pending_payment",
  },
  paymentMethod: { type: DataTypes.ENUM("online", "physical") },
});

const OrderProduct = sequelize.define("OrderProduct", {
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  sellingPrice: { type: DataTypes.FLOAT, allowNull: false },
  costPrice: { type: DataTypes.FLOAT, allowNull: false },
});

User.hasMany(Order);
Order.belongsTo(User);

Order.belongsToMany(Product, { through: OrderProduct });
Product.belongsToMany(Order, { through: OrderProduct });

module.exports = { Order, OrderProduct };
