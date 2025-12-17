import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { EmojisService } from './emojis.service';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';
import { Emoji } from './entities/emoji.entity';
import { EmojiCommunityResponseDto } from './dto/response/emoji-response.dto';

@Controller('emojis')
export class EmojisController {
  constructor(private readonly emojisService: EmojisService) {}

  @Post()
  async create(@Body() createEmojiDto: CreateEmojiDto): Promise<Emoji> {
    return this.emojisService.create(createEmojiDto);
  }

  @Get()
  async findAll(): Promise<Emoji[]> {
    return this.emojisService.findAll();
  }

  @Get('user/:userId/communities')
  async findByUserCommunities(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<EmojiCommunityResponseDto[]> {
    return await this.emojisService.findByUserCommunities(userId);
  }

  @Get('community/:communityId')
  async findByCommunity(@Param('communityId', ParseIntPipe) communityId: number): Promise<Emoji[]> {
    return this.emojisService.findByCommunity(communityId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Emoji> {
    return this.emojisService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmojiDto: UpdateEmojiDto,
  ): Promise<Emoji> {
    return this.emojisService.update(id, updateEmojiDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.emojisService.remove(id);
  }
}
