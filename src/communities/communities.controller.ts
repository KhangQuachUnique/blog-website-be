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
} from "@nestjs/common";
import type { Request } from "express";

import { CommunitiesService } from "./communities.service";
import { CreateCommunityDto } from "./dto/create-community.dto";
import { UpdateCommunityDto } from "./dto/update-community.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { MyCommunityResponseDto } from "./dto/response/my-community-response.dto";
import { ECommunityRole } from "./enums/community-role.enum";

import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "src/auth/guards/optional-jwt-auth.guard";

@Controller("communities")
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get("my")
  @UseGuards(JwtAuthGuard)
  getMyCommunities(@Req() req: Request): Promise<MyCommunityResponseDto[]> {
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.getMyCommunities(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCommunityDto: CreateCommunityDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.create(createCommunityDto, userId);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(":id/settings")
  @UseGuards(OptionalJwtAuthGuard)
  getSettings(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.getSettings(id, userId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
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
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.update(id, updateCommunityDto, userId);
  }

  @Post(":id/join")
  @UseGuards(JwtAuthGuard)
  joinCommunity(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.joinCommunity(id, userId);
  }

  @Delete(":id/leave")
  @UseGuards(JwtAuthGuard)
  leaveCommunity(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.leaveCommunity(id, userId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.removeCommunity(id, userId);
  }

  @Get(":id/members")
  @UseGuards(OptionalJwtAuthGuard)
  getMembers(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: Request,
    @Query("role") role?: ECommunityRole
  ) {
    const userId = (req as any).user?.id ?? (req as any).user?.userId;
    return this.communitiesService.getMembers(id, role, userId);
  }

  @Patch(":id/members/:memberId/role")
  @UseGuards(JwtAuthGuard)
  updateMemberRole(
    @Param("id", ParseIntPipe) id: number,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberRoleDto
  ) {
    return this.communitiesService.updateMemberRole(id, memberId, dto);
  }

  @Delete(":id/members/:memberId")
  @UseGuards(JwtAuthGuard)
  removeMember(
    @Param("id", ParseIntPipe) id: number,
    @Param("memberId", ParseIntPipe) memberId: number
  ) {
    return this.communitiesService.removeMember(id, memberId);
  }
}
