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
} from "@nestjs/common";
import { CommunitiesService } from "./communities.service";
import { CreateCommunityDto } from "./dto/create-community.dto";
import { UpdateCommunityDto } from "./dto/update-community.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { MyCommunityResponseDto } from "./dto/response/my-community-response.dto";
import { ECommunityRole } from "./enums/community-role.enum";

@Controller("communities")
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get("my")
  getMyCommunities(): Promise<MyCommunityResponseDto[]> {
    const fakeUserId = 53;
    return this.communitiesService.getMyCommunities(fakeUserId);
  }

  @Post()
  create(@Body() createCommunityDto: CreateCommunityDto) {
    const fakeUserId = 53;
    return this.communitiesService.create(createCommunityDto, fakeUserId);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(":id/settings")
  getSettings(@Param("id", ParseIntPipe) id: number) {
    const fakeUserId = 53;
    return this.communitiesService.getSettings(id, fakeUserId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.communitiesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCommunityDto: UpdateCommunityDto
  ) {
    return this.communitiesService.update(id, updateCommunityDto);
  }

  // ✅ Leave community
  @Delete(":id/leave")
  leaveCommunity(@Param("id", ParseIntPipe) id: number) {
    const fakeUserId = 53;
    return this.communitiesService.leaveCommunity(id, fakeUserId);
  }

  // ✅ Delete community: chỉ ADMIN
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    const fakeUserId = 53;
    return this.communitiesService.removeCommunity(id, fakeUserId);
  }

  // ====== MEMBERS ======
  @Get(":id/members")
  getMembers(
    @Param("id", ParseIntPipe) id: number,
    @Query("role") role?: ECommunityRole
  ) {
    return this.communitiesService.getMembers(id, role);
  }

  @Patch(":id/members/:memberId/role")
  updateMemberRole(
    @Param("id", ParseIntPipe) id: number,
    @Param("memberId", ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberRoleDto
  ) {
    return this.communitiesService.updateMemberRole(id, memberId, dto);
  }

  @Delete(":id/members/:memberId")
  removeMember(
    @Param("id", ParseIntPipe) id: number,
    @Param("memberId", ParseIntPipe) memberId: number
  ) {
    return this.communitiesService.removeMember(id, memberId);
  }
}
