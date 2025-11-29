import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ViewedHistoryService } from './viewed-history.service';
import { CreateViewedHistoryDto } from './dto/create-viewed-history.dto';
import { UpdateViewedHistoryDto } from './dto/update-viewed-history.dto';

@Controller('viewed-history')
export class ViewedHistoryController {
  constructor(private readonly viewedHistoryService: ViewedHistoryService) {}

  @Post()
  create(@Body() createViewedHistoryDto: CreateViewedHistoryDto) {
    return this.viewedHistoryService.create(createViewedHistoryDto);
  }

  @Get()
  findAll() {
    return this.viewedHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.viewedHistoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateViewedHistoryDto: UpdateViewedHistoryDto) {
    return this.viewedHistoryService.update(+id, updateViewedHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.viewedHistoryService.remove(+id);
  }
}
