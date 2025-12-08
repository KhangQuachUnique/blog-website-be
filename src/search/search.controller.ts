import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { SearchResponseDto } from './dto/response/search-response.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() searchDto: SearchDto) {
    return this.searchService.search(searchDto);
  }

  /**
   * Search blog posts by title
   * @param searchDto
   * @returns
   */
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
