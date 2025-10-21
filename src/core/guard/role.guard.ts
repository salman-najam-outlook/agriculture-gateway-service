import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../roles';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles =
      this.reflector.getAllAndMerge<Roles[]>('roles', [
        context.getClass(),
        context.getHandler(),
      ]) || [];
    if (roles && roles.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context).getContext();
    const headers = ctx.req.headers;
    const user = headers?.user !== 'undefined' && JSON.parse(headers?.user);

    const userRole = user?.currentUser?.role || Roles.FARMER;

    const hasRole = () => roles.includes(userRole);
    return user && hasRole();
  }
}
