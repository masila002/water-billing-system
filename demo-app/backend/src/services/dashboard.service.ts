import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly database: DatabaseService) {}

  async getSummary(tenantId: string): Promise<Record<string, unknown>> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `SELECT
           (SELECT COUNT(*) FROM customers WHERE status = 'active') AS active_customers,
           (SELECT COUNT(*) FROM service_accounts WHERE status = 'active') AS active_accounts,
           (SELECT COALESCE(SUM(total_minor), 0) FROM bills WHERE status <> 'void') AS total_billed_minor,
           (SELECT COALESCE(SUM(p.amount_minor), 0)
              FROM payments p WHERE p.status = 'confirmed') AS total_collected_minor,
           (SELECT COUNT(*) FROM bills
              WHERE status IN ('issued', 'partially_paid', 'overdue')) AS unpaid_bills`,
      );
      const recent = await client.query(
        `SELECT p.id, p.receipt_number AS "receiptNumber",
                p.amount_minor AS "amountMinor", p.method, p.status,
                p.paid_at AS "paidAt", c.full_name AS "customerName"
           FROM payments p
           JOIN service_accounts a ON a.tenant_id = p.tenant_id
             AND a.id = p.service_account_id
           JOIN customers c ON c.tenant_id = a.tenant_id AND c.id = a.customer_id
          ORDER BY p.paid_at DESC
          LIMIT 5`,
      );
      return { ...result.rows[0], recentPayments: recent.rows };
    });
  }
}
