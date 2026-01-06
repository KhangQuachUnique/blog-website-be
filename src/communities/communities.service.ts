import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CommunityResponseDto } from './dto/response/community-response.dto';
import { MemberResponseDto } from './dto/response/member-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/response/user-response.dto';
import { ECommunityRole } from './enums/community-role.enum';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,

    @InjectRepository(CommunityMember)
    private memberRepository: Repository<CommunityMember>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createCommunityDto: CreateCommunityDto, ownerId: number) {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Owner user not found');

    const community = this.communityRepository.create(createCommunityDto);
    const savedCommunity = await this.communityRepository.save(community);

    const ownerMember = this.memberRepository.create({
      community: savedCommunity,
      user: owner,
      role: ECommunityRole.ADMIN,
    });

    await this.memberRepository.save(ownerMember);

    const memberCount = await this.memberRepository.count({
      where: { community: { id: savedCommunity.id }, role: Not(ECommunityRole.PENDING) },
    });

    return {
      id: savedCommunity.id,
      name: savedCommunity.name,
      description: savedCommunity.description,
      thumbnailUrl: savedCommunity.thumbnailUrl,
      isPublic: savedCommunity.isPublic,
      memberCount,
      role: ECommunityRole.ADMIN,
    } as CommunityResponseDto;
  }

  async findAll(): Promise<CommunityResponseDto[]> {
    const communities = await this.communityRepository.find();
    return Promise.all(
      communities.map(async (c) => {
        const memberCount = await this.memberRepository.count({
          where: { community: { id: c.id }, role: Not(ECommunityRole.PENDING) },
        });
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          thumbnailUrl: c.thumbnailUrl,
          isPublic: c.isPublic,
          role: 'NONE',
          memberCount,
        } as CommunityResponseDto;
      }),
    );
  }

  async findOne(id: number) {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ['members', 'emojis'],
    });

    if (!community) throw new NotFoundException('Community not found');

    const memberCount = await this.memberRepository.count({
      where: { community: { id: community.id }, role: Not(ECommunityRole.PENDING) },
    });

    return {
      id: community.id,
      name: community.name,
      description: community.description,
      thumbnailUrl: community.thumbnailUrl,
      isPublic: community.isPublic,
      role: 'NONE',
      memberCount,
    } as CommunityResponseDto;
  }

  async getSettings(id: number, userId?: number): Promise<any> {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ['members', 'bannedUsers'],
    });
    if (!community) throw new NotFoundException('Community not found');

    const isBanned = !!userId && !!community.bannedUsers?.some((u) => u.id === userId);

    //  chưa login => NONE
    if (!userId) {
      const memberCount = await this.memberRepository.count({
        where: { community: { id }, role: Not(ECommunityRole.PENDING) },
      });
      return {
        id: community.id,
        name: community.name,
        description: community.description,
        thumbnailUrl: community.thumbnailUrl,
        // coverImageUrl: community.coverImageUrl ?? null,
        requirePostApproval: !!community.requirePostApproval,
        requireMemberApproval: !!community.requireMemberApproval,
        isPublic: community.isPublic,
        role: 'NONE',
        isBanned: false,
        memberCount,
      } as CommunityResponseDto;
    }

    const member = await this.memberRepository.findOne({
      where: { community: { id }, user: { id: userId } },
    });

    const role = member?.role ?? 'NONE';

    const memberCount = await this.memberRepository.count({
      where: { community: { id }, role: Not(ECommunityRole.PENDING) },
    });

    return {
      id: community.id,
      name: community.name,
      description: community.description,
      thumbnailUrl: community.thumbnailUrl,
      // coverImageUrl: community.coverImageUrl ?? null,
      requirePostApproval: !!community.requirePostApproval,
      requireMemberApproval: !!community.requireMemberApproval,
      isPublic: community.isPublic,
      role,
      isBanned,
      memberCount,
    } as CommunityResponseDto;
  }

  async update(id: number, updateCommunityDto: UpdateCommunityDto, userId: number) {
    const community = await this.communityRepository.findOne({ where: { id } });
    if (!community) throw new NotFoundException('Community not found');

    const me = await this.memberRepository.findOne({
      where: { community: { id }, user: { id: userId } },
    });

    const ok = !!me && (me.role === ECommunityRole.ADMIN || me.role === ECommunityRole.MODERATOR);

    if (!ok) {
      throw new ForbiddenException('Bạn không có quyền cập nhật cộng đồng này.');
    }

    await this.communityRepository.update(id, updateCommunityDto);
    return this.findOne(id);
  }

  /**
   *  JOIN community
   * - Public + không require approval => MEMBER ngay
   * - Private hoặc requireMemberApproval => PENDING
   */
  async joinCommunity(communityId: number, userId: number) {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      relations: ['bannedUsers'],
    });

    //  check null trước
    if (!community) throw new NotFoundException('Community not found');

    //  check banned
    const banned = community.bannedUsers ?? [];
    if (banned.some((u) => u.id === userId)) {
      throw new ForbiddenException('Bạn đã bị cấm khỏi cộng đồng này.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.memberRepository.findOne({
      where: { community: { id: communityId }, user: { id: userId } },
    });

    if (existing) {
      return {
        ok: true,
        role: existing.role,
        status: existing.role === ECommunityRole.PENDING ? 'PENDING' : 'JOINED',
      };
    }

    const shouldPending = !community.isPublic || !!community.requireMemberApproval;
    const roleToSet = shouldPending ? ECommunityRole.PENDING : ECommunityRole.MEMBER;

    const newMember = this.memberRepository.create({
      community,
      user,
      role: roleToSet,
    });

    await this.memberRepository.save(newMember);

    return {
      ok: true,
      role: roleToSet,
      status: roleToSet === ECommunityRole.PENDING ? 'PENDING' : 'JOINED',
    };
  }

  /**
   *  Leave community
   */
  async leaveCommunity(communityId: number, userId: number) {
    const member = await this.memberRepository.findOne({
      where: { community: { id: communityId }, user: { id: userId } },
    });

    if (!member) {
      throw new NotFoundException('Bạn chưa tham gia cộng đồng này.');
    }

    if (member.role === ECommunityRole.ADMIN) {
      const adminCount = await this.memberRepository.count({
        where: { community: { id: communityId }, role: ECommunityRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Bạn là admin cuối cùng. Hãy chuyển quyền admin trước khi rời cộng đồng.',
        );
      }
    }

    await this.memberRepository.remove(member);
    return { left: true };
  }

  /**
   *  Delete community (chỉ ADMIN)
   */
  async removeCommunity(communityId: number, userId: number) {
    const member = await this.memberRepository.findOne({
      where: { community: { id: communityId }, user: { id: userId } },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không có quyền xóa cộng đồng.');
    }

    if (member.role !== ECommunityRole.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có thể xóa cộng đồng.');
    }

    await this.memberRepository.delete({ community: { id: communityId } });
    await this.communityRepository.delete(communityId);

    return { deleted: true };
  }

  async getMyCommunities(userId: number): Promise<CommunityResponseDto[]> {
    const memberships = await this.memberRepository.find({
      where: { user: { id: userId }, role: Not(ECommunityRole.PENDING) },
      relations: ['community', 'community.members'],
      order: { joinedAt: 'DESC' },
    });

    return Promise.all(
      memberships.map(async (m) => {
        const memberCount = await this.memberRepository.count({
          where: { community: { id: m.community.id }, role: Not(ECommunityRole.PENDING) },
        });

        return {
          id: m.community.id,
          name: m.community.name,
          description: m.community.description,
          thumbnailUrl: m.community.thumbnailUrl,
          isPublic: m.community.isPublic,
          role: m.role,
          memberCount,
        };
      }),
    );
  }

  async getMembers(communityId: number, role?: ECommunityRole, userId?: number) {
    const community = await this.communityRepository.findOne({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    //  private => phải login + đã được duyệt mới xem
    if (!community.isPublic) {
      if (!userId) throw new ForbiddenException('Cộng đồng riêng tư. Vui lòng tham gia để xem.');
      const me = await this.memberRepository.findOne({
        where: { community: { id: communityId }, user: { id: userId } },
      });
      if (!me || me.role === ECommunityRole.PENDING) {
        throw new ForbiddenException('Cộng đồng riêng tư. Vui lòng tham gia để xem.');
      }
    }

    const members = await this.memberRepository.find({
      where: {
        community: { id: communityId },
        role: role ? role : Not(ECommunityRole.PENDING),
      },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
    });

    return members.map((m) => {
      const userDto = plainToInstance(UserResponseDto, m.user, { excludeExtraneousValues: true });
      return plainToInstance(MemberResponseDto, {
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: userDto,
      });
    });
  }

  async updateMemberRole(
    communityId: number,
    targetMemberId: number,
    dto: UpdateMemberRoleDto,
    requesterId: number,
  ) {
    const requester = await this.memberRepository.findOne({
      where: { community: { id: communityId }, user: { id: requesterId } },
    });

    const requesterOk =
      requester &&
      (requester.role === ECommunityRole.ADMIN || requester.role === ECommunityRole.MODERATOR);

    if (!requesterOk) {
      throw new ForbiddenException('Bạn không có quyền đổi vai trò trong cộng đồng này.');
    }

    const target = await this.memberRepository.findOne({
      where: { id: targetMemberId, community: { id: communityId } },
      relations: ['user'],
    });

    if (!target) throw new NotFoundException('Member not found in this community');

    const newRole = dto.role;

    // (Tuỳ bạn) chặn tự đổi role cho chắc
    if (target.user.id === requesterId) {
      throw new ForbiddenException('Bạn không thể tự đổi vai trò của chính mình.');
    }

    // MOD rules
    if (requester.role === ECommunityRole.MODERATOR) {
      // mod không đụng admin
      if (target.role === ECommunityRole.ADMIN) {
        throw new ForbiddenException('Moderator không thể đổi vai trò của Admin.');
      }
      // mod không gán admin
      if (newRole === ECommunityRole.ADMIN) {
        throw new ForbiddenException('Moderator không thể gán vai trò Admin.');
      }
      // mod chỉ MEMBER <-> MODERATOR (không set PENDING)
      const allowed = [ECommunityRole.MEMBER, ECommunityRole.MODERATOR];
      if (!allowed.includes(newRole)) {
        throw new ForbiddenException('Moderator chỉ có thể đổi MEMBER ↔ MODERATOR.');
      }
    }

    // ADMIN rules
    if (requester.role === ECommunityRole.ADMIN) {
      // không cho set PENDING bằng đổi role (PENDING chỉ dành cho join approval)
      if (newRole === ECommunityRole.PENDING) {
        throw new ForbiddenException('Không thể chuyển thành PENDING bằng chức năng đổi role.');
      }

      // không được làm mất admin cuối
      if (target.role === ECommunityRole.ADMIN && newRole !== ECommunityRole.ADMIN) {
        const adminCount = await this.memberRepository.count({
          where: { community: { id: communityId }, role: ECommunityRole.ADMIN },
        });
        if (adminCount <= 1) {
          throw new ForbiddenException('Không thể hạ cấp Admin cuối cùng.');
        }
      }
    }

    target.role = newRole;
    const saved = await this.memberRepository.save(target);

    const user = await this.userRepository.findOne({ where: { id: saved.user.id } });
    const userDto = plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });

    return plainToInstance(MemberResponseDto, {
      id: saved.id,
      role: saved.role,
      joinedAt: saved.joinedAt,
      user: userDto,
    });
  }

  async removeMember(communityId: number, memberId: number, requesterId: number, ban = true) {
    //  requester phải là admin/mod
    const requester = await this.memberRepository.findOne({
      where: { community: { id: communityId }, user: { id: requesterId } },
    });

    const ok =
      requester &&
      (requester.role === ECommunityRole.ADMIN || requester.role === ECommunityRole.MODERATOR);

    if (!ok) throw new ForbiddenException('Bạn không có quyền kick thành viên.');

    const member = await this.memberRepository.findOne({
      where: { id: memberId, community: { id: communityId } },
      relations: ['user', 'community'],
    });

    if (!member) throw new NotFoundException('Member not found in this community');

    // Không cho kick chính mình
    if (member.user.id === requesterId) {
      throw new ForbiddenException('Bạn không thể kick chính mình.');
    }

    // MODERATOR: không được kick ADMIN/MODERATOR
    if (
      requester.role === ECommunityRole.MODERATOR &&
      (member.role === ECommunityRole.ADMIN || member.role === ECommunityRole.MODERATOR)
    ) {
      throw new ForbiddenException('Moderator không thể kick Admin/Moderator.');
    }

    // ADMIN: không được kick ADMIN (bao gồm admin khác)
    if (requester.role === ECommunityRole.ADMIN && member.role === ECommunityRole.ADMIN) {
      throw new ForbiddenException('Không thể kick Admin.');
    }

    //  BAN user để không join lại
    if (ban) {
      const community = await this.communityRepository.findOne({
        where: { id: communityId },
        relations: ['bannedUsers'],
      });
      if (!community) throw new NotFoundException('Community not found');

      const alreadyBanned = (community.bannedUsers ?? []).some((u) => u.id === member.user.id);
      if (!alreadyBanned) {
        community.bannedUsers = [...(community.bannedUsers ?? []), member.user];
        await this.communityRepository.save(community);
      }
    }

    await this.memberRepository.remove(member);
    return { deleted: true, banned: ban };
  }

  // Functions to support another services
  async getUserCommunities(userId: number): Promise<CommunityResponseDto[]> {
    const memberships = await this.memberRepository.find({
      where: { user: { id: userId }, role: Not(ECommunityRole.PENDING) },
      relations: ['community', 'community.members'],
      order: { joinedAt: 'DESC' },
    });
    return Promise.all(
      memberships.map(async (m) => {
        const memberCount = await this.memberRepository.count({
          where: { community: { id: m.community.id }, role: Not(ECommunityRole.PENDING) },
        });
        return {
          id: m.community.id,
          name: m.community.name,
          description: m.community.description,
          thumbnailUrl: m.community.thumbnailUrl,
          isPublic: m.community.isPublic,
          role: m.role,
          memberCount,
        };
      }),
    );
  }
}
