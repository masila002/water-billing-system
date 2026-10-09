import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly database: DatabaseService) {}

  async list(tenantId: string): Promise<unknown[]> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `SELECT p.id, p.receipt_number AS "receiptNumber",
                p.service_account_id AS "serviceAccountId",
                a.account_number AS "accountNumber", c.full_name AS "customerName",
                p.amount_minor AS "amountMinor", p.method, p.status,
                p.external_reference AS "externalReference",
                p.paid_at AS "paidAt"
           FROM payments p
           JOIN service_accounts a ON a.tenant_id = p.tenant_id
             AND a.id = p.service_account_id
           JOIN customers c ON c.tenant_id = a.tenant_id AND c.id = a.customer_id
          ORDER BY p.paid_at DESC LIMIT 500`,
      );
      return result.rows;
    });
  }

  async create(tenantId: string, input: CreatePaymentDto): Promise<unknown> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const billResult = await client.query<{
        id: string;
        total_minor: string;
        status: string;
      }>(
        `SELECT id, total_minor, status FROM bills
          WHERE tenant_id = $1 AND id = $2 AND service_account_id = $3
          FOR UPDATE`,
        [tenantId, input.billId, input.serviceAccountId],
      );
      const bill = billResult.rows[0];
      if (!bill || bill.status === 'void') {
        throw new NotFoundException('Bill not found');
      }
      const existing = await client.query(
        `SELECT p.id, p.receipt_number AS "receiptNumber",
                p.service_account_id AS "serviceAccountId",
                p.amount_minor AS "amountMinor", p.method, p.status,
                p.external_reference AS "externalReference",
                pa.bill_id AS "billId", p.paid_at AS "paidAt"
           FROM payments p
           LEFT JOIN payment_allocations pa
             ON pa.tenant_id = p.tenant_id AND pa.payment_id = p.id
          WHERE p.tenant_id = $1 AND p.idempotency_key = $2`,
        [tenantId, input.idempotencyKey],
      );
      if (existing.rowCount) {
        const saved = existing.rows[0];
        if (
          saved.serviceAccountId !== input.serviceAccountId ||
          saved.billId !== input.billId ||
          BigInt(saved.amountMinor) !== BigInt(input.amountMinor) ||
          saved.method !== input.method ||
          saved.externalReference !== (input.externalReference ?? null)
        ) {
          throw new ConflictException(
            'Idempotency key was already used for a different payment',
          );
        }
        return saved;
      }

      const allocatedResult = await client.query<{ allocated_minor: string }>(
        `SELECT COALESCE(SUM(pa.amount_minor), 0) AS allocated_minor
           FROM payment_allocations pa
           JOIN payments p ON p.tenant_id = pa.tenant_id AND p.id = pa.payment_id
          WHERE pa.tenant_id = $1 AND pa.bill_id = $2 AND p.status = 'confirmed'`,
        [tenantId, input.billId],
      );
      const due =
        BigInt(bill.total_minor) -
        BigInt(allocatedResult.rows[0].allocated_minor);
      if (BigInt(input.amountMinor) > due) {
        throw new BadRequestException('Payment amount exceeds the bill balance');
      }

      const receiptNumber = `RCT-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

      const paymentResult = await client.query(
        `INSERT INTO payments
           (tenant_id, service_account_id, receipt_number, amount_minor, method,
            external_reference, idempotency_key, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, receipt_number AS "receiptNumber",
                   amount_minor AS "amountMinor", method, status,
                   paid_at AS "paidAt"`,
        [
          tenantId,
          input.serviceAccountId,
          receiptNumber,
          input.amountMinor,
          input.method,
          input.externalReference ?? null,
          input.idempotencyKey,
          input.recordedBy ?? null,
        ],
      );
      const payment = paymentResult.rows[0];
      await client.query(
        `INSERT INTO payment_allocations
           (tenant_id, service_account_id, payment_id, bill_id, amount_minor)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          tenantId,
          input.serviceAccountId,
          payment.id,
          input.billId,
          input.amountMinor,
        ],
      );

      const newAllocated =
        BigInt(allocatedResult.rows[0].allocated_minor) +
        BigInt(input.amountMinor);
      if (newAllocated === BigInt(bill.total_minor)) {
        await client.query(
          `UPDATE bills SET status = 'paid' WHERE tenant_id = $1 AND id = $2`,
          [tenantId, input.billId],
        );
      } else {
        await client.query(
          `UPDATE bills SET status = 'partially_paid' WHERE tenant_id = $1 AND id = $2`,
          [tenantId, input.billId],
        );
      }
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, actor_user_id, event_type, entity_type, entity_id, details)
         VALUES ($1, $2, 'payment.recorded', 'payment', $3, $4::jsonb)`,
        [
          tenantId,
          input.recordedBy ?? null,
          payment.id,
          JSON.stringify({ billId: input.billId, amountMinor: input.amountMinor }),
        ],
      );
      return payment;
    });
  }
}
