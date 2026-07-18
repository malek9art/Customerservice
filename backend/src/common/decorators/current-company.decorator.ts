import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'];
    if (!companyId) {
      throw new UnauthorizedException('Missing X-Company-ID header');
    }
    return companyId;
  },
);
