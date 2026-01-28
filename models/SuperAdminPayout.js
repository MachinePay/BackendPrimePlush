const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SuperAdminPayout = sequelize.define("SuperAdminPayout", {
  amount: { type: DataTypes.FLOAT, allowNull: false },
  receivedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  notes: { type: DataTypes.STRING }, // opcional, para observações
});

module.exports = SuperAdminPayout;
