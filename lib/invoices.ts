export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface InvoiceItemPayload {
  itemName: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface CalculatedInvoiceItem extends InvoiceItemPayload {
  lineTotal: number;
}

const roundMoney = (v: number) => Math.round(v * 100) / 100;

export function calculateInvoiceItems(items: InvoiceItemPayload[]): CalculatedInvoiceItem[] {
  return items.map((item) => ({
    ...item,
    lineTotal: roundMoney(item.quantity * item.unitPrice),
  }));
}

export function calculateInvoiceTotals(
  items: CalculatedInvoiceItem[],
  discountAmount = 0,
  taxRate = 0
) {
  const subtotal = roundMoney(items.reduce((s, i) => s + i.lineTotal, 0));
  const discount = roundMoney(discountAmount);
  const taxableAmount = roundMoney(subtotal - discount);
  const taxAmount = roundMoney(taxableAmount * (taxRate / 100));
  const total = roundMoney(taxableAmount + taxAmount);
  return { subtotal, discount, taxAmount, total };
}

export function resolveInvoiceStatus(
  status: string,
  dueDate?: Date | null,
  total = 0,
  amountPaid = 0
): InvoiceStatus {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'paid') return 'paid';
  if (amountPaid > 0 && amountPaid < total) return 'partially_paid';
  if (status === 'sent' && dueDate && new Date(dueDate) < new Date()) return 'overdue';
  return (status as InvoiceStatus) || 'draft';
}
