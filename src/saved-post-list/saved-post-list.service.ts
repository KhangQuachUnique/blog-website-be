import { Injectable } from '@nestjs/common';
import { CreateSavedPostListDto } from './dto/create-saved-post-list.dto';
import { UpdateSavedPostListDto } from './dto/update-saved-post-list.dto';

@Injectable()
export class SavedPostListService {
  create(createSavedPostListDto: CreateSavedPostListDto) {
    return 'This action adds a new savedPostList';
  }

  findAll() {
    return `This action returns all savedPostList`;
  }

  findOne(id: number) {
    return `This action returns a #${id} savedPostList`;
  }

  update(id: number, updateSavedPostListDto: UpdateSavedPostListDto) {
    return `This action updates a #${id} savedPostList`;
  }

  remove(id: number) {
    return `This action removes a #${id} savedPostList`;
  }
}
