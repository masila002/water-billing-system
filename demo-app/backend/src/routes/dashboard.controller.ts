import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { TenantId } from '../utils/tenant-id.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getSummary(@TenantId() tenantId: string): Promise<Record<string, unknown>> {
    return this.dashboard.getSummary(tenantId);
  }
}
