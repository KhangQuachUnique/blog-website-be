import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { ECommunityMemberStatus } from './enums/community-member-status.enum';
import { CommunitySettingResponseDto } from './dto/response/community-response.dto';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  // ====== COMMUNITY CRUD ======

  @Post()
  create(@Body() createCommunityDto: CreateCommunityDto) {
    return this.communitiesService.create(createCommunityDto);
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(id, updateCommunityDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.remove(id);
  }

  // ====== PHẦN MEMBERS ======

  // GET /communities/:id/members?status=ACTIVE|PENDING|BANNED
  @Get(':id/members')
  getMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: ECommunityMemberStatus,
  ) {
    return this.communitiesService.getMembers(id, status);
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

  // PATCH /communities/:id/members/:memberId/status
  @Patch(':id/members/:memberId/status')
  updateMemberStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    return this.communitiesService.updateMemberStatus(id, memberId, dto);
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
