import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestChangeEmailDto, VerifyEmailDto } from './dto/change-email.dto';

@Injectable()
export class UsersService {
  // In-memory storage cho verification codes (nên dùng Redis trong production)
  private emailVerificationCodes = new Map<string, { email: string; code: string; expiresAt: Date }>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  /**
   * Xem profile của user (có kiểm tra quyền riêng tư và chặn)
   */
  async getProfile(userId: number, viewerId?: number): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['communitiesMemberOf', 'communitiesMemberOf.community', 'followers', 'following'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra nếu viewer bị block bởi user
    if (viewerId) {
      const isBlocked = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.blockedUsers', 'blocked')
        .where('user.id = :userId', { userId })
        .andWhere('blocked.id = :viewerId', { viewerId })
        .getCount();

      if (isBlocked > 0) {
        throw new ForbiddenException('Bạn không có quyền xem hồ sơ này');
      }
    }

    // Kiểm tra chế độ riêng tư
    if (user.isPrivate && viewerId !== userId) {
      throw new ForbiddenException('Hồ sơ này ở chế độ riêng tư');
    }

    // Query blog posts của user
    // Nếu xem profile của người khác, chỉ hiển thị bài viết public
    // Nếu xem profile của chính mình, hiển thị tất cả bài viết
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.posts', 'post')
      .where('user.id = :userId', { userId });

    // Chỉ lấy bài viết public nếu không phải chính mình
    if (viewerId !== userId) {
      queryBuilder.andWhere('post.isPublic = true');
    }

    const userWithPosts = await queryBuilder
      .select([
        'user.id',
        'post.id',
        'post.title',
        'post.thumbnailUrl',
        'post.isPublic',
        'post.createdAt',
        'post.upVotes',
        'post.downVotes',
      ])
      .getOne();

    // Chuyển đổi sang DTO
    const profileDto = plainToInstance(ProfileResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // Map communities từ CommunityMember
    profileDto.communities = user.communitiesMemberOf?.map(member => ({
      id: member.community.id,
      name: member.community.name,
      thumbnailUrl: member.community.thumbnailUrl,
    })) || [];

    profileDto.followersCount = user.followers?.length || 0;
    profileDto.followingCount = user.following?.length || 0;
    profileDto.posts = userWithPosts?.posts || [];

    // Kiểm soát hiển thị email và phone
    // Nếu không phải chính mình xem và user không cho phép hiển thị, ẩn thông tin
    if (viewerId !== userId) {
      if (!user.showEmail) {
        profileDto.email = undefined;
      }
      if (!user.showPhoneNumber) {
        profileDto.phoneNumber = undefined;
      }
    }

    return profileDto;
  }

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra username đã tồn tại
    if (updateProfileDto.username && updateProfileDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      });
      if (existingUser) {
        throw new BadRequestException('Username đã được sử dụng');
      }
    }

    // Cập nhật thông tin
    Object.assign(user, updateProfileDto);
    await this.userRepository.save(user);

    return this.getProfile(userId, userId);
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Kiểm tra mật khẩu mới và xác nhận khớp nhau
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu cũ không đúng');
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Yêu cầu đổi email (gửi mã xác thực)
   */
  async requestChangeEmail(userId: number, requestDto: RequestChangeEmailDto): Promise<{ message: string }> {
    const { newEmail } = requestDto;

    // Kiểm tra email đã tồn tại
    const existingUser = await this.userRepository.findOne({ where: { email: newEmail } });
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Tạo mã xác thực 6 số
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Lưu mã xác thực (trong production nên dùng Redis)
    this.emailVerificationCodes.set(`${userId}`, {
      email: newEmail,
      code: verificationCode,
      expiresAt,
    });

    // TODO: Gửi email với verification code
    console.log(`Verification code for user ${userId}: ${verificationCode}`);

    return {
      message: `Mã xác thực đã được gửi đến ${newEmail}. Vui lòng kiểm tra email.`,
    };
  }

  /**
   * Xác thực và cập nhật email mới
   */
  async verifyAndChangeEmail(userId: number, verifyDto: VerifyEmailDto): Promise<{ message: string }> {
    const { newEmail, verificationCode } = verifyDto;

    const storedData = this.emailVerificationCodes.get(`${userId}`);

    if (!storedData) {
      throw new BadRequestException('Không tìm thấy yêu cầu đổi email. Vui lòng thử lại.');
    }

    // Kiểm tra mã xác thực
    if (storedData.code !== verificationCode) {
      throw new BadRequestException('Mã xác thực không đúng');
    }

    // Kiểm tra email khớp
    if (storedData.email !== newEmail) {
      throw new BadRequestException('Email không khớp với yêu cầu');
    }

    // Kiểm tra hết hạn
    if (new Date() > storedData.expiresAt) {
      this.emailVerificationCodes.delete(`${userId}`);
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }

    // Cập nhật email
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    user.email = newEmail;
    await this.userRepository.save(user);

    // Xóa mã xác thực
    this.emailVerificationCodes.delete(`${userId}`);

    return { message: 'Email đã được cập nhật thành công' };
  }

  /**
   * Chuyển đổi chế độ riêng tư
   */
  async togglePrivacy(userId: number): Promise<{ isPrivate: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    user.isPrivate = !user.isPrivate;
    await this.userRepository.save(user);

    return {
      isPrivate: user.isPrivate,
      message: user.isPrivate
        ? 'Hồ sơ của bạn đã được chuyển sang chế độ riêng tư'
        : 'Hồ sơ của bạn đã được công khai',
    };
  }

  /**
   * Chặn người dùng
   */
  async blockUser(userId: number, targetUserId: number): Promise<{ message: string }> {
    if (userId === targetUserId) {
      throw new BadRequestException('Bạn không thể chặn chính mình');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });

    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });

    if (!user || !targetUser) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra đã chặn chưa
    const isBlocked = user.blockedUsers.some((blocked) => blocked.id === targetUserId);
    if (isBlocked) {
      throw new BadRequestException('Bạn đã chặn người dùng này rồi');
    }

    user.blockedUsers.push(targetUser);
    await this.userRepository.save(user);

    return { message: 'Đã chặn người dùng thành công' };
  }

  /**
   * Bỏ chặn người dùng
   */
  async unblockUser(userId: number, targetUserId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra đã chặn chưa
    const blockedIndex = user.blockedUsers.findIndex((blocked) => blocked.id === targetUserId);
    if (blockedIndex === -1) {
      throw new BadRequestException('Bạn chưa chặn người dùng này');
    }

    user.blockedUsers.splice(blockedIndex, 1);
    await this.userRepository.save(user);

    return { message: 'Đã bỏ chặn người dùng thành công' };
  }

  /**
   * Lấy danh sách người dùng bị chặn
   */
  async getBlockedUsers(userId: number): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return user.blockedUsers;
  }

  /**
   * Xóa tài khoản (soft delete)
   */
  async deleteAccount(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Soft delete: có thể thêm trường isDeleted hoặc dùng TypeORM soft delete
    await this.userRepository.softRemove(user);

    return { message: 'Tài khoản đã được xóa thành công' };
  }
}