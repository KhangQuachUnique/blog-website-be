import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SavedPostListService } from './saved-post-list.service';
import { CreateSavedPostListDto } from './dto/create-saved-post-list.dto';
import { UpdateSavedPostListDto } from './dto/update-saved-post-list.dto';

@Controller('saved-post-list')
export class SavedPostListController {
  constructor(private readonly savedPostListService: SavedPostListService) {}

  @Post()
  create(@Body() createSavedPostListDto: CreateSavedPostListDto) {
    return this.savedPostListService.create(createSavedPostListDto);
  }

  @Get()
  findAll() {
    return this.savedPostListService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.savedPostListService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSavedPostListDto: UpdateSavedPostListDto) {
    return this.savedPostListService.update(+id, updateSavedPostListDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.savedPostListService.remove(+id);
  }
}
