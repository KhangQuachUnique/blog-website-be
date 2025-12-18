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
    // Payload contains: { sub: userId, email, username, role }
    // Return user info for controllers
    try {
      console.log('[JwtStrategy] validate payload', { sub: payload.sub, email: payload.email, role: payload.role });
    } catch (e) {
      // ignore logging errors
    }

    // Return userId, id, email, username, role for compatibility
    return { 
      userId: payload.sub, 
      id: payload.sub, 
      email: payload.email, 
      username: payload.username,
      role: payload.role,
    };
  }
}
