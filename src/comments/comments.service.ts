import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { ChildComment } from './entities/child-comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(ChildComment)
    private childCommentRepository: Repository<ChildComment>,
  ) {}

  async create(createCommentDto: CreateCommentDto) {
    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      type: createCommentDto.type,
      commenterId: createCommentDto.commenterId,
      postId: createCommentDto.postId,
      blockId: createCommentDto.blockId,
    });

    const savedComment = await this.commentRepository.save(comment);
    return savedComment;
  }

  async findAll() {
    // Lấy tất cả comments cơ bản trước
    return await this.commentRepository
      .createQueryBuilder('comment')
      .select([
        'comment.id',
        'comment.content', 
        'comment.createAt',
        'comment.type',
        'comment.commenterId',
        'comment.postId',
        'comment.blockId'
      ])
      .orderBy('comment.createAt', 'DESC')
      .limit(20)
      .getMany();
  }

  async findOne(id: number) {
    // Lấy chi tiết một comment cụ thể
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.commenter', 'commenter')
      .leftJoinAndSelect('comment.post', 'post')
      .leftJoinAndSelect('comment.childComments', 'childComment')
      .leftJoinAndSelect('childComment.commenter', 'childCommenter')
      .select([
        'comment.id',
        'comment.content',
        'comment.createAt',
        'comment.type',
        'commenter.id',
        'commenter.firstName',
        'commenter.lastName',
        'commenter.username',
        'post.id',
        'post.title',
        'post.type',
        'childComment.id',
        'childComment.content',
        'childComment.createAt',
        'childCommenter.id',
        'childCommenter.firstName',
        'childCommenter.lastName',
        'childCommenter.username'
      ])
      .where('comment.id = :id', { id })
      .getOne();

    if (!comment) {
      return `Comment #${id} not found`;
    }

    return comment;
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  remove(id: number) {
    return `This action removes a #${id} comment`;
  }

  async findByPost(postId: number) {
    // Lấy tất cả comments của một post cụ thể
    return await this.commentRepository
      .createQueryBuilder('comment')
      .select([
        'comment.id',
        'comment.content',
        'comment.createAt',
        'comment.type',
        'comment.commenterId',
        'comment.postId',
        'comment.blockId'
      ])
      .where('comment.postId = :postId', { postId })
      .orderBy('comment.createAt', 'ASC')
      .getMany();
  }
}
