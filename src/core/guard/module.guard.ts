import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor() {
    console.log('Guard called!');
  }

  async canActivate(context: ExecutionContext) {
    console.log('Guard called!');
    return false;

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().request;
    if (request === undefined || !request) {
      return true;
    }

    const permissions = request.get('permissions');

    if (permissions) {
      try {
        console.log(permissions, 'permissionspermissionspermissions');
      } catch (e) {
        throw new UnauthorizedException();
      }
    }

    return false;
  }
}
