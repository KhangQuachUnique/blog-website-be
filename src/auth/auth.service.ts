import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SavedPostList } from '../saved-post-list/entities/saved-post-list.entity';
import { EUserRole } from '../users/enums/role.enum';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SavedPostList)
    private savedPostListRepository: Repository<SavedPostList>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (user.isVerified !== 'verified') {
      throw new UnauthorizedException('Email chưa được xác thực. Vui lòng xác thực email trước khi đăng nhập.');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { name, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username: name }],
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User();
    newUser.username = name;
    newUser.email = email;
    newUser.password = hashedPassword;
    newUser.type = EUserRole.USER;

    // Create SavedPostList for the user
    const savedPostList = new SavedPostList();
    savedPostList.user = newUser;
    newUser.savedPostList = savedPostList;

    // Save user
    const savedUser = await this.userRepository.save(newUser);

    // Generate JWT token
    const payload = { sub: savedUser.id, email: savedUser.email, username: savedUser.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'avatarUrl', 'bio', 'phoneNumber'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // Refresh token utilities
  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  async validateRefreshToken(token: string, hashedToken: string): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }

  async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const hashedToken = await this.hashToken(refreshToken);
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    user.refreshTokenHash = hashedToken;
    await this.userRepository.save(user);
  }

  async clearRefreshToken(userId: number): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: null });
  }

  async getUserByRefreshToken(refreshToken: string): Promise<User | null> {
    const users = await this.userRepository.find({
      where: { refreshTokenHash: Not(IsNull()) },
    });

    for (const user of users) {
      if (user.refreshTokenHash) {
        const isValid = await this.validateRefreshToken(refreshToken, user.refreshTokenHash);
        if (isValid) {
          return user;
        }
      }
    }

    return null;
  }

  // OTP verification
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    if (user.isVerified === 'verified') {
      throw new ConflictException('Email đã được xác thực');
    }

    const otp = this.generateOtp();
    user.isVerified = otp;
    await this.userRepository.save(user);

    // Gửi email chứa OTP
    await this.emailService.sendOtpEmail(email, otp);

    return { message: 'OTP đã được gửi đến email của bạn' };
  }

  async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    if (user.isVerified === 'verified') {
      throw new ConflictException('Email đã được xác thực');
    }

    if (!user.isVerified || user.isVerified !== otp) {
      throw new UnauthorizedException('OTP không hợp lệ');
    }

    user.isVerified = 'verified';
    await this.userRepository.save(user);

    return { message: 'Xác thực email thành công' };
  }
}
