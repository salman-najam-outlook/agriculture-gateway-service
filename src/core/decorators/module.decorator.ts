import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const userPlans = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const request = gqlCtx.getContext().req;
    if (request.permissions) {
      return request.permissions;
    } else {
      throw new UnauthorizedException();
    }
  },
);

export const ModulesAllowed = (...modules) => SetMetadata('modules', modules);
