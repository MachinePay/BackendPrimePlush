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

User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.belongsToMany(Product, { through: OrderProduct, foreignKey: "orderId" });
Product.belongsToMany(Order, {
  through: OrderProduct,
  foreignKey: "productId",
});

OrderProduct.belongsTo(Order, { foreignKey: "orderId" });
OrderProduct.belongsTo(Product, { foreignKey: "productId" });

module.exports = { Order, OrderProduct };
