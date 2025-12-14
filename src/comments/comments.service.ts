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
    // 1. Destructure thêm parentCommentId và replyToUserId
    const { 
      content, 
      type, 
      commenterId, 
      postId, 
      blockId, 
      parentCommentId, 
      replyToUserId 
    } = createCommentDto;

    // Validate cơ bản
    if (type === ECommentType.POST && !postId) {
      throw new BadRequestException('postId is required for POST type comment');
    }
    if (type === ECommentType.BLOCK && !blockId) {
      throw new BadRequestException('blockId is required for BLOCK type comment');
    }

    // 2. Tạo entity với đầy đủ trường
    const comment = this.commentRepository.create({
      content,
      type,
      commenterId,
      postId,
      blockId,
      parentCommentId, // Quan trọng: Để biết là reply của ai
      replyToUserId,   // Quan trọng: Để hiện mũi tên -> User B
    });

    const saved = await this.commentRepository.save(comment);

    // 3. Trả về full relation để Frontend hiển thị ngay lập tức (avatar, name...)
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
      relations: [
        'commenter', 
        'replyToUser', // Cần field này để hiển thị người được reply
        'post', 
        'block', 
        'childComments', 
        'childComments.commenter', 
        'childComments.replyToUser' // Cần field này cho các reply con
      ],
      order: {
        childComments: {
          createAt: 'ASC' // Reply thì nên hiện cũ nhất lên trước (giống Facebook)
        }
      }
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
    // Logic xóa Cascade đã được xử lý ở Entity (onDelete: 'CASCADE')
    // Nhưng kiểm tra tồn tại trước khi xóa là tốt
    const result = await this.commentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Comment #${id} not found`);
    }
    return { message: `Comment #${id} deleted` };
  }

  // ========== POST/BLOCK COMMENTS ==========

  async findByPost(postId: number, sortBy: string = 'newest') {
    // QueryBuilder để xử lý sort phức tạp hơn nếu cần (ví dụ sort theo tương tác)
    const query = this.commentRepository.createQueryBuilder('comment')
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
      query.orderBy('comment.createAt', 'DESC'); 
    } else {
      // Default: Newest
      query.orderBy('comment.createAt', 'DESC');
    }

    const comments = await query.getMany();
    
    // Nếu muốn sort 'interactions' chuẩn xác mà không có cột count, phải sort bằng JS sau khi fetch
    if (sortBy === 'interactions') {
      return comments.sort((a, b) => b.childComments.length - a.childComments.length);
    }

    return comments;
  }

  async findByBlock(blockId: number) {
    return this.commentRepository.find({
      where: { blockId, type: ECommentType.BLOCK, parentComment: IsNull() },
      relations: [
        'commenter', 
        'childComments', 
        'childComments.commenter', 
        'childComments.replyToUser'
      ],
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