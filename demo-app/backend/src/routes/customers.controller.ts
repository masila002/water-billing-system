import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CustomersService } from '../services/customers.service';
import { TenantId } from '../utils/tenant-id.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@TenantId() tenantId: string): Promise<unknown[]> {
    return this.customers.list(tenantId);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() input: CreateCustomerDto,
  ): Promise<unknown> {
    return this.customers.create(tenantId, input);
  }
}
