import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class CanUpdateUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { id?: string; role?: string };
      params: { id: string };
    }>();
    const user = request.user;
    const paramId = request.params.id;
    // Allow if admin or updating own profile
    if (user?.role === 'ADMIN' || user?.id === paramId) {
      return true;
    }
    throw new ForbiddenException('You can only update your own profile.');
  }
}
