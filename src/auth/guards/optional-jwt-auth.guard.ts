import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // If no token / invalid token, don't throw — just return null user
  handleRequest(err: any, user: any, info: any) {
    try {
      console.log('[OptionalJwtAuthGuard] handleRequest', { err: !!err, hasUser: !!user, info });
    } catch (e) {}

    if (err) return null;
    return user ?? null;
  }
}
