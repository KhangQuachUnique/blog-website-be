import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  // @Query() giúp NestJS tự động map ?q=abc&type=post vào object SearchDto
  // và tự động validate nhờ class-validator
  async search(@Query() searchDto: SearchDto) {
    return this.searchService.search(searchDto);
  }
}