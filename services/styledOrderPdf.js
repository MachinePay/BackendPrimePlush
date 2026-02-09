import PDFDocument from "pdfkit";
import path from "path";

export function generateStyledOrderPdf(order, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // Pipe para response
  doc.pipe(res);

  // Logo (opcional, só se existir)
  try {
    doc.image(path.join(process.cwd(), "public", "logo.png"), 40, 30, { width: 90 });
  } catch (e) {
    // Se não existir, ignora
  }

  // Cabeçalho
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("ORÇAMENTO", 0, 40, { align: "center" });

  // Dados do cliente (usando campos reais do pedido)
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("DADOS DO CLIENTE", 40, 110)
    .font("Helvetica")
    .text(`Nome: ${order.userName || order.cliente || "-"}`)
    .text(`Telefone: ${order.phone || "-"}`)
    .text(`E-mail: ${order.email || "-"}`)
    .text(`Endereço: ${order.address || "-"}`)
    .text(`CEP: ${order.cep || "-"}`);
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
  let y = tableTop + 20;
  (order.items || []).forEach((item) => {
    // Suporte a diferentes nomes de campos
    const nome = item.name || item.produto || item.title || "-";
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

  // Rodapé
  doc
    .fontSize(8)
    .font("Helvetica")
    .text("CONTATO PARA CONFIRMAR PEDIDO", 40, 780)
    .text("WhatsApp: (11) 94205-8445 | E-mail: orcamento@girakids.com", 40, 790);

  doc.end();
}
