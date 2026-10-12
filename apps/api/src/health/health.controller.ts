import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  status(): { service: string; version: string; time: string } {
    return { service: 'majibill-core-api', version: '0.1.0', time: new Date().toISOString() };
  }
}
