import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { PostComment } from './entities/post-comment.entity';
import { BlockComment } from './entities/block-comment.entity';
import { ChildComment } from './entities/child-comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(PostComment)
    private postCommentRepository: Repository<PostComment>,

    @InjectRepository(BlockComment)
    private blockCommentRepository: Repository<BlockComment>,

    @InjectRepository(ChildComment)
    private childCommentRepository: Repository<ChildComment>,
  ) {}

  create(createCommentDto: CreateCommentDto) {
    return 'This action adds a new comment';
  }

  async findAll() {
    // Lấy tất cả comments cơ bản từ database
    return await this.commentRepository
      .createQueryBuilder('comment')
      .select([
        'comment.id',
        'comment.content', 
        'comment.createAt',  // Sử dụng tên field đúng từ entity
        'comment.type'
      ])
      .orderBy('comment.createAt', 'DESC')
      .limit(20) // Giới hạn 20 comments đầu tiên
      .getMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} comment`;
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  remove(id: number) {
    return `This action removes a #${id} comment`;
  }
}
