const Product = require("../models/Product");

exports.getAll = async (req, res) => {
  const products = await Product.find().populate("category");
  res.json(products);
};

exports.create = async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json(product);
};

exports.getByCategory = async (req, res) => {
  const products = await Product.find({ category: req.params.categoryId });
  res.json(products);
};
