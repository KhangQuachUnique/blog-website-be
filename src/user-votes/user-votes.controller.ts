import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserVotesService } from './user-votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteActionResponseDto, VoteStatusResponseDto } from './dto/response/vote-response.dto';

@ApiTags('Votes')
@Controller('votes')
export class UserVotesController {
  constructor(private readonly votesService: UserVotesService) {}

  @Post()
  @ApiOperation({ summary: 'Vote hoặc toggle vote cho bài viết' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vote thành công',
    type: VoteActionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User hoặc Post không tồn tại' })
  async vote(@Body() dto: CreateVoteDto): Promise<VoteActionResponseDto> {
    return this.votesService.vote(dto.userId, dto.postId, dto.voteType);
  }

  @Get('status')
  @ApiOperation({ summary: 'Lấy trạng thái vote của user cho post' })
  @ApiQuery({ name: 'userId', type: Number })
  @ApiQuery({ name: 'postId', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Trả về voteType hoặc null',
    type: VoteStatusResponseDto,
  })
  async getStatus(
    @Query('userId') userId: number, 
    @Query('postId') postId: number,
  ): Promise<VoteStatusResponseDto> {
    return this.votesService.getVoteStatus(+userId, +postId);
  }
}
