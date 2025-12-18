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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EUserRole } from './enums/role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestChangeEmailDto, VerifyEmailDto } from './dto/change-email.dto';

interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Xem profile của chính mình
   * GET /users/me/profile
   * NOTE: Phải đặt trước route :id/profile để tránh conflict
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: RequestWithUser) {
    const userId = req.user.userId;
    // Truyền userId vào cả 2 tham số để service biết đây là owner
    return this.usersService.getProfile(userId, userId);
  }

  /**
   * Xem profile của user bất kỳ (public hoặc có auth optional)
   * Sử dụng OptionalJwtAuthGuard để tự động lấy viewerId nếu user đã đăng nhập
   */
  @Get(':id/profile')
  @UseGuards(OptionalJwtAuthGuard)
  async getProfile(
    @Param('id', ParseIntPipe) userId: number,
    @Request() req: RequestWithUser,
  ) {
    // Nếu user đã đăng nhập, lấy viewerId từ token
    const viewerId = req.user?.userId;
    return this.usersService.getProfile(userId, viewerId);
  }

  /**
   * Cập nhật profile của chính mình
   * PATCH /users/me/profile
   */
  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Request() req: RequestWithUser, @Body() updateProfileDto: UpdateProfileDto) {
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
  async changePassword(@Request() req: RequestWithUser, @Body() changePasswordDto: ChangePasswordDto) {
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
  async requestChangeEmail(@Request() req: RequestWithUser, @Body() requestDto: RequestChangeEmailDto) {
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
  async verifyEmail(@Request() req: RequestWithUser, @Body() verifyDto: VerifyEmailDto) {
    const userId = req.user.userId;
    return this.usersService.verifyAndChangeEmail(userId, verifyDto);
  }

  /**
   * Chuyển đổi chế độ riêng tư
   * PATCH /users/me/privacy
   */
  @Patch('me/privacy')
  @UseGuards(JwtAuthGuard)
  async togglePrivacy(@Request() req: RequestWithUser) {
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
  async blockUser(@Request() req: RequestWithUser, @Param('id', ParseIntPipe) targetUserId: number) {
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
  async unblockUser(@Request() req: RequestWithUser, @Param('id', ParseIntPipe) targetUserId: number) {
    const userId = req.user.userId;
    return this.usersService.unblockUser(userId, targetUserId);
  }

  /**
   * Lấy danh sách người dùng bị chặn
   * GET /users/me/blocked
   */
  @Get('me/blocked')
  @UseGuards(JwtAuthGuard)
  async getBlockedUsers(@Request() req: RequestWithUser) {
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
  async deleteAccount(@Request() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.usersService.deleteAccount(userId);
  }

  /**
   * Follow người dùng
   * POST /users/:id/follow
   */
  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async followUser(@Request() req: RequestWithUser, @Param('id', ParseIntPipe) targetUserId: number) {
    const userId = req.user.userId;
    return this.usersService.followUser(userId, targetUserId);
  }

  /**
   * Unfollow người dùng
   * DELETE /users/:id/follow
   */
  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Request() req: RequestWithUser, @Param('id', ParseIntPipe) targetUserId: number) {
    const userId = req.user.userId;
    return this.usersService.unfollowUser(userId, targetUserId);
  }

  // ==================== ADMIN ROUTES ====================

  /**
   * Lấy tất cả users (Admin only)
   * GET /users/admin/all
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.ADMIN)
  async getAllUsersAdmin() {
    return this.usersService.findAll();
  }

  /**
   * Xóa user bất kỳ (Admin only)
   * DELETE /users/admin/:id
   */
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.ADMIN)
  async deleteUserByAdmin(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.deleteAccount(userId);
  }

  /**
   * Cập nhật role của user (Admin only)
   * PATCH /users/admin/:id/role
   */
  @Patch('admin/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EUserRole.ADMIN)
  async updateUserRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body('role') role: EUserRole,
  ) {
    return this.usersService.updateUserRole(userId, role);
  }
}
