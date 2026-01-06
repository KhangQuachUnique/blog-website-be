import { Repository, Like, ILike } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';

import { User } from './entities/user.entity';
import { EUserRole } from './enums/role.enum';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestChangeEmailDto, VerifyEmailDto } from './dto/change-email.dto';
import { UserResponseDto } from './dto/response/user-response.dto';
import {
  AdminUserResponseDto,
  AdminUserListResponseDto,
} from './dto/response/admin-user-response.dto';
import { AdminUserQueryDto, AdminCreateUserDto, AdminUpdateUserDto } from './dto/admin-user.dto';
import { CommunitiesService } from 'src/communities/communities.service';
import { BlogPostsService } from 'src/blog-posts/blog-posts.service';
import { PostResponseDto } from 'src/blog-posts/dto/response/blog-post-response.dto';
import { CommunityResponseDto } from 'src/communities/dto/response/community-response.dto';

@Injectable()
export class UsersService {
  // In-memory storage cho verification codes (nên dùng Redis trong production)
  private emailVerificationCodes = new Map<
    string,
    { email: string; code: string; expiresAt: Date }
  >();

  constructor(
    private readonly communitiesService: CommunitiesService,

    private readonly blogPostsService: BlogPostsService,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  /**
   * === Nhóm hàm (Tổng quan) ===
   *
   * Nhóm: Account & Profile
   * - `findAll()` : Lấy tất cả users (Admin)
   * - `getProfile(userId, viewerId?)` : Xem hồ sơ user (tính privacy + block)
   * - `updateProfile(userId, dto)` : Cập nhật hồ sơ
   * - `changePassword(userId, dto)` : Đổi mật khẩu
   * - `requestChangeEmail(userId, dto)` : Yêu cầu đổi email (gửi mã)
   * - `verifyAndChangeEmail(userId, dto)` : Xác thực và cập nhật email
   * - `togglePrivacy(userId)` : Đổi chế độ riêng tư
   *
   * Nhóm: Social (Follow / Block)
   * - `searchUsers(query, currentUserId)` : Tìm người dùng theo username
   * - `blockUser(userId, targetUserId)` : Chặn người dùng
   * - `unblockUser(userId, targetUserId)` : Bỏ chặn
   * - `getBlockedUsers(userId)` : Lấy danh sách đã chặn
   * - `followUser(userId, targetUserId)` : Follow người dùng
   * - `unfollowUser(userId, targetUserId)` : Unfollow người dùng
   * - `getFollowers(userId, viewerId?)` : Lấy danh sách followers
   * - `getFollowing(userId, viewerId?)` : Lấy danh sách following
   *
   * Nhóm: Admin
   * - `deleteAccount(userId)` : Xóa tài khoản (hard delete)
   * - `updateUserRole(userId, role)` : Cập nhật role của user
   */

  /**
   * === Nhóm: Account & Profile ===
   * - `findAll()` : Lấy tất cả users (Admin)
   * - `getProfile(userId, viewerId?)` : Xem hồ sơ user (tính privacy + block)
   * - `updateProfile(userId, dto)` : Cập nhật hồ sơ
   * - `changePassword(userId, dto)` : Đổi mật khẩu
   * - `requestChangeEmail(userId, dto)` : Yêu cầu đổi email (gửi mã)
   * - `verifyAndChangeEmail(userId, dto)` : Xác thực và cập nhật email
   * - `togglePrivacy(userId)` : Đổi chế độ riêng tư
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      select: ['id', 'username', 'email', 'type', 'isPrivate', 'joinAt'],
      order: { joinAt: 'DESC' },
    });
    return users.map((u) => plainToInstance(UserResponseDto, u, { excludeExtraneousValues: true }));
  }

  /**
   * Xem profile của user (có kiểm tra quyền riêng tư và chặn)
   */
  async getProfile(userId: number, viewerId?: number): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers', 'following'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra nếu một trong hai bên đã chặn (kiểm tra cả 2 chiều)
    if (viewerId && viewerId !== userId) {
      // Kiểm tra user có chặn viewer không
      const isBlockedByUser = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.blockedUsers', 'blocked')
        .where('user.id = :userId', { userId })
        .andWhere('blocked.id = :viewerId', { viewerId })
        .getCount();

      // Kiểm tra viewer có chặn user không
      const isBlockedByViewer = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.blockedUsers', 'blocked')
        .where('user.id = :viewerId', { viewerId })
        .andWhere('blocked.id = :userId', { userId })
        .getCount();

      if (isBlockedByUser > 0 || isBlockedByViewer > 0) {
        throw new ForbiddenException('Bạn không có quyền xem hồ sơ này');
      }
    }

    // Kiểm tra xem có phải chính chủ đang xem profile của mình không
    const isOwner = viewerId === userId;

    // Kiểm tra chế độ riêng tư
    // Nếu profile ở chế độ riêng tư và người xem không phải chính chủ
    const isPrivateAndNotOwner = user.isPrivate && !isOwner;

    let posts: PostResponseDto[] = [];
    let communities: CommunityResponseDto[] = [];

    // Nếu profile private và viewer không phải chính chủ thì không trả posts/communities
    if (!isPrivateAndNotOwner) {
      posts = await this.blogPostsService.findAllPostsByUser(userId, viewerId);
      communities = await this.communitiesService.getUserCommunities(userId);
    }

    // Chuyển đổi sang DTO
    const profileDto = plainToInstance(ProfileResponseDto, user, {
      excludeExtraneousValues: true,
    });

    profileDto.posts = posts;
    profileDto.communities = communities;

    // Followers/Following count - ẩn nếu private và không phải chính chủ
    profileDto.followersCount = isPrivateAndNotOwner ? 0 : user.followers?.length || 0;
    profileDto.followingCount = isPrivateAndNotOwner ? 0 : user.following?.length || 0;

    // Kiểm tra xem viewer có đang follow user không (chỉ khi không phải chính mình)
    if (viewerId && !isOwner) {
      const isFollowing = user.followers?.some((follower) => follower.id === viewerId) || false;
      profileDto.isFollowing = isFollowing;
    }

    // Kiểm soát hiển thị email và phone
    // Nếu không phải chính mình xem và user không cho phép hiển thị, ẩn thông tin
    // Hoặc nếu private profile, luôn ẩn với người khác
    if (!isOwner) {
      if (!user.showEmail || isPrivateAndNotOwner) {
        profileDto.email = undefined;
      }
      if (!user.showPhoneNumber || isPrivateAndNotOwner) {
        profileDto.phoneNumber = undefined;
      }
      // Ẩn bio nếu private
      if (isPrivateAndNotOwner) {
        profileDto.bio = undefined;
      }
    } else {
      // Nếu là chính mình xem, luôn hiển thị email và phone
      profileDto.email = user.email;
      profileDto.phoneNumber = user.phoneNumber ?? undefined;
    }

    return profileDto;
  }

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
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
    // Xử lý các trường optional - nếu undefined thì set null để xóa giá trị cũ
    if ('bio' in updateProfileDto) {
      user.bio = updateProfileDto.bio || null;
    }
    if ('avatarUrl' in updateProfileDto) {
      user.avatarUrl = updateProfileDto.avatarUrl || null;
    }
    if ('coverImageUrl' in updateProfileDto) {
      user.coverImageUrl = updateProfileDto.coverImageUrl || null;
    }
    if ('phoneNumber' in updateProfileDto) {
      user.phoneNumber = updateProfileDto.phoneNumber || null;
    }
    if ('dob' in updateProfileDto) {
      user.dob = updateProfileDto.dob ? new Date(updateProfileDto.dob) : null;
    }
    if ('gender' in updateProfileDto) {
      user.gender = updateProfileDto.gender || null;
    }

