import PDFDocument from "pdfkit";
import path from "path";

export function generateStyledOrderPdf(order, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // Pipe para response
  doc.pipe(res);

  // Logo (ajuste o caminho conforme necessário)
  try {
    doc.image(path.join(process.cwd(), "public", "logo.png"), 40, 30, { width: 90 });
  } catch {}

  // Cabeçalho
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("ORÇAMENTO", 0, 40, { align: "center" });

  // Dados do cliente
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("DADOS DO CLIENTE", 40, 110)
    .font("Helvetica")
    .text(`Nome: ${order.userName || "-"}`)
    .text(`Telefone: ${order.phone || "-"}`)
    .text(`E-mail: ${order.email || "-"}`)
    .text(`Endereço: ${order.address || "-"}`)
    .text(`CEP: ${order.cep || "-"}`);

  // Forma de pagamento e peso
  doc
    .font("Helvetica-Bold")
    .text("FORMA DE PAGAMENTO", 350, 110)
    .font("Helvetica")
    .text(order.paymentType || "-", 350, 125)
    .font("Helvetica-Bold")
    .text("PESO ESTIMADO", 350, 150)
    .font("Helvetica")
    .text(order.estimatedWeight || "-", 350, 165);

  // Tabela de produtos
  doc
    .moveDown()
    .font("Helvetica-Bold")
    .text("PRODUTOS", 40, 200);

  // Cabeçalho da tabela
  const tableTop = 220;
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Produto", 40, tableTop)
    .text("Qtd", 200, tableTop)
    .text("Valor Unit.", 250, tableTop)
    .text("Subtotal", 350, tableTop);

  // Linhas da tabela
  let y = tableTop + 20;
  (order.items || []).forEach((item) => {
    doc
      .font("Helvetica")
      .text(item.name, 40, y)
      .text(item.quantity, 200, y)
      .text(`R$ ${(item.price || 0).toFixed(2)}`, 250, y)
      .text(`R$ ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`, 350, y);
    y += 20;
  });

  // Total
  doc
    .font("Helvetica-Bold")
    .text("TOTAL:", 250, y + 20)
    .text(`R$ ${(order.total || 0).toFixed(2)}`, 350, y + 20);

  // Observações
  doc
    .font("Helvetica-Bold")
    .text("OBSERVAÇÕES", 40, y + 60)
    .font("Helvetica")
    .text(order.observation || "-", 40, y + 75, { width: 500 });

  // Rodapé
  doc
    .fontSize(8)
    .font("Helvetica")
    .text("CONTATO PARA CONFIRMAR PEDIDO", 40, 780)
    .text("WhatsApp: (11) 94205-8445 | E-mail: orcamento@girakids.com", 40, 790);

  doc.end();
}
