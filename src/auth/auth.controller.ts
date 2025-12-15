import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Cookie configuration helper
const getRefreshTokenCookieOptions = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    // Development: Allow cross-origin cookies (localhost:3000 <-> localhost:8080)
    return {
      httpOnly: true,
      secure: true, // Required for SameSite=None (Chrome allows this on localhost)
      sameSite: 'none' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
  
  // Production: Strict security
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN,
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const authResponse = await this.authService.login(loginDto);
    
    // Generate and save refresh token
    const refreshToken = this.authService.generateRefreshToken();
    await this.authService.saveRefreshToken(authResponse.user.id, refreshToken);
    
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
    
    return authResponse;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const authResponse = await this.authService.register(registerDto);
    
    // Generate and save refresh token
    const refreshToken = this.authService.generateRefreshToken();
    await this.authService.saveRefreshToken(authResponse.user.id, refreshToken);
    
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
    
    return authResponse;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return this.authService.getCurrentUser(req.user?.userId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    
    // Find user by refresh token
    const user = await this.authService.getUserByRefreshToken(refreshToken);
    
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    // Generate new access token
    const payload = { sub: user.id, email: user.email, username: user.username };
    const accessToken = this.authService['jwtService'].sign(payload);
    
    // Optional: Rotate refresh token for enhanced security
    const newRefreshToken = this.authService.generateRefreshToken();
    await this.authService.saveRefreshToken(user.id, newRefreshToken);
    
    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());
    
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear refresh token from database
    await this.authService.clearRefreshToken(req.user?.userId);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    return { message: 'Logout successful' };
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }
}
