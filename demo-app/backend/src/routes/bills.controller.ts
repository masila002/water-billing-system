import { Body, Controller, Get, Post } from '@nestjs/common';
import { GenerateBillDto } from '../dto/generate-bill.dto';
import { BillingService } from '../services/billing.service';
import { TenantId } from '../utils/tenant-id.decorator';

@Controller('bills')
export class BillsController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  list(@TenantId() tenantId: string): Promise<unknown[]> {
    return this.billing.list(tenantId);
  }

  @Post('generate')
  generate(
    @TenantId() tenantId: string,
    @Body() input: GenerateBillDto,
  ): Promise<unknown> {
    return this.billing.generate(tenantId, input);
  }
}
