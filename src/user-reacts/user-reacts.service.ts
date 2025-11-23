import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserReact } from './entities/user-react.entity';
import { CreateUserReactDto } from './dto/create-user-react.dto';
import { UpdateUserReactDto } from './dto/update-user-react.dto';
import { PostUserReact } from './entities/post-user-react.entity';
import { CommentUserReact } from './entities/comment-user-react.entity';

@Injectable()
export class UserReactsService {
  constructor(
    @InjectRepository(UserReact)
    private userReactRepository: Repository<UserReact>,

    @InjectRepository(PostUserReact)
    private postUserReactRepository: Repository<PostUserReact>,

    @InjectRepository(CommentUserReact)
    private commentUserReactRepository: Repository<CommentUserReact>,
  ) {}

  create(createUserReactDto: CreateUserReactDto) {
    return 'This action adds a new userReact';
  }

  findAll() {
    return `This action returns all userReacts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userReact`;
  }

  update(id: number, updateUserReactDto: UpdateUserReactDto) {
    return `This action updates a #${id} userReact`;
  }

  remove(id: number) {
    return `This action removes a #${id} userReact`;
  }
}
