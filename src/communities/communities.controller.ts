import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CommunityResponseDto } from './dto/response/my-community-response.dto';
import { ECommunityRole } from './enums/community-role.enum';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { JwtUser } from 'src/auth/dto/validate-payload.dto';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get("my")
  @UseGuards(JwtAuthGuard)
  getMyCommunities(@Req() req: Request): Promise<CommunityResponseDto[]> {
    const user = req.user as JwtUser;
    return this.communitiesService.getMyCommunities(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCommunityDto: CreateCommunityDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.communitiesService.create(createCommunityDto, user.id);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  /**
   * ✅ Settings: cho phép chưa login
   * - Nếu chưa login => role "NONE"
   * - Nếu login nhưng chưa join => "NONE"
   */
  @Get(':id/settings')
  @UseGuards(OptionalJwtAuthGuard)
  getSettings(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.communitiesService.getSettings(id, user?.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.findOne(id);
  }

  // ✅ Update: cần login + CHECK quyền (ADMIN/MOD) ở service
  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @Req() req: Request
  ) {
    const userId = (req.user as JwtUser).id;
    return this.communitiesService.update(id, updateCommunityDto, userId);
  }

  @Post(":id/join")
  @UseGuards(JwtAuthGuard)
  joinCommunity(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.communitiesService.joinCommunity(id, user.id);
  }

  // ✅ Leave: cần login
  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  leaveCommunity(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.communitiesService.leaveCommunity(id, user.id);
  }

  // ✅ Delete: cần login (service đã check ADMIN)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.communitiesService.removeCommunity(id, user.id);
  }

  // ====== MEMBERS ======
  // (tuỳ bạn) nếu muốn private community phải login + đã join mới xem members
  @Get(':id/members')
  @UseGuards(OptionalJwtAuthGuard)
  getMembers(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Query('role') role?: ECommunityRole,
  ) {
    const user = req.user as JwtUser;
    return this.communitiesService.getMembers(id, role, user?.id);
  }

  @Patch(':id/members/:memberId/role')
  @UseGuards(JwtAuthGuard)
  updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.communitiesService.updateMemberRole(id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Req() req: Request,
    @Query('ban') ban?: string,
  ) {
    const user = req.user as JwtUser;

    const banFlag = ban === '1' || ban === 'true';
    return this.communitiesService.removeMember(id, memberId, user.id, banFlag);
  }
}
