export type Role = 'platform_admin' | 'tenant_admin' | 'billing_manager' | 'cashier' | 'meter_reader' | 'auditor' | 'customer';

export type Permission =
  | 'customer:create' | 'customer:read'
  | 'account:create' | 'account:read' | 'account:suspend'
  | 'reading:submit' | 'reading:read' | 'reading:flag'
  | 'bill:issue' | 'bill:read' | 'bill:approve_adjustment'
  | 'payment:record_cash' | 'payment:read' | 'payment:reverse_request' | 'payment:reverse_approve'
  | 'tariff:manage' | 'report:read' | 'audit:read' | 'user:invite' | 'export:run';

const MATRIX: Record<Role, Permission[]> = {
  platform_admin: ['report:read', 'audit:read'],
  tenant_admin: ['customer:create', 'customer:read', 'account:create', 'account:read', 'account:suspend', 'reading:submit', 'reading:read', 'reading:flag', 'bill:issue', 'bill:read', 'bill:approve_adjustment', 'payment:record_cash', 'payment:read', 'payment:reverse_request', 'payment:reverse_approve', 'tariff:manage', 'report:read', 'audit:read', 'user:invite', 'export:run'],
  billing_manager: ['customer:create', 'customer:read', 'account:create', 'account:read', 'reading:read', 'reading:flag', 'bill:issue', 'bill:read', 'bill:approve_adjustment', 'payment:read', 'report:read', 'export:run'],
  cashier: ['customer:read', 'account:read', 'bill:read', 'payment:record_cash', 'payment:read'],
  meter_reader: ['account:read', 'reading:submit', 'reading:read'],
  auditor: ['customer:read', 'account:read', 'reading:read', 'bill:read', 'payment:read', 'report:read', 'audit:read'],
  customer: ['bill:read', 'payment:read'],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return [...(MATRIX[role] ?? [])];
}
