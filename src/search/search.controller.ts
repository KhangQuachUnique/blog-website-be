import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto, SearchType } from './dto/search.dto';
import { SearchResponseDto } from './dto/response/search-response.dto';
import { JwtUser } from '@modules/auth/dto/validate-payload.dto';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import { type Request } from 'express';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async search(@Query() searchDto: SearchDto, @Req() req: Request): Promise<SearchResponseDto> {
    const viewerId = (req.user as JwtUser)?.id;
    // Nếu có type, tìm kiếm theo type cụ thể
    if (searchDto.type) {
      switch (searchDto.type) {
        case SearchType.POST:
          return this.searchService.searchByPost(searchDto, viewerId);
        case SearchType.USER:
          return this.searchService.searchByUser(searchDto);
        case SearchType.COMMUNITY:
          return this.searchService.searchByCommunity(searchDto);
        case SearchType.HASHTAG:
          return this.searchService.searchByHashtag(searchDto, viewerId);
      }
    }
    // Không có type, tìm kiếm tất cả
    return this.searchService.search(searchDto);
  }

  // Các endpoint riêng vẫn giữ để backward compatible
  @Get('post')
  @UseGuards(OptionalJwtAuthGuard)
  async searchByPost(
    @Query() searchDto: SearchDto,
    @Req() req: Request,
  ): Promise<SearchResponseDto> {
    const viewerId = (req.user as JwtUser).id;

    console.log('Viewer ID in searchByHashtag:', viewerId);
    return this.searchService.searchByPost(searchDto, viewerId);
  }

  @Get('user')
  async searchByUser(@Query() searchDto: SearchDto): Promise<SearchResponseDto> {
    return this.searchService.searchByUser(searchDto);
  }

  @Get('community')
  async searchByCommunity(@Query() searchDto: SearchDto): Promise<SearchResponseDto> {
    return this.searchService.searchByCommunity(searchDto);
  }

  @Get('hashtag')
  @UseGuards(OptionalJwtAuthGuard)
  async searchByHashtag(
    @Query() searchDto: SearchDto,
    @Req() req: Request,
  ): Promise<SearchResponseDto> {
    const viewerId = (req.user as JwtUser).id;
    console.log('Viewer ID in searchByHashtag:', viewerId);
    return this.searchService.searchByHashtag(searchDto, viewerId);
  }
}
