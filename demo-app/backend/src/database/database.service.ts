import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ConflictException,
  BadRequestException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

interface PostgreSqlError extends Error {
  code?: string;
}

function isPostgreSqlError(error: unknown): error is PostgreSqlError {
  return error instanceof Error && 'code' in error;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL must be set before starting the backend');
    }

    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: true }
        : undefined,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async ping(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw new ServiceUnavailableException('Database is unavailable');
    }
  }

  async query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: (string | number | boolean | Date | null)[] = [],
  ): Promise<QueryResult<Row>> {
    try {
      return await this.pool.query<Row>(text, values);
    } catch (error) {
      this.logger.error('Database query failed', error);
      throw new InternalServerErrorException('Database query failed');
    }
  }

  async withTenantTransaction<T>(
    tenantId: string,
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [
        tenantId,
      ]);

      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          this.logger.error('Database transaction rollback failed', rollbackError);
        }
      }
      if (isPostgreSqlError(error) && error.code === '23505') {
        throw new ConflictException('A record with that value already exists');
      }
      if (isPostgreSqlError(error) && error.code === '23503') {
        throw new BadRequestException(
          'A referenced record was not found for this tenant',
        );
      }
      if (
        isPostgreSqlError(error) &&
        (error.code === '23514' || error.code === '22P02')
      ) {
        throw new BadRequestException('The data violates a database constraint');
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
