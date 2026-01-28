const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SUPERADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "superadmin123";

exports.adminLogin = (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.json({ success: false });
};

exports.superadminLogin = (req, res) => {
  const { password } = req.body;
  if (password === SUPERADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.json({ success: false });
};
