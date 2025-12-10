import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CommunitySettingResponseDto } from './dto/response/community-response.dto';
import { MyCommunityResponseDto } from './dto/response/my-community-response.dto';
import { ECommunityRole } from './enums/community-role.enum';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  // ====== COMMUNITY CRUD ======

  // GET /communities/my - các cộng đồng của user hiện tại
  @Get('my')
  getMyCommunities(): Promise<MyCommunityResponseDto[]> {
    // Nếu có auth:
    // return this.communitiesService.getMyCommunities(user.id);

    const fakeUserId = 53; // tạm hard-code để test
    return this.communitiesService.getMyCommunities(fakeUserId);
  }

  @Post()
  create(@Body() createCommunityDto: CreateCommunityDto) {
    const fakeUserId = 53; // tạm hard-code
    return this.communitiesService.create(createCommunityDto, fakeUserId);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id/settings')
  getSettings(@Param('id', ParseIntPipe) id: number): Promise<CommunitySettingResponseDto> {
    return this.communitiesService.getSettings(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCommunityDto: UpdateCommunityDto) {
    return this.communitiesService.update(id, updateCommunityDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.remove(id);
  }

  // ====== PHẦN MEMBERS ======

  // GET /communities/:id/members
  @Get(':id/members')
  getMembers(@Param('id', ParseIntPipe) id: number, role?: ECommunityRole) {
    return this.communitiesService.getMembers(id, role);
  }

  // PATCH /communities/:id/members/:memberId/role
  @Patch(':id/members/:memberId/role')
  updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.communitiesService.updateMemberRole(id, memberId, dto);
  }

  // DELETE /communities/:id/members/:memberId
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.communitiesService.removeMember(id, memberId);
  }
}
