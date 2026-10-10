export interface Customer {
  id: string;
  customerNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: 'active' | 'inactive';
}

export interface ServiceAccount {
  id: string;
  accountNumber: string;
  meterNumber: string;
  customerId: string;
  customerName: string;
  tariffName: string;
  status: 'active' | 'suspended' | 'closed';
}

export interface Bill {
  id: string;
  billNumber: string;
  serviceAccountId: string;
  accountNumber: string;
  customerName: string;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  totalMinor: number | string;
  status: 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';
}

export interface Payment {
  id: string;
  receiptNumber: string;
  accountNumber: string;
  customerName: string;
  amountMinor: number | string;
  method: 'mpesa' | 'cash' | 'bank' | 'other';
  status: 'pending' | 'confirmed' | 'failed' | 'reversed';
  externalReference: string | null;
  paidAt: string;
}