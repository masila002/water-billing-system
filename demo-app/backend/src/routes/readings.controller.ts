import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateReadingDto } from '../dto/create-reading.dto';
import { ReadingsService } from '../services/readings.service';
import { TenantId } from '../utils/tenant-id.decorator';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly readings: ReadingsService) {}

  @Get()
  list(@TenantId() tenantId: string): Promise<unknown[]> {
    return this.readings.list(tenantId);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() input: CreateReadingDto,
  ): Promise<unknown> {
    return this.readings.create(tenantId, input);
  }
}