    // Cập nhật các trường còn lại
    if (updateProfileDto.username) {
      user.username = updateProfileDto.username;
    }
    if (updateProfileDto.showEmail !== undefined) {
      user.showEmail = updateProfileDto.showEmail;
    }
    if (updateProfileDto.showPhoneNumber !== undefined) {
      user.showPhoneNumber = updateProfileDto.showPhoneNumber;
    }

    await this.userRepository.save(user);

    return this.getProfile(userId, userId);
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
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
  async requestChangeEmail(
    userId: number,
    requestDto: RequestChangeEmailDto,
  ): Promise<{ message: string }> {
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
    console.log(`Mã xác thực cho user ${userId}: ${verificationCode}`);

    return {
      message: `Mã xác thực đã được gửi đến ${newEmail}. Vui lòng kiểm tra email.`,
    };
  }

  /**
   * Xác thực và cập nhật email mới
   */
  async verifyAndChangeEmail(
    userId: number,
    verifyDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
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
   * === Nhóm: Social (Follow / Block) ===
   * - `searchUsers(query, currentUserId)` : Tìm người dùng theo username
   * - `blockUser(userId, targetUserId)` : Chặn người dùng
   * - `unblockUser(userId, targetUserId)` : Bỏ chặn người dùng
   * - `getBlockedUsers(userId)` : Lấy danh sách đã chặn
   * - `followUser(userId, targetUserId)` : Follow người dùng
   * - `unfollowUser(userId, targetUserId)` : Unfollow người dùng
   * - `getFollowers(userId, viewerId?)` : Lấy danh sách followers
   * - `getFollowing(userId, viewerId?)` : Lấy danh sách following
   */
  async searchUsers(query: string, currentUserId: number): Promise<UserResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:query)', { query: `%${query}%` })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .select(['user.id', 'user.username', 'user.avatarUrl'])
      .take(10)
      .getMany();

