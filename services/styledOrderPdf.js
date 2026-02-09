import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export function generateStyledOrderPdf(order, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // Pipe para response
  doc.pipe(res);

  // Centralizar logo acima do título
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  let logoHeight = 0;
  if (fs.existsSync(logoPath)) {
    // Centralizar horizontalmente
    const logoWidth = 120;
    logoHeight = 70;
    const pageWidth = doc.page.width;
    const xLogo = (pageWidth - logoWidth) / 2;
    doc.image(logoPath, xLogo, 30, { width: logoWidth });
  }
  // Cabeçalho ajustado para ficar abaixo da logo
  const headerY = 30 + logoHeight + 10;
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("PEDIDO (entre em contato para cotar seu frete 11942058445)", 0, headerY, { align: "center" });

  // Dados do cliente (usando campos reais do pedido)
  // Busca nome, email, telefone, endereço, cep
  const nomeCliente = order.userName || order.name || order.cliente || order.customerName || order.customer || "-";
  const emailCliente = order.email || order.customerEmail || order.userEmail || "-";
  const telefoneCliente = order.phone || order.telefone || order.customerPhone || order.userPhone || "-";
  const enderecoCliente = order.address || order.endereco || order.customerAddress || order.userAddress || "-";
  const cepCliente = order.cep || order.zip || order.customerCep || order.userCep || "-";
  const dadosY = headerY + 30;
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("DADOS DO CLIENTE", 40, dadosY)
    .font("Helvetica")
    .text(`Nome: ${nomeCliente}`)
    .text(`Telefone: ${telefoneCliente}`)
    .text(`E-mail: ${emailCliente}`)
    .text(`Endereço: ${enderecoCliente}`)
    .text(`CEP: ${cepCliente}`);
  // Forma de pagamento e peso
  doc
    .font("Helvetica-Bold")
    .text("FORMA DE PAGAMENTO", 350, 110)
    .font("Helvetica")
    .text(order.paymentType || order.payment_method || order.payment_method_id || order.paymentStatus || "-", 350, 125)
    .font("Helvetica-Bold")
    .text("PESO ESTIMADO", 350, 150)
    .font("Helvetica")
    .text(order.estimatedWeight || "-", 350, 165);

  // Tabela de produtos
  doc.moveDown().font("Helvetica-Bold").text("PRODUTOS", 40, 200);
  const tableTop = 220;
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Produto", 40, tableTop)
    .text("Qtd", 200, tableTop)
    .text("Valor Unit.", 250, tableTop)
    .text("Subtotal", 350, tableTop);

  // Linhas da tabela (usando estrutura real do pedido)
  // Se não encontrar nome do produto, busca no menu.json
  let menu = [];
  try {
    menu = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "menu.json"), "utf8"));
  } catch {}
  let y = tableTop + 20;
  (order.items || []).forEach((item) => {
    let nome = item.name || item.produto || item.title || item.product || item.descricao || item.description;
    if (!nome && item.id && menu.length) {
      const found = menu.find(prod => prod.id === item.id);
      if (found && found.name) nome = found.name;
    }
    if (!nome) nome = "-";
    const qtd = item.quantity || item.qtd || item.amount || 1;
    const valor = item.price !== undefined ? item.price : (item.valor_unit || item.unit_price || 0);
    doc
      .font("Helvetica")
      .text(nome, 40, y)
      .text(qtd, 200, y)
      .text(`R$ ${(valor || 0).toFixed(2)}`, 250, y)
      .text(`R$ ${(valor * qtd).toFixed(2)}`, 350, y);
    y += 20;
  });

  // Total
  doc
    .font("Helvetica-Bold")
    .text("TOTAL:", 250, y + 20)
    .text(`R$ ${(order.total !== undefined ? order.total : order.valor_total || 0).toFixed(2)}`, 350, y + 20);

  // Observações
  doc
    .font("Helvetica-Bold")
    .text("OBSERVAÇÕES", 40, y + 60)
    .font("Helvetica")
    .text(order.observation || order.observacoes || order.observacao || "-", 40, y + 75, { width: 500 });

  // Rodapé mais próximo do conteúdo
  const rodapeY = y + 60;
  doc
    .fontSize(8)
    .font("Helvetica")
    .text("CONTATO PARA CONFIRMAR PEDIDO", 40, rodapeY)
    .text("WhatsApp: (11) 94205-8445 | E-mail: orcamento@girakids.com", 40, rodapeY + 10);

  doc.end();
}
