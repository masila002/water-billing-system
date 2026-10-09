import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountsService } from '../services/accounts.service';
import { TenantId } from '../utils/tenant-id.decorator';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@TenantId() tenantId: string): Promise<unknown[]> {
    return this.accounts.list(tenantId);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() input: CreateAccountDto,
  ): Promise<unknown> {
    return this.accounts.create(tenantId, input);
  }
}
