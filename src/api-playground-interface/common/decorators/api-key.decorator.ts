import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ApiKeyData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKeyData;
  },
);