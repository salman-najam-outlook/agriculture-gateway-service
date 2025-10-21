import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../roles';

@Injectable()
export class PlansGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const plans =
      this.reflector.getAllAndMerge<string[]>('plans', [
        context.getClass(),
        context.getHandler(),
      ]) || [];
    if (plans && plans.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    console.log(request, 'requestrequestrequest');
    const user = request.user;

    //permissions
    //const userRoles = request.permissions;

    const hasPlan = () =>
      user.plans.some(
        (plan: string) => !!plans.find((userPlan: string) => userPlan === plan),
      );
    return user && user.plans && hasPlan();
  }
}
