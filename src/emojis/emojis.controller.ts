import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmojisService } from './emojis.service';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';

@Controller('emojis')
export class EmojisController {
  constructor(private readonly emojisService: EmojisService) {}

  @Post()
  create(@Body() createEmojiDto: CreateEmojiDto) {
    return this.emojisService.create(createEmojiDto);
  }

  @Get()
  findAll() {
    return this.emojisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emojisService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmojiDto: UpdateEmojiDto) {
    return this.emojisService.update(+id, updateEmojiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emojisService.remove(+id);
  }
}
