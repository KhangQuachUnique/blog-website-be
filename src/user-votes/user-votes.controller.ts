import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserVotesService } from './user-votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';

@ApiTags('Votes')
@Controller('votes')
export class UserVotesController {
  constructor(private readonly votesService: UserVotesService) {}

  @Post()
  @ApiOperation({ summary: 'Vote hoặc toggle vote cho bài viết' })
  @ApiResponse({ status: 200, description: 'Vote thành công' })
  @ApiResponse({ status: 404, description: 'User hoặc Post không tồn tại' })
  vote(@Body() dto: CreateVoteDto) {
    return this.votesService.vote(dto.userId, dto.postId, dto.voteType);
  }

  @Get('status')
  @ApiOperation({ summary: 'Lấy trạng thái vote của user cho post' })
  @ApiQuery({ name: 'userId', type: Number })
  @ApiQuery({ name: 'postId', type: Number })
  @ApiResponse({ status: 200, description: 'Trả về voteType hoặc null' })
  getStatus(@Query('userId') userId: number, @Query('postId') postId: number) {
    return this.votesService.getVoteStatus(+userId, +postId);
  }
}
