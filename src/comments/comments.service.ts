import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, DataSource } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { ECommentType } from './enums/comment-type.enum';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { plainToInstance } from 'class-transformer';
import { CommentResponseDto } from './dto/response/comment-response.dto';
import { Notification } from 'src/notifications/entities/notification.entity';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { UserReactQueryService } from '@modules/user-reacts/services/user-react-query.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly notificationsService: NotificationsService,

    private readonly userReactsService: UserReactQueryService,

    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,

    @InjectRepository(Block)
    private blockRepository: Repository<Block>,

    private dataSource: DataSource,
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
    console.log('Creating comment: ', replyToUserId);
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

    let post: BlogPost | null = null;
    let block: Block | null = null;

    if (postId && type === ECommentType.POST) {
      post = await this.blogPostRepository.findOne({
        where: { id: postId },
        relations: ['author'],
        select: {
          author: { id: true },
        },
      });

      if (!post) {
        throw new NotFoundException('Post không tồn tại');
      }
    }

    if (blockId && type === ECommentType.BLOCK) {
      block = await this.blockRepository.findOne({
        where: { id: blockId },
        relations: ['post', 'post.author'],
        select: {
          id: true,
          post: {
            id: true,
            author: {
              id: true,
            },
          },
        },
      });
      if (!block) {
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

    return this.commentRepository.save(comment).then(async (savedComment) => {
      if (type === ECommentType.POST && post) {
        if (post.author.id !== userId)
          await this.notificationsService.sendUserCommentedPostNotification(
            post.author.id,
            userId,
            Number(post.id),
            savedComment.id,
          );
        console.log('Sent notification to post author:', post.author.id);
        if (replyToUserId) {
          // Gửi notification cho người được reply (nếu có)
          console.log('Reply to user:', replyToUserId);
          await this.notificationsService.sendUserRepliedCommentNotification(
            replyToUserId,
            userId,
            savedComment.id,
          );
        }
      } else if (type === ECommentType.BLOCK && block) {
        // Gửi notification nếu là comment trên block và không phải tự comment vào post của mình
        if (block.post.author.id !== userId)
          await this.notificationsService.sendUserCommentedPostNotification(
            block.post.author.id,
            userId,
            Number(block.post.id),
            savedComment.id,
          );
        if (replyToUserId) {
          // Gửi notification cho người được reply (nếu có)
          console.log('Reply to user:', replyToUserId);
          await this.notificationsService.sendUserRepliedCommentNotification(
            replyToUserId,
            userId,
            savedComment.id,
          );
        }
      } else {
        // Không gửi notification nếu không thỏa điều kiện
      }

      return plainToInstance(CommentResponseDto, savedComment, { excludeExtraneousValues: true });
    });
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
    return await this.dataSource.transaction(async (manager) => {
      // 1. Kiểm tra comment tồn tại
      const comment = await manager.findOne(Comment, {
        where: { id },
        relations: ['childComments'],
      });

      if (!comment) {
        throw new NotFoundException(`Comment #${id} not found`);
      }

      // 2. Dọn dẹp orphan notifications
      const commentIds = [id, ...comment.childComments.map((c) => c.id)];

      const notificationsToDelete = await manager
        .getRepository(Notification)
        .createQueryBuilder('notification')
        .where(
          // 👇 SỬA Ở ĐÂY: Thêm ngoặc đơn (...) và dùng tham số :...ids
          "(notification.params->>'commentId')::integer IN (:...ids)",
          { ids: commentIds },
        )
        .getMany();

      if (notificationsToDelete.length > 0) {
        await manager.remove(Notification, notificationsToDelete);
      }

      // 3. Xóa comment (cascade sẽ xóa child comments + user_reacts)
      await manager.delete(Comment, id);

      return {
        message: `Comment #${id} and its dependencies deleted successfully`,
        deletedCommentCount: 1,
        deletedRepliesCount: comment.childComments.length,
        deletedNotificationsCount: notificationsToDelete.length,
      };
    });
  }

  // ========== POST/BLOCK COMMENTS ==========

  async findByPost(
    postId: number,
    sortBy: string = 'newest',
    currentUserId?: number,
  ): Promise<CommentResponseDto[]> {
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

    const reactsMap = await this.userReactsService.getUserReactForComments(
      comments.map((c) => c.id),
      currentUserId,
    );

    // Nếu muốn sort 'interactions' chuẩn xác mà không có cột count, phải sort bằng JS sau khi fetch
    if (sortBy === 'interactions') {
      return comments
        .sort((a, b) => b.childComments.length - a.childComments.length)
        .map((comment) => {
          const result = plainToInstance(CommentResponseDto, comment, {
            excludeExtraneousValues: true,
          });
          result['reacts'] = reactsMap.get(comment.id);
          return result;
        });
    }

    return comments.map((comment) => {
      const result = plainToInstance(CommentResponseDto, comment, {
        excludeExtraneousValues: true,
      });
      result['reacts'] = reactsMap.get(comment.id);
      return result;
    });
  }

  async findByBlock(blockId: number, currentUserId?: number): Promise<CommentResponseDto[]> {
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

    const reactsMap = await this.userReactsService.getUserReactForComments(
      comments.map((c) => c.id),
      currentUserId,
    );

    return comments.map((comment) => {
      const result = plainToInstance(CommentResponseDto, comment, {
        excludeExtraneousValues: true,
      });
      result['reacts'] = reactsMap.get(comment.id);
      return result;
    });
  }

  async countByPost(postId: number) {
    const total = await this.commentRepository.count({ where: { post: { id: postId } } });
    const parentComments = await this.commentRepository.count({
      where: { post: { id: postId }, parentComment: IsNull() },
    });
    return { postId, total, parentComments, replies: total - parentComments };
  }
}
