import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export const TenantId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = request.header('x-tenant-id');
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return tenantId;
  },
);
