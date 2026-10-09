import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAccountDto } from '../dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly database: DatabaseService) {}

  async list(tenantId: string): Promise<unknown[]> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `SELECT a.id, a.account_number AS "accountNumber",
                a.meter_number AS "meterNumber", a.status,
                c.id AS "customerId", c.customer_number AS "customerNumber",
                c.full_name AS "customerName", t.name AS "tariffName",
                a.created_at AS "createdAt"
           FROM service_accounts a
           JOIN customers c ON c.tenant_id = a.tenant_id AND c.id = a.customer_id
           JOIN tariffs t ON t.tenant_id = a.tenant_id AND t.id = a.tariff_id
          ORDER BY a.account_number LIMIT 500`,
      );
      return result.rows;
    });
  }

  async create(tenantId: string, input: CreateAccountDto): Promise<unknown> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `INSERT INTO service_accounts
           (tenant_id, customer_id, tariff_id, account_number, meter_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, customer_id AS "customerId", tariff_id AS "tariffId",
                   account_number AS "accountNumber", meter_number AS "meterNumber",
                   status, created_at AS "createdAt"`,
        [
          tenantId,
          input.customerId,
          input.tariffId,
          input.accountNumber,
          input.meterNumber,
        ],
      );
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, event_type, entity_type, entity_id, details)
         VALUES ($1, 'service_account.created', 'service_account', $2, '{}'::jsonb)`,
        [tenantId, result.rows[0].id],
      );
      return result.rows[0];
    });
  }
}
