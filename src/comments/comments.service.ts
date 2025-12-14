import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { ECommentType } from './enums/comment-type.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  // ========== BASIC CRUD ==========

  async create(createCommentDto: CreateCommentDto) {
    const { content, type, commenterId, postId, blockId } = createCommentDto;

    // Validate: POST comment cần postId, BLOCK comment cần blockId
    if (type === ECommentType.POST && !postId) {
      throw new BadRequestException('postId is required for POST type comment');
    }
    if (type === ECommentType.BLOCK && !blockId) {
      throw new BadRequestException('blockId is required for BLOCK type comment');
    }

    const comment = this.commentRepository.create({
      content,
      type,
      commenterId,
      postId,
      blockId,
    });

    const saved = await this.commentRepository.save(comment);
    return this.findOne(saved.id);
  }

  async findAll() {
    return this.commentRepository.find({
      where: { parentComment: IsNull() },
      relations: ['commenter', 'childComments', 'childComments.commenter'],
      order: { createAt: 'DESC' },
      take: 50,
    });
  }

  async findOne(id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['commenter', 'replyToUser', 'post', 'block', 'childComments', 'childComments.commenter', 'childComments.replyToUser'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }
    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    await this.commentRepository.update(id, { content: updateCommentDto.content });
    return this.findOne(id);
  }

  async remove(id: number) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    await this.commentRepository.delete(id);
    return { message: `Comment #${id} deleted` };
  }

  // ========== POST/BLOCK COMMENTS ==========

  async findByPost(postId: number) {
    return this.commentRepository.find({
      where: { postId, type: ECommentType.POST, parentComment: IsNull() },
      relations: ['commenter', 'childComments', 'childComments.commenter', 'childComments.replyToUser'],
      order: { createAt: 'DESC' },
    });
  }

  async findByBlock(blockId: number) {
    return this.commentRepository.find({
      where: { blockId, type: ECommentType.BLOCK, parentComment: IsNull() },
      relations: ['commenter', 'childComments', 'childComments.commenter', 'childComments.replyToUser'],
      order: { createAt: 'DESC' },
    });
  }

  async countByPost(postId: number) {
    const total = await this.commentRepository.count({ where: { postId } });
    const parentComments = await this.commentRepository.count({ 
      where: { postId, parentComment: IsNull() } 
    });
    return { postId, total, parentComments, replies: total - parentComments };
  }

}
