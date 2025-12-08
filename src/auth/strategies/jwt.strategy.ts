import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    // Payload contains: { sub: userId, email, username }
    // Return `id` so controllers that read `req.user?.id` work consistently
    try {
      console.log('[JwtStrategy] validate payload', { sub: payload.sub, email: payload.email });
    } catch (e) {
      // ignore logging errors
    }

    // Return both `userId` and `id` for compatibility with existing code
    return { userId: payload.sub, id: payload.sub, email: payload.email, username: payload.username };
  }
}
