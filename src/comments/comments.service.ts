import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { ECommentType } from './enums/comment-type.enum';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { plainToInstance } from 'class-transformer';
import { CommentResponseDto } from './dto/response/comment-response.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,

    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}

  // ========== BASIC CRUD ==========

  async create({
    userId,
    createCommentDto,
  }: {
    userId: number;
    createCommentDto: CreateCommentDto;
  }): Promise<CommentResponseDto> {
    // 1. Destructure thêm parentCommentId và replyToUserId
    const { content, type, postId, blockId, parentCommentId, replyToUserId } = createCommentDto;

    // 2. Validate dữ liệu đầu vào
    if (type === ECommentType.POST && !postId) {
      throw new BadRequestException('Thiếu postId');
    }

    if (type === ECommentType.BLOCK && !blockId) {
      throw new BadRequestException('Thiếu blockId');
    }

    // Kiểm tra tồn tại comment cha nếu có
    if (parentCommentId) {
      const parentExists = await this.commentRepository.exists({
        where: { id: parentCommentId },
      });

      if (!parentExists) {
        throw new NotFoundException('Comment cha không tồn tại');
      }
    }

    // Kiểm tra tồn tại post/block nếu có
    if (type === ECommentType.POST) {
      const postExists = await this.blogPostRepository.exists({
        where: { id: postId },
      });

      if (!postExists) {
        throw new NotFoundException('Post không tồn tại');
      }
    }

    if (type === ECommentType.BLOCK) {
      const blockExists = await this.blockRepository.exists({
        where: { id: blockId },
      });

      if (!blockExists) {
        throw new NotFoundException('Block không tồn tại');
      }
    }

    const comment = this.commentRepository.create({
      content,
      type,
      commenter: { id: userId },
      post: postId ? { id: postId } : undefined,
      block: blockId ? { id: blockId } : undefined,
      parentComment: parentCommentId ? { id: parentCommentId } : undefined,
      replyToUser: replyToUserId ? { id: replyToUserId } : undefined,
    });

    return this.commentRepository
      .save(comment)
      .then((savedComment) =>
        plainToInstance(CommentResponseDto, savedComment, { excludeExtraneousValues: true }),
      );
  }

  async findAll(): Promise<CommentResponseDto[]> {
    return this.commentRepository
      .find({
        where: { parentComment: IsNull() },
        relations: ['commenter', 'childComments', 'childComments.commenter'],
        order: { createAt: 'DESC', childComments: { createAt: 'ASC' } },
        take: 50,
      })
      .then((comments) =>
        comments.map((comment) =>
          plainToInstance(CommentResponseDto, comment, { excludeExtraneousValues: true }),
        ),
      );
  }

  async findOne(id: number): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: [
        'commenter',
        'replyToUser', // Cần field này để hiển thị người được reply
        'post',
        'block',
        'childComments',
        'childComments.commenter',
        'childComments.replyToUser', // Cần field này cho các reply con
      ],
      order: {
        childComments: {
          createAt: 'ASC', // Reply thì nên hiện cũ nhất lên trước (giống Facebook)
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }
    return plainToInstance(CommentResponseDto, comment, { excludeExtraneousValues: true });
  }

  async remove(id: number) {
    // Logic xóa Cascade đã được xử lý ở Entity (onDelete: 'CASCADE')
    // Nhưng kiểm tra tồn tại trước khi xóa là tốt
    const result = await this.commentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Comment #${id} not found`);
    }
    return { message: `Comment #${id} deleted` };
  }

  // ========== POST/BLOCK COMMENTS ==========

  async findByPost(postId: number, sortBy: string = 'newest'): Promise<CommentResponseDto[]> {
    // QueryBuilder để xử lý sort phức tạp hơn nếu cần (ví dụ sort theo tương tác)
    const query = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.commenter', 'commenter')
      .leftJoinAndSelect('comment.childComments', 'childComments')
      .leftJoinAndSelect('childComments.commenter', 'childCommenter')
      .leftJoinAndSelect('childComments.replyToUser', 'replyToUser')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.type = :type', { type: ECommentType.POST })
      .andWhere('comment.parentCommentId IS NULL'); // Chỉ lấy comment cha

    if (sortBy === 'interactions') {
      // Sắp xếp theo số lượng reply (ví dụ đơn giản về tương tác)
      // Lưu ý: Sort theo relation count trong TypeORM cần map subquery hoặc loadRelationCountAndMap
      // Ở đây mình dùng cách đơn giản: load lên rồi sort JS hoặc sort theo createAt tạm thời
      // Để tối ưu, nên có cột `childCommentsCount` trong DB và sort theo đó.
      query.orderBy('comment.createAt', 'DESC').addOrderBy('childComments.createAt', 'ASC');
    } else {
      // Default: Newest
      query.orderBy('comment.createAt', 'DESC').addOrderBy('childComments.createAt', 'ASC');
    }

    const comments = await query.getMany();

    // Nếu muốn sort 'interactions' chuẩn xác mà không có cột count, phải sort bằng JS sau khi fetch
    if (sortBy === 'interactions') {
      return comments
        .sort((a, b) => b.childComments.length - a.childComments.length)
        .map((comment) =>
          plainToInstance(CommentResponseDto, comment, { excludeExtraneousValues: true }),
        );
    }

    return comments.map((comment) =>
      plainToInstance(CommentResponseDto, comment, { excludeExtraneousValues: true }),
    );
  }

  async findByBlock(blockId: number): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { block: { id: blockId }, type: ECommentType.BLOCK, parentComment: IsNull() },
      relations: [
        'commenter',
        'childComments',
        'childComments.commenter',
        'childComments.replyToUser',
      ],
      order: { createAt: 'DESC', childComments: { createAt: 'ASC' } },
    });
    return comments.map((comment) =>
      plainToInstance(CommentResponseDto, comment, { excludeExtraneousValues: true }),
    );
  }

  async countByPost(postId: number) {
    const total = await this.commentRepository.count({ where: { post: { id: postId } } });
    const parentComments = await this.commentRepository.count({
      where: { post: { id: postId }, parentComment: IsNull() },
    });
    return { postId, total, parentComments, replies: total - parentComments };
  }
}
