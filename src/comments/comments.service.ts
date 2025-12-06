import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateChildCommentDto } from './dto/create-child-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { ChildComment } from './entities/child-comment.entity';
import { ECommentType } from './enums/comment-type.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(ChildComment)
    private childCommentRepository: Repository<ChildComment>,
  ) {}

  // ========== COMMENT METHODS ==========

  async create(createCommentDto: CreateCommentDto) {
    // Validate: POST comment phải có postId, BLOCK comment phải có blockId
    if (createCommentDto.type === ECommentType.POST && !createCommentDto.postId) {
      throw new BadRequestException('postId is required for POST type comment');
    }
    if (createCommentDto.type === ECommentType.BLOCK && !createCommentDto.blockId) {
      throw new BadRequestException('blockId is required for BLOCK type comment');
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      type: createCommentDto.type,
      commenterId: createCommentDto.commenterId,
      postId: createCommentDto.postId,
      blockId: createCommentDto.blockId,
    });

    const savedComment = await this.commentRepository.save(comment);
    
    // Return với thông tin commenter
    return this.findOne(savedComment.id);
  }

  async findAll() {
    return await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.commenter', 'commenter')
      .select([
        'comment.id',
        'comment.content',
        'comment.createAt',
        'comment.type',
        'comment.postId',
        'comment.blockId',
        'commenter.id',
        'commenter.username',
        'commenter.avatarUrl',
      ])
      .orderBy('comment.createAt', 'DESC')
      .limit(50)
      .getMany();
  }

  async findOne(id: number) {
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.commenter', 'commenter')
      .leftJoin('comment.post', 'post')
      .leftJoin('comment.block', 'block')
      .leftJoin('comment.childComments', 'childComment')
      .leftJoin('childComment.commentUser', 'childCommenter')
      .leftJoin('childComment.replyToUser', 'replyToUser')
      .select([
        'comment.id',
        'comment.content',
        'comment.createAt',
        'comment.type',
        'commenter.id',
        'commenter.username',
        'commenter.avatarUrl',
        'post.id',
        'post.title',
        'block.id',
        'block.type',
        'childComment.id',
        'childComment.content',
        'childComment.createAt',
        'childCommenter.id',
        'childCommenter.username',
        'childCommenter.avatarUrl',
        'replyToUser.id',
        'replyToUser.username',
      ])
      .where('comment.id = :id', { id })
      .orderBy('childComment.createAt', 'ASC')
      .getOne();

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

    await this.commentRepository.update(id, {
      content: updateCommentDto.content,
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    
    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    await this.commentRepository.delete(id);
    return { message: `Comment #${id} deleted successfully` };
  }

  // Lấy tất cả comments của một bài viết (type = POST)
  async findByPost(postId: number) {
    return await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.commenter', 'commenter')
      .leftJoin('comment.childComments', 'childComment')
      .leftJoin('childComment.commentUser', 'childCommenter')
      .leftJoin('childComment.replyToUser', 'replyToUser')
      .select([
        'comment.id',
        'comment.content',
        'comment.createAt',
        'comment.type',
        'commenter.id',
        'commenter.username',
        'commenter.avatarUrl',
        'childComment.id',
        'childComment.content',
        'childComment.createAt',
        'childCommenter.id',
        'childCommenter.username',
        'childCommenter.avatarUrl',
        'replyToUser.id',
        'replyToUser.username',
      ])
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.type = :type', { type: ECommentType.POST })
      .orderBy('comment.createAt', 'ASC')
      .addOrderBy('childComment.createAt', 'ASC')
      .getMany();
  }

  // Lấy tất cả comments của một block cụ thể (type = BLOCK)
  async findByBlock(blockId: number) {
    return await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.commenter', 'commenter')
      .leftJoin('comment.childComments', 'childComment')
      .leftJoin('childComment.commentUser', 'childCommenter')
      .leftJoin('childComment.replyToUser', 'replyToUser')
      .select([
        'comment.id',
        'comment.content',
        'comment.createAt',
        'comment.type',
        'commenter.id',
        'commenter.username',
        'commenter.avatarUrl',
        'childComment.id',
        'childComment.content',
        'childComment.createAt',
        'childCommenter.id',
        'childCommenter.username',
        'childCommenter.avatarUrl',
        'replyToUser.id',
        'replyToUser.username',
      ])
      .where('comment.blockId = :blockId', { blockId })
      .andWhere('comment.type = :type', { type: ECommentType.BLOCK })
      .orderBy('comment.createAt', 'ASC')
      .addOrderBy('childComment.createAt', 'ASC')
      .getMany();
  }

  // Đếm số comments của một bài viết (bao gồm cả child comments)
  async countByPost(postId: number) {
    const postComments = await this.commentRepository.count({
      where: { postId, type: ECommentType.POST },
    });

    const childComments = await this.childCommentRepository
      .createQueryBuilder('child')
      .innerJoin('child.parentComment', 'parent')
      .where('parent.postId = :postId', { postId })
      .getCount();

    return {
      postId,
      totalComments: postComments,
      totalReplies: childComments,
      total: postComments + childComments,
    };
  }

  // ========== CHILD COMMENT (REPLY) METHODS ==========

  async createChildComment(createChildCommentDto: CreateChildCommentDto) {
    // Kiểm tra parent comment có tồn tại không
    const parentComment = await this.commentRepository.findOne({
      where: { id: createChildCommentDto.parentCommentId },
    });

    if (!parentComment) {
      throw new NotFoundException(`Parent comment #${createChildCommentDto.parentCommentId} not found`);
    }

    const childComment = this.childCommentRepository.create({
      content: createChildCommentDto.content,
      parentCommentId: createChildCommentDto.parentCommentId,
      commentUserId: createChildCommentDto.commentUserId,
      replyToUserId: createChildCommentDto.replyToUserId,
    });

    const savedChildComment = await this.childCommentRepository.save(childComment);

    // Return với thông tin user
    return this.findOneChildComment(savedChildComment.id);
  }

  async findOneChildComment(id: number) {
    const childComment = await this.childCommentRepository
      .createQueryBuilder('child')
      .leftJoin('child.commentUser', 'commenter')
      .leftJoin('child.replyToUser', 'replyTo')
      .leftJoin('child.parentComment', 'parent')
      .select([
        'child.id',
        'child.content',
        'child.createAt',
        'commenter.id',
        'commenter.username',
        'commenter.avatarUrl',
        'replyTo.id',
        'replyTo.username',
        'parent.id',
      ])
      .where('child.id = :id', { id })
      .getOne();

    if (!childComment) {
      throw new NotFoundException(`Child comment #${id} not found`);
    }

    return childComment;
  }

  async updateChildComment(id: number, content: string) {
    const childComment = await this.childCommentRepository.findOne({ where: { id } });

    if (!childComment) {
      throw new NotFoundException(`Child comment #${id} not found`);
    }

    await this.childCommentRepository.update(id, { content });
    return this.findOneChildComment(id);
  }

  async removeChildComment(id: number) {
    const childComment = await this.childCommentRepository.findOne({ where: { id } });

    if (!childComment) {
      throw new NotFoundException(`Child comment #${id} not found`);
    }

    await this.childCommentRepository.delete(id);
    return { message: `Child comment #${id} deleted successfully` };
  }
}
