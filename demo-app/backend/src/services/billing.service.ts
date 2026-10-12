import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { GenerateBillDto } from '../dto/generate-bill.dto';

@Injectable()
export class BillingService {
  constructor(private readonly database: DatabaseService) {}

  async list(tenantId: string): Promise<unknown[]> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `SELECT b.id, b.bill_number AS "billNumber",
                b.service_account_id AS "serviceAccountId",
                a.account_number AS "accountNumber", c.full_name AS "customerName",
                b.period_start::text AS "periodStart", b.period_end::text AS "periodEnd",
                b.due_at::text AS "dueAt", b.status,
                b.subtotal_minor AS "subtotalMinor", b.total_minor AS "totalMinor",
                b.issued_at AS "issuedAt"
           FROM bills b
           JOIN service_accounts a ON a.tenant_id = b.tenant_id
             AND a.id = b.service_account_id
           JOIN customers c ON c.tenant_id = a.tenant_id AND c.id = a.customer_id
          ORDER BY b.issued_at DESC LIMIT 500`,
      );
      return result.rows;
    });
  }

  async generate(
    tenantId: string,
    input: GenerateBillDto,
  ): Promise<unknown> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const previouslyGenerated = await client.query(
        `SELECT id, bill_number AS "billNumber", service_account_id AS "serviceAccountId",
                period_start::text AS "periodStart", period_end::text AS "periodEnd",
                due_at::text AS "dueAt", status, subtotal_minor AS "subtotalMinor",
                total_minor AS "totalMinor", issued_at AS "issuedAt"
           FROM bills
          WHERE tenant_id = $1 AND meter_reading_id = $2`,
        [tenantId, input.meterReadingId],
      );
      if (previouslyGenerated.rowCount) {
        const saved = previouslyGenerated.rows[0];
        // DATE columns travel as ISO calendar-day text: node-pg builds DATE
        // values at local midnight, so day extraction shifts the day on
        // runtimes east of UTC (F04, review S1). Text is exact everywhere,
        // for both comparison and the returned response shape.
        if (
          saved.serviceAccountId !== input.serviceAccountId ||
          saved.periodStart !== input.periodStart ||
          saved.periodEnd !== input.periodEnd ||
          saved.dueAt !== input.dueAt
        ) {
          throw new ConflictException(
            'This meter reading has already been billed with different details',
          );
        }
        return saved;
      }

      const source = await client.query<{
        current_reading: string;
        previous_reading: string;
        tariff_id: string;
        fixed_charge_minor: string;
        rate_per_unit_minor: string;
      }>(
        `SELECT r.current_reading, r.previous_reading, a.tariff_id,
                t.fixed_charge_minor, t.rate_per_unit_minor
           FROM meter_readings r
           JOIN service_accounts a ON a.tenant_id = r.tenant_id
             AND a.id = r.service_account_id
           JOIN tariffs t ON t.tenant_id = a.tenant_id AND t.id = a.tariff_id
          WHERE r.tenant_id = $1 AND r.id = $2 AND r.service_account_id = $3
            AND t.is_active = true
            AND t.effective_from <= $4::date
            AND (t.effective_to IS NULL OR t.effective_to >= $5::date)`,
        [
          tenantId,
          input.meterReadingId,
          input.serviceAccountId,
          input.periodStart,
          input.periodEnd,
        ],
      );
      const reading = source.rows[0];
      if (!reading) {
        throw new NotFoundException(
          'Meter reading, service account, or applicable active tariff was not found',
        );
      }

      const consumedMilliUnits = Math.round(
        (Number(reading.current_reading) -
          Number(reading.previous_reading)) *
          1000,
      );
      const rate = BigInt(reading.rate_per_unit_minor);
      const fixedCharge = BigInt(reading.fixed_charge_minor);
      const variableCharge =
        (BigInt(consumedMilliUnits) * rate + 500n) / 1000n;
      const total = fixedCharge + variableCharge;

      if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new BadRequestException('Bill amount exceeds supported limits');
      }

      const billNumber = `INV-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
      const billResult = await client.query(
        `INSERT INTO bills
           (tenant_id, service_account_id, meter_reading_id, bill_number,
            period_start, period_end, due_at, subtotal_minor, total_minor)
         VALUES ($1, $2, $3, $4, $5::date, $6::date, $7::date, $8, $8)
         RETURNING id, bill_number AS "billNumber", service_account_id AS "serviceAccountId",
                   period_start::text AS "periodStart", period_end::text AS "periodEnd",
                   due_at::text AS "dueAt", status, subtotal_minor AS "subtotalMinor",
                   total_minor AS "totalMinor", issued_at AS "issuedAt"`,
        [
          tenantId,
          input.serviceAccountId,
          input.meterReadingId,
          billNumber,
          input.periodStart,
          input.periodEnd,
          input.dueAt,
          total.toString(),
        ],
      );
      const bill = billResult.rows[0];

      await client.query(
        `INSERT INTO bill_items
           (tenant_id, bill_id, description, quantity, unit_price_minor, amount_minor)
         VALUES
           ($1, $2, 'Water consumption', $3::numeric / 1000, $4, $5),
           ($1, $2, 'Fixed service charge', 1, $6, $6)`,
        [
          tenantId,
          bill.id,
          consumedMilliUnits,
          rate.toString(),
          variableCharge.toString(),
          fixedCharge.toString(),
        ],
      );
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, event_type, entity_type, entity_id, details)
         VALUES ($1, 'bill.generated', 'bill', $2, $3::jsonb)`,
        [
          tenantId,
          bill.id,
          JSON.stringify({ meterReadingId: input.meterReadingId }),
        ],
      );
      return bill;
    });
  }
}
