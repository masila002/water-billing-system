import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReadingDto } from '../dto/create-reading.dto';

@Injectable()
export class ReadingsService {
  constructor(private readonly database: DatabaseService) {}

  async list(tenantId: string): Promise<unknown[]> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `SELECT r.id, r.service_account_id AS "serviceAccountId",
                a.account_number AS "accountNumber", c.full_name AS "customerName",
                r.previous_reading AS "previousReading",
                r.current_reading AS "currentReading",
                r.current_reading - r.previous_reading AS consumption,
                r.read_at AS "readAt", r.notes
           FROM meter_readings r
           JOIN service_accounts a ON a.tenant_id = r.tenant_id
             AND a.id = r.service_account_id
           JOIN customers c ON c.tenant_id = a.tenant_id AND c.id = a.customer_id
          ORDER BY r.read_at DESC LIMIT 500`,
      );
      return result.rows;
    });
  }

  async create(tenantId: string, input: CreateReadingDto): Promise<unknown> {
    return this.database.withTenantTransaction(tenantId, async (client) => {
      const repeated = await client.query(
        `SELECT id, service_account_id AS "serviceAccountId",
                previous_reading AS "previousReading",
                current_reading AS "currentReading",
                current_reading - previous_reading AS consumption,
                read_at AS "readAt", idempotency_key AS "idempotencyKey",
                notes, created_at AS "createdAt"
           FROM meter_readings
          WHERE tenant_id = $1 AND idempotency_key = $2`,
        [tenantId, input.idempotencyKey],
      );
      if (repeated.rowCount) {
        const saved = repeated.rows[0];
        if (
          saved.serviceAccountId !== input.serviceAccountId ||
          Number(saved.previousReading) !== input.previousReading ||
          Number(saved.currentReading) !== input.currentReading ||
          new Date(saved.readAt).getTime() !== new Date(input.readAt).getTime()
        ) {
          throw new ConflictException(
            'Idempotency key was already used for a different meter reading',
          );
        }
        return repeated.rows[0];
      }

      const account = await client.query<{
        status: string;
        latest_reading: string | null;
      }>(
        `SELECT a.status,
                (SELECT r.current_reading FROM meter_readings r
                  WHERE r.tenant_id = a.tenant_id
                    AND r.service_account_id = a.id
                  ORDER BY r.read_at DESC, r.created_at DESC
                  LIMIT 1) AS latest_reading
           FROM service_accounts a
          WHERE a.tenant_id = $1 AND a.id = $2
          FOR UPDATE`,
        [tenantId, input.serviceAccountId],
      );
      const currentAccount = account.rows[0];
      if (!currentAccount) {
        throw new NotFoundException('Service account not found');
      }
      if (currentAccount.status !== 'active') {
        throw new BadRequestException(
          'Meter readings can only be submitted for active accounts',
        );
      }
      if (
        currentAccount.latest_reading !== null &&
        Number(currentAccount.latest_reading) !== input.previousReading
      ) {
        throw new BadRequestException(
          'Previous reading does not match the latest recorded meter value',
        );
      }

      const result = await client.query(
        `INSERT INTO meter_readings
           (tenant_id, service_account_id, previous_reading, current_reading,
            read_at, submitted_by, idempotency_key, notes)
         VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7, $8)
         RETURNING id, service_account_id AS "serviceAccountId",
                   previous_reading AS "previousReading",
                   current_reading AS "currentReading",
                   current_reading - previous_reading AS consumption,
                   read_at AS "readAt", idempotency_key AS "idempotencyKey",
                   notes, created_at AS "createdAt"`,
        [
          tenantId,
          input.serviceAccountId,
          input.previousReading,
          input.currentReading,
          input.readAt,
          input.submittedBy ?? null,
          input.idempotencyKey,
          input.notes ?? null,
        ],
      );
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, actor_user_id, event_type, entity_type, entity_id, details)
         VALUES ($1, $2, 'meter_reading.submitted', 'meter_reading', $3, '{}'::jsonb)`,
        [tenantId, input.submittedBy ?? null, result.rows[0].id],
      );
      return result.rows[0];
    });
  }
}
