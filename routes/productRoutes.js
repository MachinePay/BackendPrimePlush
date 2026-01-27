const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/", productController.getAll);
router.post("/", productController.create);
router.get("/category/:categoryId", productController.getByCategory);

module.exports = router;
