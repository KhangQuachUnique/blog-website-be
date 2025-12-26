import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto, SearchType } from './dto/search.dto';
import { SearchResponseDto } from './dto/response/search-response.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() searchDto: SearchDto): Promise<SearchResponseDto> {
    // Nếu có type, tìm kiếm theo type cụ thể
    if (!searchDto.type) {
      throw new Error('Search type is required');
    }

    switch (searchDto.type) {
      case SearchType.POST:
        return this.searchService.searchByPost(searchDto);
      case SearchType.USER:
        return this.searchService.searchByUser(searchDto);
      case SearchType.COMMUNITY:
        return this.searchService.searchByCommunity(searchDto);
      case SearchType.HASHTAG:
        return this.searchService.searchByHashtag(searchDto);
      default:
        throw new Error('Invalid search type');
    }
  }

  // Các endpoint riêng vẫn giữ để backward compatible
  @Get('post')
  async searchByPost(@Query() searchDto: SearchDto): Promise<SearchResponseDto> {
    return this.searchService.searchByPost(searchDto);
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
  async searchByHashtag(@Query() searchDto: SearchDto): Promise<SearchResponseDto> {
    return this.searchService.searchByHashtag(searchDto);
  }
}
