import { Repository } from 'typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserReact } from './entities/user-react.entity';
import { CreateUserReactDto } from './dto/create-user-react.dto';
import { UpdateUserReactDto } from './dto/update-user-react.dto';
import { EReactTargetType } from './enums/react-target-type.enum';
import { User } from 'src/users/entities/user.entity';
import { Emoji } from 'src/emojis/entities/emoji.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Injectable()
export class UserReactsService {
  constructor(
    @InjectRepository(UserReact)
    private userReactRepository: Repository<UserReact>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Emoji)
    private emojiRepository: Repository<Emoji>,
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  /**
   * React to post hoặc comment
   */
  async react(dto: CreateUserReactDto) {
    const user = await this.userRepository.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('User not found');

    const emoji = await this.emojiRepository.findOneBy({ id: dto.emojiId });
    if (!emoji) throw new NotFoundException('Emoji not found');

    if (dto.type === EReactTargetType.POST) {
      if (!dto.postId) throw new BadRequestException('postId is required');

      const post = await this.postRepository.findOneBy({ id: dto.postId });
      if (!post) throw new NotFoundException('Post not found');

      // Check existing react
      const existing = await this.userReactRepository.findOne({
        where: { user: { id: dto.userId }, post: { id: dto.postId } },
        relations: ['emoji'],
      });

      if (existing) {
        // Nếu react cùng emoji -> xóa (toggle off)
        if (existing.emoji.id === dto.emojiId) {
          await this.userReactRepository.remove(existing);
          return { message: 'React removed' };
        }
        // Đổi emoji
        existing.emoji = emoji;
        return this.userReactRepository.save(existing);
      }

      // Tạo react mới
      const react = this.userReactRepository.create({
        user,
        emoji,
        post,
        type: EReactTargetType.POST,
      });
      return this.userReactRepository.save(react);
    }

    if (dto.type === EReactTargetType.COMMENT) {
      if (!dto.commentId) throw new BadRequestException('commentId is required');

      const comment = await this.commentRepository.findOneBy({ id: dto.commentId });
      if (!comment) throw new NotFoundException('Comment not found');

      const existing = await this.userReactRepository.findOne({
        where: { user: { id: dto.userId }, comment: { id: dto.commentId } },
        relations: ['emoji'],
      });

      if (existing) {
        if (existing.emoji.id === dto.emojiId) {
          await this.userReactRepository.remove(existing);
          return { message: 'React removed' };
        }
        existing.emoji = emoji;
        return this.userReactRepository.save(existing);
      }

      const react = this.userReactRepository.create({
        user,
        emoji,
        comment,
        type: EReactTargetType.COMMENT,
      });
      return this.userReactRepository.save(react);
    }

    throw new BadRequestException('Invalid type');
  }

  /**
   * Lấy danh sách reactions của post
   */
  async getPostReactions(postId: number) {
    return this.userReactRepository.find({
      where: { post: { id: postId }, type: EReactTargetType.POST },
      relations: ['user', 'emoji'],
    });
  }

  /**
   * Lấy reaction của user cho post cụ thể
   */
  async getUserReactForPost(userId: number, postId: number) {
    return this.userReactRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
      relations: ['emoji'],
    });
  }

  create(createUserReactDto: CreateUserReactDto) {
    return this.react(createUserReactDto);
  }

  findAll() {
    return this.userReactRepository.find({
      relations: ['user', 'emoji', 'post', 'comment'],
    });
  }

  findOne(id: number) {
    return this.userReactRepository.findOne({
      where: { id },
      relations: ['user', 'emoji', 'post', 'comment'],
    });
  }

  update(id: number, updateUserReactDto: UpdateUserReactDto) {
    return `This action updates a #${id} userReact`;
  }

  async remove(id: number) {
    const react = await this.userReactRepository.findOneBy({ id });
    if (!react) throw new NotFoundException('React not found');
    return this.userReactRepository.remove(react);
  }
}
