import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { ECommunityMemberStatus } from './enums/community-member-status.enum';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  create(@Body() createCommunityDto: CreateCommunityDto) {
    return this.communitiesService.create(createCommunityDto);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communitiesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(+id, updateCommunityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.communitiesService.remove(+id);
  }

  // ====== PHẦN MEMBERS ======

  // GET /communities/:id/members?status=ACTIVE|PENDING|BANNED
  @Get(':id/members')
  getMembers(
    @Param('id') id: string,
    @Query('status') status?: ECommunityMemberStatus,
  ) {
    return this.communitiesService.getMembers(+id, status);
  }

  // PATCH /communities/:id/members/:memberId/role
  @Patch(':id/members/:memberId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.communitiesService.updateMemberRole(+id, +memberId, dto);
  }

  // PATCH /communities/:id/members/:memberId/status
  @Patch(':id/members/:memberId/status')
  updateMemberStatus(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    return this.communitiesService.updateMemberStatus(+id, +memberId, dto);
  }

  // DELETE /communities/:id/members/:memberId
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.communitiesService.removeMember(+id, +memberId);
  }
}
