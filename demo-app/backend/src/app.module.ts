import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { AccountsController } from './routes/accounts.controller';
import { BillsController } from './routes/bills.controller';
import { CustomersController } from './routes/customers.controller';
import { DashboardController } from './routes/dashboard.controller';
import { HealthController } from './routes/health.controller';
import { PaymentsController } from './routes/payments.controller';
import { ReadingsController } from './routes/readings.controller';
import { AccountsService } from './services/accounts.service';
import { BillingService } from './services/billing.service';
import { CustomersService } from './services/customers.service';
import { DashboardService } from './services/dashboard.service';
import { PaymentsService } from './services/payments.service';
import { ReadingsService } from './services/readings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    HealthController,
    DashboardController,
    CustomersController,
    AccountsController,
    BillsController,
    PaymentsController,
    ReadingsController,
  ],
  providers: [
    DashboardService,
    CustomersService,
    AccountsService,
    BillingService,
    PaymentsService,
    ReadingsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes(
      DashboardController,
      CustomersController,
      AccountsController,
      BillsController,
      PaymentsController,
      ReadingsController,
    );
  }
}
