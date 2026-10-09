import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PaymentsService } from '../services/payments.service';
import { TenantId } from '../utils/tenant-id.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@TenantId() tenantId: string): Promise<unknown[]> {
    return this.payments.list(tenantId);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() input: CreatePaymentDto,
  ): Promise<unknown> {
    return this.payments.create(tenantId, input);
  }
}
