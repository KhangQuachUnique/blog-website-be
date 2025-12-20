import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';
import { EReportType } from './enums/report-type.enum';
import { EReportStatus } from './enums/report-status.enum';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(dto: CreateReportDto) {
    const reporter = await this.userRepository.findOneBy({ id: dto.reporterId });
    if (!reporter) throw new NotFoundException('Reporter not found');

    const report = new Report();
    report.reporter = reporter;
    report.reason = dto.reason;
    report.type = dto.type;

    switch (dto.type) {
      case EReportType.POST:
        if (!dto.reportedPostId) throw new BadRequestException('reportedPostId is required');
        const post = await this.postRepository.findOneBy({ id: dto.reportedPostId });
        if (!post) throw new NotFoundException('Post not found');
        report.reportedPost = post;
        break;

      case EReportType.COMMENT:
        if (!dto.reportedCommentId) throw new BadRequestException('reportedCommentId is required');
        const comment = await this.commentRepository.findOneBy({ id: dto.reportedCommentId });
        if (!comment) throw new NotFoundException('Comment not found');
        report.reportedComment = comment;
        break;

      case EReportType.USER:
        if (!dto.reportedUserId) throw new BadRequestException('reportedUserId is required');
        const user = await this.userRepository.findOneBy({ id: dto.reportedUserId });
        if (!user) throw new NotFoundException('User not found');
        report.reportedUser = user;
        break;
    }

    return this.reportRepository.save(report);
  }

  async getReportsByPost(postId: number) {
    return this.reportRepository.find({
      where: { reportedPost: { id: postId } },
      relations: ['reporter'],
    });
  }

  findAll() {
    return this.reportRepository.find({
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
    });
  }

  findOne(id: number) {
    return this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
    });
  }

  update(id: number, updateReportDto: UpdateReportDto) {
    return `This action updates a #${id} report`;
  }


  /**
   * Update report status
   * @param id
   * @param dto
   * @returns
   */
  async updateStatus(id: number, dto: { status: EReportStatus }) {
    const post = await this.reportRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Không tìm được báo cáo với id là: ${id}`);
    }

    post.status = dto.status;
    return this.reportRepository.save(post);
  }

  async remove(id: number) {
    const report = await this.reportRepository.findOneBy({ id });
    if (!report) throw new NotFoundException('Report not found');
    return this.reportRepository.remove(report);
  }
}
