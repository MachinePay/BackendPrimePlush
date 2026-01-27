const { User } = require("../models");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  try {
    console.log("Tentativa de cadastro:", req.body);
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
    console.log("Usuário cadastrado com sucesso:", user.email);
    res.status(201).json(user);
  } catch (err) {
    console.error("Erro no cadastro:", err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("Tentativa de login:", req.body.email);
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.warn("Login falhou: usuário não encontrado:", email);
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.warn("Login falhou: senha incorreta para:", email);
      return res.status(401).json({ error: "Senha incorreta" });
    }
    console.log("Login bem-sucedido:", email);
    res.json({ user });
  } catch (err) {
    console.error("Erro no login:", err.message);
    res.status(500).json({ error: err.message });
  }
};
