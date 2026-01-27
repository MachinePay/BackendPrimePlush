const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  cpf: { type: DataTypes.STRING, allowNull: false, unique: true },
  cep: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM("client", "admin", "superadmin"),
    defaultValue: "client",
  },
});

module.exports = User;
