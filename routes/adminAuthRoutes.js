const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminAuthController");

router.post("/auth/admin-login", ctrl.adminLogin);
router.post("/auth/superadmin-login", ctrl.superadminLogin);

module.exports = router;
