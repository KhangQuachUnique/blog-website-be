import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserReactsService } from './user-reacts.service';
import { CreateUserReactDto } from './dto/create-user-react.dto';
import { UpdateUserReactDto } from './dto/update-user-react.dto';

@ApiTags('User Reacts')
@Controller('user-reacts')
export class UserReactsController {
  constructor(private readonly userReactsService: UserReactsService) {}

  @Post()
  @ApiOperation({ summary: 'React với emoji cho post/comment' })
  @ApiResponse({ status: 201, description: 'React thành công' })
  create(@Body() createUserReactDto: CreateUserReactDto) {
    return this.userReactsService.create(createUserReactDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả reactions' })
  findAll() {
    return this.userReactsService.findAll();
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Lấy reactions của post' })
  getPostReactions(@Param('postId') postId: string) {
    return this.userReactsService.getPostReactions(+postId);
  }

  @Get('posts/:postId/user/:userId')
  @ApiOperation({ summary: 'Lấy react của user cho post cụ thể' })
  getUserReact(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    return this.userReactsService.getUserReactForPost(+userId, +postId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userReactsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserReactDto: UpdateUserReactDto) {
    return this.userReactsService.update(+id, updateUserReactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa react' })
  remove(@Param('id') id: string) {
    return this.userReactsService.remove(+id);
  }
}
