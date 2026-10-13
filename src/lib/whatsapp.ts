// Sends a WhatsApp message via the public wa.me link (no API key needed).
// We just construct a URL that admins can click; additionally we log the message.
// For true server-side push we'd need a WhatsApp Business API; this project uses the click-to-chat link.

const WHATSAPP_NUMBER = "01211160594";
const INTERNATIONAL_NUMBER = "201211160594";

export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${INTERNATIONAL_NUMBER}?text=${encoded}`;
}

export function buildNewOrderMessage(order: {
  orderNumber: string;
  customerName: string;
  total: number | string;
  phone: string;
  address: string;
  items: { name: string; qty: number }[];
}): string {
  const lines = [
    "🔔 *طلب جديد!*",
    "",
    `📋 رقم الطلب: ${order.orderNumber}`,
    `👤 العميل: ${order.customerName}`,
    `📱 الهاتف: ${order.phone}`,
    `📍 العنوان: ${order.address}`,
    "",
    "🍔 الطلب:",
    ...order.items.map((i) => `  • ${i.name} × ${i.qty}`),
    "",
    `💰 الإجمالي: ${order.total} جنيه`,
  ];
  return lines.join("\n");
}

export { WHATSAPP_NUMBER };
