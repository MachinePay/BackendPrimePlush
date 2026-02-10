import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export function generateStyledOrderPdf(order, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  // Centralizar logo com espaçamento adequado
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  let y = 40;
  if (fs.existsSync(logoPath)) {
    const logoWidth = 120;
    const logoHeight = 120;
    const pageWidth = doc.page.width;
    const xLogo = (pageWidth - logoWidth) / 2;
    doc.image(logoPath, xLogo, y, { width: logoWidth, height: logoHeight });
    y += logoHeight + 30; // Mais espaço após logo
  }

  // Título
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("PEDIDO (entre em contato para cotar seu frete 11942058445)", 0, y, {
      align: "center",
    });
  y += 40;

  // Dados do cliente
  const nomeCliente =
    order.userName ||
    order.name ||
    order.cliente ||
    order.customerName ||
    order.customer ||
    "-";
  const emailCliente =
    order.email ||
    order.customerEmail ||
    order.userEmail ||
    order.contactEmail ||
    "-";
  const telefoneCliente =
    order.phone ||
    order.telefone ||
    order.customerPhone ||
    order.userPhone ||
    order.contactPhone ||
    "-";
  const enderecoCliente =
    order.address ||
    order.endereco ||
    order.customerAddress ||
    order.userAddress ||
    order.contactAddress ||
    "-";
  const cepCliente =
    order.cep ||
    order.zip ||
    order.customerCep ||
    order.userCep ||
    order.contactCep ||
    "-";
  // Bloco lado a lado
  const leftX = 40;
  const rightX = 340;
  const blocoY = y;
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("DADOS DO CLIENTE", leftX, blocoY)
    .font("Helvetica")
    .text(`Nome: ${nomeCliente}`, leftX, blocoY + 18)
    .text(`Telefone: ${telefoneCliente}`, leftX, blocoY + 36)
    .text(`E-mail: ${emailCliente}`, leftX, blocoY + 54)
    .text(`Endereço: ${enderecoCliente}`, leftX, blocoY + 72)
    .text(`CEP: ${cepCliente}`, leftX, blocoY + 90);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("FORMA DE PAGAMENTO", rightX, blocoY)
    .font("Helvetica")
    .text(
      order.paymentType ||
        order.payment_method ||
        order.payment_method_id ||
        order.paymentStatus ||
        "-",
      rightX,
      blocoY + 18,
    );

  y = blocoY + 110;

  // Tabela de produtos
  doc.font("Helvetica-Bold").fontSize(14).text("PRODUTOS", 40, y);
  y += 24;
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Produto", 40, y)
    .text("Qtd", 200, y)
    .text("Valor Unit.", 250, y)
    .text("Subtotal", 350, y);
  y += 18;
  // Exibe produtos comprados
  (order.items || []).forEach((item) => {
    const nome =
      item.name ||
      item.produto ||
      item.title ||
      item.product ||
      item.descricao ||
      item.description ||
      "-";
    const qtd = item.quantity || item.qtd || item.amount || 1;
    const valor =
      item.price !== undefined
        ? item.price
        : item.valor_unit || item.unit_price || 0;
    doc
      .font("Helvetica")
      .fontSize(11)
      .text(nome, 40, y)
      .text(qtd, 200, y)
      .text(`R$ ${(valor || 0).toFixed(2)}`, 250, y)
      .text(`R$ ${(valor * qtd).toFixed(2)}`, 350, y);
    y += 16;
  });

  // Total
  y += 10;
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("TOTAL:", 250, y)
    .text(
      `R$ ${(order.total !== undefined ? order.total : order.valor_total || 0).toFixed(2)}`,
      350,
      y,
    );
  y += 32;

  // Observações
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("OBSERVAÇÕES", 40, y)
    .font("Helvetica")
    .fontSize(11)
    .text(
      order.observation || order.observacoes || order.observacao || "-",
      40,
      y + 18,
      { width: 500 },
    );
  y += 44;

  // Detalhes extra para pagamento presencial (apenas uma vez)
  if (
    (order.paymentType || order.payment_method || order.payment_method_id) ===
    "presencial"
  ) {
    const tipoPagamento =
      order.paymentMethod ||
      order.payment_method ||
      order.payment_method_id ||
      "-";
    const vezes =
      order.installments ||
      order.parcelas ||
      order.qtdParcelas ||
      order.paymentInstallments ||
      1;
    let tipoDesc = "";
    if (typeof tipoPagamento === "string") {
      if (tipoPagamento.toLowerCase().includes("pix")) tipoDesc = "PIX";
      else if (tipoPagamento.toLowerCase().includes("debito"))
        tipoDesc = "Cartão Débito";
      else if (tipoPagamento.toLowerCase().includes("credito"))
        tipoDesc = "Cartão Crédito";
      else tipoDesc = tipoPagamento;
    }
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Tipo: ${tipoDesc}`, rightX, blocoY + 36);
    if (vezes > 1) {
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`Parcelado: ${vezes}x`, rightX, blocoY + 54);
    }
  }

  doc.end();
}
