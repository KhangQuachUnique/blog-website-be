import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtUser, JwtPayload } from '../dto/validate-payload.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    // Payload contains: { sub: userId, email, username, role }
    // Return user info for controllers
    try {
      console.log('[JwtStrategy] validate payload', {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      });
    } catch (e) {
      // ignore logging errors
    }

    // Check if user is banned
    const isBanned = await this.authService.isUserBanned(payload.sub);
    if (isBanned) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.');
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
