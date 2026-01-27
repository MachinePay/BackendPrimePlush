const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE_URL ||
    "postgres://usuario:senha@localhost:5432/primeplush",
  {
    dialect: "postgres",
    logging: false,
  },
);

module.exports = sequelize;