    return users.map((u) => plainToInstance(UserResponseDto, u, { excludeExtraneousValues: true }));
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
  async getBlockedUsers(userId: number): Promise<UserResponseDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return user.blockedUsers.map((u) =>
      plainToInstance(UserResponseDto, u, { excludeExtraneousValues: true }),
    );
  }

  /**
   * === Nhóm: Admin ===
   * - `deleteAccount(userId)` : Xóa tài khoản (hard delete)
   * - `updateUserRole(userId, role)` : Cập nhật role của user
   * - `findAllAdmin(query)` : Lấy danh sách users với filter + pagination
   * - `findByIdAdmin(userId)` : Lấy chi tiết user bất kỳ
   * - `createUserByAdmin(dto)` : Tạo user mới
   * - `updateUserByAdmin(userId, dto)` : Cập nhật user bất kỳ
   * - `deleteUserByAdmin(userId)` : Xóa user (không cho xóa admin)
   * - `banUser(userId, reason)` : Khóa tài khoản user
   * - `unbanUser(userId)` : Mở khóa tài khoản user
   */

  /**
   * Xóa tài khoản của chính mình
   */
  async deleteAccount(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Hard delete: xóa vĩnh viễn khỏi database
    await this.userRepository.remove(user);

    return { message: 'Tài khoản đã được xóa thành công' };
  }

  /**
   * Lấy danh sách users cho Admin với filter và pagination
   */
  async findAllAdmin(query: AdminUserQueryDto): Promise<AdminUserListResponseDto> {
    const { search, status, page = 1, limit = 10, sortBy = 'id', sortOrder = 'ASC' } = query;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Filter theo search term (username, email)
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.username) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Filter theo status
    if (status && status !== 'ALL') {
      if (status === 'BANNED') {
        queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned: true });
      } else if (status === 'ACTIVE') {
        queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned: false });
      }
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by - dynamic sorting
    const validSortFields = ['id', 'username', 'email', 'joinAt', 'isBanned'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    queryBuilder.orderBy(`user.${field}`, order);

    // Select fields
    queryBuilder.select([
      'user.id',
      'user.username',
      'user.email',
      'user.phoneNumber',
      'user.avatarUrl',
      'user.bio',
      'user.type',
      'user.isBanned',
      'user.isPrivate',
      'user.dob',
      'user.gender',
      'user.joinAt',
    ]);

    const users = await queryBuilder.getMany();

    const data = users.map((u) =>
      plainToInstance(AdminUserResponseDto, u, { excludeExtraneousValues: true }),
    );

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy chi tiết user bất kỳ (Admin only)
   */
  async findByIdAdmin(userId: number): Promise<AdminUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'phoneNumber',
        'avatarUrl',
        'bio',
        'type',
        'isBanned',
        'isPrivate',
        'dob',
        'gender',
        'joinAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return plainToInstance(AdminUserResponseDto, user, { excludeExtraneousValues: true });
  }

  /**
   * Tạo user mới bởi Admin
   */
  async createUserByAdmin(dto: AdminCreateUserDto): Promise<AdminUserResponseDto> {
    // Kiểm tra username/email đã tồn tại
    const existingUser = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      if (existingUser.username === dto.username) {
        throw new ConflictException('Username đã tồn tại');
      }
      throw new ConflictException('Email đã tồn tại');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Tạo user mới
    const newUser = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      phoneNumber: dto.phoneNumber || null,
      type: dto.type || EUserRole.USER,
      isVerified: 'verified', // Admin tạo tài khoản tự động verified
    });

    const savedUser = await this.userRepository.save(newUser);

    return plainToInstance(AdminUserResponseDto, savedUser, { excludeExtraneousValues: true });
  }

  /**
   * Cập nhật user bất kỳ bởi Admin
   */
  async updateUserByAdmin(
    userId: number,
    dto: AdminUpdateUserDto,
    adminId: number,
  ): Promise<AdminUserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra username mới có bị trùng không
    if (dto.username && dto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUser) {
        throw new ConflictException('Username đã tồn tại');
      }
      user.username = dto.username;
    }

    // Kiểm tra email mới có bị trùng không
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email đã tồn tại');
      }
      user.email = dto.email;
    }

    // Cập nhật các field khác
    if (dto.phoneNumber !== undefined) {
      user.phoneNumber = dto.phoneNumber || null;
    }

    if (dto.type !== undefined) {
      // Không cho phép admin tự thay đổi role của mình
      if (userId === adminId) {
        throw new ForbiddenException('Bạn không thể thay đổi role của chính mình');
      }
      user.type = dto.type;
    }

    await this.userRepository.save(user);

    return plainToInstance(AdminUserResponseDto, user, { excludeExtraneousValues: true });
  }

  /**
   * Xóa user bởi Admin
   */
  async deleteUserByAdmin(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Không cho phép xóa admin khác
    if (user.type === EUserRole.ADMIN) {
      throw new ForbiddenException('Không thể xóa tài khoản Admin');
    }

    await this.userRepository.remove(user);

    return { message: 'Đã xóa người dùng thành công' };
  }

  /**
   * Follow người dùng
   */
  async followUser(userId: number, targetUserId: number): Promise<{ message: string }> {
    if (userId === targetUserId) {
      throw new BadRequestException('Không thể follow chính mình');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!user || !targetUser) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra đã follow chưa
    const isAlreadyFollowing = user.following?.some((u) => u.id === targetUserId);
    if (isAlreadyFollowing) {
      throw new BadRequestException('Bạn đã follow người dùng này rồi');
    }

    // Thêm vào danh sách following
    if (!user.following) {
      user.following = [];
    }
    user.following.push(targetUser);
    await this.userRepository.save(user);

    return { message: 'Đã follow người dùng thành công' };
  }

  /**
   * Unfollow người dùng
   */
  async unfollowUser(userId: number, targetUserId: number): Promise<{ message: string }> {
    if (userId === targetUserId) {
      throw new BadRequestException('Không thể unfollow chính mình');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra đã follow chưa
    const followIndex = user.following?.findIndex((u) => u.id === targetUserId);
    if (followIndex === undefined || followIndex === -1) {
      throw new BadRequestException('Bạn chưa follow người dùng này');
    }

    // Xóa khỏi danh sách following
    user.following.splice(followIndex, 1);
    await this.userRepository.save(user);

    return { message: 'Đã unfollow người dùng thành công' };
  }

  /**
   * Cập nhật role của user (Admin only)
   */
  async updateUserRole(
    userId: number,
    role: EUserRole,
  ): Promise<{ message: string; user: AdminUserResponseDto }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    user.type = role;
    await this.userRepository.save(user);

    const userDto = plainToInstance(AdminUserResponseDto, user, { excludeExtraneousValues: true });

    return {
      message: `Đã cập nhật role của người dùng thành ${role}`,
      user: userDto,
    };
  }

  /**
   * Cấm người dùng (Admin only)
   * @param userId ID của người dùng cần ban
   * @param reason Lý do ban (optional)
   */
  async banUser(
    userId: number,
    reason?: string,
  ): Promise<{ message: string; user: AdminUserResponseDto }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (user.type === EUserRole.ADMIN) {
      throw new ForbiddenException('Không thể khóa tài khoản Admin');
    }

    if (user.isBanned) {
      throw new BadRequestException('Người dùng này đã bị khóa rồi');
    }

    user.isBanned = true;
    await this.userRepository.save(user);

    const userDto = plainToInstance(AdminUserResponseDto, user, { excludeExtraneousValues: true });

    return {
      message: `Đã khóa tài khoản người dùng ${user.username}${reason ? `. Lý do: ${reason}` : ''}`,
      user: userDto,
    };
  }

  /**
   * Mở khóa tài khoản người dùng (Admin only)
   * @param userId ID của người dùng cần unban
   */
  async unbanUser(userId: number): Promise<{ message: string; user: AdminUserResponseDto }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (!user.isBanned) {
      throw new BadRequestException('Người dùng này không bị khóa');
    }

    user.isBanned = false;
    await this.userRepository.save(user);

    const userDto = plainToInstance(AdminUserResponseDto, user, { excludeExtraneousValues: true });

    return {
      message: `Đã mở khóa tài khoản người dùng ${user.username}`,
      user: userDto,
    };
  }

  /**
   * Lấy danh sách followers của một user
   */
  async getFollowers(userId: number, viewerId?: number): Promise<UserResponseDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra quyền riêng tư
    const isOwner = viewerId === userId;
    if (user.isPrivate && !isOwner) {
      throw new ForbiddenException('Hồ sơ này ở chế độ riêng tư');
    }

    // Lấy danh sách following của viewer để check trạng thái isFollowing
    let viewerFollowing: number[] = [];
    if (viewerId) {
      const viewer = await this.userRepository.findOne({
        where: { id: viewerId },
        relations: ['following'],
      });
      viewerFollowing = viewer?.following?.map((u) => u.id) || [];
    }

    // Map sang DTO
    const followers =
      user.followers?.map((follower) => {
        const dto = plainToInstance(UserResponseDto, follower, {
          excludeExtraneousValues: true,
        });
        // Check xem viewer có đang follow user này không
        if (viewerId && follower.id !== viewerId) {
          dto.isFollowing = viewerFollowing.includes(follower.id);
        }
        return dto;
      }) || [];

    return followers;
  }

  /**
   * Lấy danh sách following của một user
   */
  async getFollowing(userId: number, viewerId?: number): Promise<UserResponseDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra quyền riêng tư
    const isOwner = viewerId === userId;
    if (user.isPrivate && !isOwner) {
      throw new ForbiddenException('Hồ sơ này ở chế độ riêng tư');
    }

    // Lấy danh sách following của viewer để check trạng thái isFollowing
    let viewerFollowing: number[] = [];
    if (viewerId) {
      const viewer = await this.userRepository.findOne({
        where: { id: viewerId },
        relations: ['following'],
      });
      viewerFollowing = viewer?.following?.map((u) => u.id) || [];
    }

    // Map sang DTO
    const following =
      user.following?.map((followedUser) => {
        const dto = plainToInstance(UserResponseDto, followedUser, {
          excludeExtraneousValues: true,
        });
        // Check xem viewer có đang follow user này không
        if (viewerId && followedUser.id !== viewerId) {
          dto.isFollowing = viewerFollowing.includes(followedUser.id);
        }
        return dto;
      }) || [];

    return following;
  }
}
