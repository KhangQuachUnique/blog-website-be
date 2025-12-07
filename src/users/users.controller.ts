import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestChangeEmailDto, VerifyEmailDto } from './dto/change-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  /**
   * Xem profile của chính mình
   * GET /users/me/profile
   * NOTE: Phải đặt trước route :id/profile để tránh conflict
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: any) {
    const userId = req.user.userId;
    return this.usersService.getProfile(userId, userId);
  }

  /**
   * Xem profile của user bất kỳ (public hoặc có auth optional)
   */
  @Get(':id/profile')
  async getProfile(
    @Param('id', ParseIntPipe) userId: number,
    @Query('viewerId') viewerId?: string,
  ) {
    const parsedViewerId = viewerId ? parseInt(viewerId) : undefined;
    return this.usersService.getProfile(userId, parsedViewerId);
  }

  /**
   * Cập nhật profile của chính mình
   * PATCH /users/me/profile
   */
  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.userId;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  /**
   * Đổi mật khẩu
   * POST /users/me/change-password
   */
  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.userId;
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  /**
   * Yêu cầu đổi email (gửi mã xác thực)
   * POST /users/me/change-email
   */
  @Post('me/change-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async requestChangeEmail(@Request() req: any, @Body() requestDto: RequestChangeEmailDto) {
    const userId = req.user.userId;
    return this.usersService.requestChangeEmail(userId, requestDto);
  }

  /**
   * Xác thực mã và cập nhật email mới
   * POST /users/me/verify-email
   */
  @Post('me/verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@Request() req: any, @Body() verifyDto: VerifyEmailDto) {
    const userId = req.user.userId;
    return this.usersService.verifyAndChangeEmail(userId, verifyDto);
  }

  /**
   * Chuyển đổi chế độ riêng tư
   * PATCH /users/me/privacy
   */
  @Patch('me/privacy')
  @UseGuards(JwtAuthGuard)
  async togglePrivacy(@Request() req: any) {
    const userId = req.user.userId;
    return this.usersService.togglePrivacy(userId);
  }

  /**
   * Chặn người dùng
   * POST /users/:id/block
   */
  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async blockUser(@Request() req: any, @Param('id', ParseIntPipe) targetUserId: number) {
    const userId = req.user.userId;
    return this.usersService.blockUser(userId, targetUserId);
  }

  /**
   * Bỏ chặn người dùng
   * DELETE /users/:id/block
   */
  @Delete(':id/block')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async unblockUser(@Request() req: any, @Param('id', ParseIntPipe) targetUserId: number) {
    const userId = req.user.userId;
    return this.usersService.unblockUser(userId, targetUserId);
  }

  /**
   * Lấy danh sách người dùng bị chặn
   * GET /users/me/blocked
   */
  @Get('me/blocked')
  @UseGuards(JwtAuthGuard)
  async getBlockedUsers(@Request() req: any) {
    const userId = req.user.userId;
    return this.usersService.getBlockedUsers(userId);
  }

  /**
   * Xóa tài khoản
   * DELETE /users/me/account
   */
  @Delete('me/account')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req: any) {
    const userId = req.user.userId;
    return this.usersService.deleteAccount(userId);
  }
}
