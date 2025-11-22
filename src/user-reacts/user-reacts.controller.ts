import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserReactsService } from './user-reacts.service';
import { CreateUserReactDto } from './dto/create-user-react.dto';
import { UpdateUserReactDto } from './dto/update-user-react.dto';

@Controller('user-reacts')
export class UserReactsController {
  constructor(private readonly userReactsService: UserReactsService) {}

  @Post()
  create(@Body() createUserReactDto: CreateUserReactDto) {
    return this.userReactsService.create(createUserReactDto);
  }

  @Get()
  findAll() {
    return this.userReactsService.findAll();
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
  remove(@Param('id') id: string) {
    return this.userReactsService.remove(+id);
  }
}
