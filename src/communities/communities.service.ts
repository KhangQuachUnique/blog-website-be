import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CommunitySettingResponseDto } from './dto/response/community-response.dto';
import { plainToInstance } from 'class-transformer';
import { MyCommunityResponseDto } from './dto/response/my-community-response.dto';
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

  // ====== COMMUNITY CRUD ======
  async create(createCommunityDto: CreateCommunityDto, ownerId: number) {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    // 1. Tạo community
    const community = this.communityRepository.create(createCommunityDto);
    const savedCommunity = await this.communityRepository.save(community);

    // 2. Tạo record member cho người tạo với role ADMIN
    const ownerMember = this.memberRepository.create({
      community: savedCommunity,
      user: owner,
      role: ECommunityRole.ADMIN,
    });

    await this.memberRepository.save(ownerMember);

    return savedCommunity;
  }

  findAll() {
    return this.communityRepository.find();
  }

  async getSettings(id: number, userId: number): Promise<any> {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!community) throw new NotFoundException("Community not found");

    // lấy role của user trong community
    const member = await this.memberRepository.findOne({
      where: { community: { id }, user: { id: userId } },
    });

    const role = member?.role ?? "PENDING";  // nếu chưa tham gia → PENDING

    // ✅ chỉ đếm member đã duyệt
    const memberCount = await this.memberRepository.count({
      where: {
        community: { id },
        role: Not(ECommunityRole.PENDING),
      },
    });

    return {
      ...community,
      role,
      memberCount,
    };
  }

  findOne(id: number) {
    return this.communityRepository.findOne({ where: { id }, relations: ['members', 'emojis'] });
  }

  async update(id: number, updateCommunityDto: UpdateCommunityDto) {
    await this.communityRepository.update(id, updateCommunityDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.communityRepository.delete(id);
    return { deleted: true };
  }

  /**
   * Danh sách cộng đồng mà user đang là member (kèm role + memberCount)
   */
  async getMyCommunities(userId: number): Promise<MyCommunityResponseDto[]> {
    const memberships = await this.memberRepository.find({
      where: {
        user: { id: userId },
        role: Not(ECommunityRole.PENDING), // không lấy các cộng đồng mà user bị BAN
      },
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
      })
    );
  }

  // ====== PHẦN QUẢN LÝ MEMBERS ======

  /**
   * Lấy danh sách member theo community có thể lọc theo role
   */
  async getMembers(communityId: number, role?: ECommunityRole): Promise<CommunityMember[]> {
    return this.memberRepository.find({
      where: { community: { id: communityId }, role: role ? role : Not(ECommunityRole.PENDING) },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
    });
  }

  /**
   * Đổi role của một member (MEMBER / MODERATOR / ADMIN)
   */
  async updateMemberRole(communityId: number, memberId: number, dto: UpdateMemberRoleDto) {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, community: { id: communityId } },
      relations: ['community', 'user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found in this community');
    }

    member.role = dto.role;
    return this.memberRepository.save(member);
  }

  /**
   * Kick member (xoá record)
   */
  async removeMember(communityId: number, memberId: number) {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, community: { id: communityId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this community');
    }

    await this.memberRepository.remove(member);

    return { deleted: true };
  }
}
