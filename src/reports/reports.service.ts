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
import {
  ReportResponseDto,
  ReportListResponseDto,
  CreateReportResponseDto,
  CheckReportedResponseDto,
} from './dto/response/report-response.dto';

/**
 * 🚨 ReportsService
 * 
 * Business Logic:
 * - Tạo báo cáo cho POST, COMMENT, USER
 * - Kiểm tra đã báo cáo chưa (tránh spam)
 * - Lấy danh sách báo cáo với pagination
 * - Admin: Xử lý báo cáo
 */
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

  /**
   * 📝 Tạo báo cáo mới
   */
  async create(dto: CreateReportDto): Promise<CreateReportResponseDto> {
    // Validate reporter
    const reporter = await this.userRepository.findOneBy({ id: dto.reporterId });
    if (!reporter) throw new NotFoundException('Người báo cáo không tồn tại');

    // Check if already reported
    const existingReport = await this.checkExistingReport(dto);
    if (existingReport) {
      throw new BadRequestException('Bạn đã báo cáo nội dung này trước đó');
    }

    const report = new Report();
    report.reporter = reporter;
    report.reason = dto.reason;
    report.type = dto.type;

    switch (dto.type) {
      case EReportType.POST:
        if (!dto.reportedPostId) throw new BadRequestException('reportedPostId là bắt buộc');
        const post = await this.postRepository.findOneBy({ id: dto.reportedPostId });
        if (!post) throw new NotFoundException('Bài viết không tồn tại');
        report.reportedPost = post;
        break;

      case EReportType.COMMENT:
        if (!dto.reportedCommentId) throw new BadRequestException('reportedCommentId là bắt buộc');
        const comment = await this.commentRepository.findOneBy({ id: dto.reportedCommentId });
        if (!comment) throw new NotFoundException('Bình luận không tồn tại');
        report.reportedComment = comment;
        break;

      case EReportType.USER:
        if (!dto.reportedUserId) throw new BadRequestException('reportedUserId là bắt buộc');
        const user = await this.userRepository.findOneBy({ id: dto.reportedUserId });
        if (!user) throw new NotFoundException('Người dùng không tồn tại');
        report.reportedUser = user;
        break;
    }

    const savedReport = await this.reportRepository.save(report);
    
    return {
      message: 'Báo cáo đã được gửi thành công',
      reportId: savedReport.id,
    };
  }

  /**
   * 🔍 Kiểm tra đã báo cáo chưa
   */
  private async checkExistingReport(dto: CreateReportDto): Promise<Report | null> {
    const whereCondition: any = {
      reporter: { id: dto.reporterId },
      type: dto.type,
    };

    switch (dto.type) {
      case EReportType.POST:
        whereCondition.reportedPost = { id: dto.reportedPostId };
        break;
      case EReportType.COMMENT:
        whereCondition.reportedComment = { id: dto.reportedCommentId };
        break;
      case EReportType.USER:
        whereCondition.reportedUser = { id: dto.reportedUserId };
        break;
    }

    return this.reportRepository.findOne({ where: whereCondition });
  }

  /**
   * ✅ Check if user already reported target
   */
  async checkIfReported(
    reporterId: number,
    type: EReportType,
    targetId: number,
  ): Promise<CheckReportedResponseDto> {
    const whereCondition: any = {
      reporter: { id: reporterId },
      type,
    };

    switch (type) {
      case EReportType.POST:
        whereCondition.reportedPost = { id: targetId };
        break;
      case EReportType.COMMENT:
        whereCondition.reportedComment = { id: targetId };
        break;
      case EReportType.USER:
        whereCondition.reportedUser = { id: targetId };
        break;
    }

    const report = await this.reportRepository.findOne({ where: whereCondition });
    
    return {
      isReported: !!report,
      reportId: report?.id,
    };
  }

  /**
   * 📋 Lấy báo cáo của 1 bài viết
   */
  async getReportsByPost(postId: number): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      where: { reportedPost: { id: postId } },
      relations: ['reporter', 'reportedPost'],
      order: { createdAt: 'DESC' },
    });

    return reports.map(this.mapToResponseDto);
  }

  /**
   * 📋 Lấy tất cả báo cáo với pagination (Admin)
   */
  async findAll(page = 1, limit = 20): Promise<ReportListResponseDto> {
    const [reports, total] = await this.reportRepository.findAndCount({
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: reports.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 🔍 Lấy chi tiết 1 báo cáo
   */
  async findOne(id: number): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
    });

    if (!report) throw new NotFoundException('Báo cáo không tồn tại');

    return this.mapToResponseDto(report);
  }

  /**
   * ✏️ Cập nhật báo cáo (Admin)
   */
  async update(id: number, dto: UpdateReportDto): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
    });

    if (!report) throw new NotFoundException('Báo cáo không tồn tại');

    if (dto.reason) {
      report.reason = dto.reason;
    }

    const updated = await this.reportRepository.save(report);
    return this.mapToResponseDto(updated);
  }

  /**
   * 🗑️ Xóa báo cáo
   */
  async remove(id: number): Promise<{ message: string }> {
    const report = await this.reportRepository.findOneBy({ id });
    if (!report) throw new NotFoundException('Báo cáo không tồn tại');
    
    await this.reportRepository.remove(report);
    return { message: 'Đã xóa báo cáo' };
  }

  /**
   * 🔄 Map entity to response DTO
   */
  private mapToResponseDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      reason: report.reason,
      type: report.type,
      createdAt: report.createdAt,
      reporter: report.reporter ? {
        id: report.reporter.id,
        username: report.reporter.username,
        avatarUrl: report.reporter.avatarUrl || undefined,
      } : null as any,
      reportedUser: report.reportedUser ? {
        id: report.reportedUser.id,
        username: report.reportedUser.username,
        avatarUrl: report.reportedUser.avatarUrl || undefined,
      } : undefined,
      reportedPost: report.reportedPost ? {
        id: report.reportedPost.id,
        title: report.reportedPost.title,
        thumbnailUrl: report.reportedPost.thumbnailUrl || undefined,
      } : undefined,
      reportedComment: report.reportedComment ? {
        id: report.reportedComment.id,
        contentPreview: report.reportedComment.content?.substring(0, 100) || '',
      } : undefined,
    };
  }
}
