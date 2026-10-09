import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly database: DatabaseService) {}

  async list(tenantId: string): Promise<unknown[]> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `SELECT id, customer_number AS "customerNumber", full_name AS "fullName",
                phone, email, address, status, created_at AS "createdAt"
           FROM customers ORDER BY full_name LIMIT 500`,
      );
      return result.rows;
    });
  }

  async create(tenantId: string, input: CreateCustomerDto): Promise<unknown> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `INSERT INTO customers (tenant_id, customer_number, full_name, phone, email, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, customer_number AS "customerNumber", full_name AS "fullName",
                   phone, email, address, status, created_at AS "createdAt"`,
        [
          tenantId,
          input.customerNumber,
          input.fullName,
          input.phone ?? null,
          input.email ?? null,
          input.address ?? null,
        ],
      );
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, event_type, entity_type, entity_id, details)
         VALUES ($1, 'customer.created', 'customer', $2, '{}'::jsonb)`,
        [tenantId, result.rows[0].id],
      );
      return result.rows[0];
    });
  }
}
