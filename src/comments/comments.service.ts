import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto, CreateChildCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
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

  // Tạo comment gốc (cho post hoặc block)
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentRepository.create(createCommentDto);
    return await this.commentRepository.save(comment);
  }

  // Tạo child comment (reply)
  async createChildComment(createChildCommentDto: CreateChildCommentDto): Promise<ChildComment> {
    const childComment = this.childCommentRepository.create(createChildCommentDto);
    return await this.childCommentRepository.save(childComment);
  }

  // Lấy tất cả comments của một post với sorting
  async findCommentsByPost(
    postId: number, 
    sortBy: 'newest' | 'interactions' = 'newest'
  ): Promise<any> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.commenter', 'commenter')
      .leftJoinAndSelect('comment.childComments', 'childComments')
      .leftJoinAndSelect('childComments.commentUser', 'childCommentUser')
      .leftJoinAndSelect('childComments.replyToUser', 'replyToUser')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.type = :type', { type: 'post' });

    // Sorting logic
    if (sortBy === 'newest') {
      queryBuilder.orderBy('comment.createAt', 'DESC');
      queryBuilder.addOrderBy('childComments.createAt', 'ASC'); // Child comments theo thứ tự tạo
    } else if (sortBy === 'interactions') {
      // TODO: Implement interaction count sorting
      // Cần join với user_reacts table để đếm reactions
      queryBuilder.orderBy('comment.createAt', 'DESC'); // Fallback for now
      queryBuilder.addOrderBy('childComments.createAt', 'ASC');
    }

    const comments = await queryBuilder.getMany();
    
    return {
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        type: comment.type,
        createAt: comment.createAt,
        commenter: {
          id: comment.commenter?.id,
          username: comment.commenter?.username,
          avatarUrl: comment.commenter?.avatarUrl,
        },
        childComments: comment.childComments.map(child => ({
          id: child.id,
          content: child.content,
          createAt: child.createAt,
          commentUser: {
            id: child.commentUser?.id,
            username: child.commentUser?.username,
            avatarUrl: child.commentUser?.avatarUrl,
          },
          replyToUser: child.replyToUser ? {
            id: child.replyToUser.id,
            username: child.replyToUser.username,
            avatarUrl: child.replyToUser.avatarUrl,
          } : null,
        })),
        childCommentsCount: comment.childComments.length,
      })),
      totalCount: comments.length,
      sortBy,
    };
  }

  // Lấy tất cả comments của một block
  async findCommentsByBlock(blockId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { 
        blockId,
        type: 'block'
      },
      relations: [
        'commenter', 
        'childComments', 
        'childComments.commentUser',
        'childComments.replyToUser'
      ],
      order: { createAt: 'DESC' }
    });
  }

  // Lấy chi tiết một comment
  async findOne(id: number): Promise<Comment | null> {
    return await this.commentRepository.findOne({
      where: { id },
      relations: [
        'commenter',
        'childComments',
        'childComments.commentUser',
        'childComments.replyToUser'
      ]
    });
  }

  // Update comment
  async update(id: number, updateCommentDto: UpdateCommentDto): Promise<Comment | null> {
    await this.commentRepository.update(id, updateCommentDto);
    return await this.findOne(id);
  }

  // Xóa comment
  async remove(id: number): Promise<void> {
    // Cascade delete sẽ tự động xóa child comments
    await this.commentRepository.delete(id);
  }

  // Xóa child comment
  async removeChildComment(id: number): Promise<void> {
    await this.childCommentRepository.delete(id);
  }

  // Đếm số child comments của một parent comment
  async countChildComments(parentCommentId: number): Promise<number> {
    return await this.childCommentRepository.count({
      where: { parentCommentId }
    });
  }
}
