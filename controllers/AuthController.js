const { User } = require("../models");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  try {
    const { name, cpf, cep, address, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      cpf,
      cep,
      address,
      phone,
      email,
      password: hashedPassword,
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Senha incorreta" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
