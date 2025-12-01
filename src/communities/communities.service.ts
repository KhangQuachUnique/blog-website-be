import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { ECommunityMemberStatus } from './enums/community-member-status.enum';
import { ECommunityRole } from './enums/community-role.enum';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,

    @InjectRepository(CommunityMember)
    private memberRepository: Repository<CommunityMember>,
  ) {}

  // ====== Communities cũ vẫn giữ nguyên (tạm giản lược) ======
  create(createCommunityDto: CreateCommunityDto) {
    const community = this.communityRepository.create(createCommunityDto);
    return this.communityRepository.save(community);
  }

  findAll() {
    return this.communityRepository.find();
  }

  findOne(id: number) {
    return this.communityRepository.findOne({ where: { id } });
  }

  async update(id: number, updateCommunityDto: UpdateCommunityDto) {
    await this.communityRepository.update(id, updateCommunityDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.communityRepository.delete(id);
    return { deleted: true };
  }

  // ====== PHẦN QUẢN LÝ MEMBERS ======

  /**
   * Lấy danh sách member theo community, có thể lọc theo status
   */
  async getMembers(
    communityId: number,
    status?: ECommunityMemberStatus,
  ): Promise<CommunityMember[]> {
    const qb = this.memberRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'user')
      .where('m.communityId = :communityId', { communityId });

    if (status) {
      qb.andWhere('m.status = :status', { status });
    }

    return qb.orderBy('m.joinedAt', 'DESC').getMany();
  }

  /**
   * Đổi role của một member (MEMBER / MODERATOR / ADMIN)
   */
  async updateMemberRole(
    communityId: number,
    memberId: number,
    dto: UpdateMemberRoleDto,
  ) {
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
   * Đổi status: ví dụ PENDING -> ACTIVE hoặc ACTIVE -> BANNED
   */
  async updateMemberStatus(
    communityId: number,
    memberId: number,
    dto: UpdateMemberStatusDto,
  ) {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, community: { id: communityId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this community');
    }

    member.status = dto.status;

    // nếu vừa approve thì set joinedAt = now (optional)
    if (dto.status === ECommunityMemberStatus.ACTIVE && !member.joinedAt) {
      member.joinedAt = new Date();
    }

    return this.memberRepository.save(member);
  }

  /**
   * Kick member (ở đây mình xoá record luôn; nếu muốn chỉ ban thì dùng status = BANNED)
   */
  async removeMember(communityId: number, memberId: number) {
    const result = await this.memberRepository.delete({
      id: memberId,
      community: { id: communityId },
    });

    if (!result.affected) {
      throw new NotFoundException('Member not found in this community');
    }

    return { deleted: true };
  }
}
