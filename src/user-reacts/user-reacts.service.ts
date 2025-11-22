import { Injectable } from '@nestjs/common';
import { CreateUserReactDto } from './dto/create-user-react.dto';
import { UpdateUserReactDto } from './dto/update-user-react.dto';

@Injectable()
export class UserReactsService {
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
