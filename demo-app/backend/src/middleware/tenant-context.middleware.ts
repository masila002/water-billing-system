import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    const tenantId = request.header('x-tenant-id');
    if (!tenantId || !UUID_PATTERN.test(tenantId)) {
      throw new BadRequestException(
        'A valid X-Tenant-ID UUID header is required',
      );
    }

    next();
  }
}
