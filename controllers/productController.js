const Product = require("../models/Product");

exports.getAll = async (req, res) => {
  try {
    const products = await Product.findAll();
    console.log(
      "[LOG] Produtos retornados:",
      products.map((p) => ({
        id: p.id,
        name: p.name,
        sellingPrice: p.sellingPrice,
        price: p.price,
      })),
    );
    res.json(products);
  } catch (err) {
    console.error("[LOG] Erro ao buscar produtos:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { category: req.params.categoryId },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
