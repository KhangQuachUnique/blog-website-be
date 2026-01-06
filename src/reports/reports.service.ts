import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { GetGroupedReportsDto } from './dto/get-grouped-reports.dto';
import { BlogPostsService } from 'src/blog-posts/blog-posts.service';
import { UsersService } from 'src/users/users.service';
import { CommentsService } from 'src/comments/comments.service';
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

    private readonly blogPostsService: BlogPostsService,
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
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
   * @param postId
   * @param status
   */
  async getReportsByPost(postId: number, status?: EReportStatus): Promise<ReportResponseDto[]> {

    const whereCondition: any = { 
      reportedPost: { id: postId } 
    };

    if (status) {
      whereCondition.status = status;
    }

    const reports = await this.reportRepository.find({
      where: whereCondition,
      relations: ['reporter', 'reportedPost'],
      order: { createdAt: 'DESC' },
    });

    return reports.map((report) => this.mapToResponseDto(report));
  }

  /**
   * Lấy toàn bộ báo cáo
   */
  async getAll(): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
      order: { createdAt: 'DESC' },
    });

    return reports.map((report) => this.mapToResponseDto(report));
  }

  /**
   * ⏳ Lấy danh sách báo cáo đang chờ xử lý (PENDING)
   */
  async getPending(): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      where: { status: EReportStatus.PENDING },
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
      order: { createdAt: 'ASC' },
    });

    return reports.map((report) => this.mapToResponseDto(report));
  }

  /**
   * ✅ Lấy danh sách báo cáo đã giải quyết (RESOLVED)
   */
  async getResolved(): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      where: { status: EReportStatus.RESOLVED },
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
      order: { createdAt: 'DESC' },
    });

    return reports.map((report) => this.mapToResponseDto(report));
  }

  async findGrouped(dto: GetGroupedReportsDto) {
    // 1. Khởi tạo & Destructuring
    const { status, type, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    // 2. Mapping: Xác định tên cột trong DB (để Group) và tên Relation trong Entity (để Find)
    let targetColumn = ''; // Tên cột Database (vd: reportedPostId)
    let relation = '';     // Tên Relation Entity (vd: reportedPost)

    switch (type) {
      case EReportType.POST:
        targetColumn = 'reportedPostId';
        relation = 'reportedPost';
        break;
      case EReportType.COMMENT:
        targetColumn = 'reportedCommentId';
        relation = 'reportedComment';
        break;
      case EReportType.USER:
        targetColumn = 'reportedUserId';
        relation = 'reportedUser';
        break;
      default:
        // Mặc định fallback về POST nếu không truyền type (hoặc xử lý logic khác tùy bạn)
        targetColumn = 'reportedPostId';
        relation = 'reportedPost';
    }

    // --- BƯỚC 1: TÌM CÁC NHÓM (GROUP BY & PAGINATION) ---
    const queryBuilder = this.reportRepository.createQueryBuilder('report');

    queryBuilder
      .select(`report.${targetColumn}`, 'targetId')   // Select ID của đối tượng (vd: Bài viết ID 10)
      .addSelect('COUNT(report.id)', 'totalReports')  // Đếm số lượng report của bài đó
      .addSelect('MAX(report.createdAt)', 'latestAt') // Lấy thời gian report mới nhất
      .where(`report.${targetColumn} IS NOT NULL`);   // Chỉ lấy bản ghi có target
    
    // Áp dụng bộ lọc Status (PENDING/RESOLVED)
    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }
    
    // Áp dụng bộ lọc Type (POST/COMMENT/USER)
    if (type) {
      queryBuilder.andWhere('report.type = :type', { type });
    }

    // Thực hiện Group và Phân trang trên nhóm
    queryBuilder
      .groupBy(`report.${targetColumn}`)
      .orderBy('"totalReports"', 'DESC') // Ưu tiên đối tượng bị report nhiều nhất lên đầu
      .addOrderBy('"latestAt"', 'DESC')  // Sau đó ưu tiên cái mới nhất
      .offset(skip)
      .limit(limit);

    // Lấy dữ liệu thô (Raw Data): [{ targetId: 1, totalReports: '5', latestAt: ... }]
    const rawGroups = await queryBuilder.getRawMany();

    // --- BƯỚC 2: ĐẾM TỔNG SỐ NHÓM (TOTAL COUNT) ---
    // Cần query riêng để tính Total Pages chính xác
    const countQuery = this.reportRepository.createQueryBuilder('report')
       .select(`report.${targetColumn}`)
       .where(`report.${targetColumn} IS NOT NULL`);
       
    if (status) countQuery.andWhere('report.status = :status', { status });
    if (type) countQuery.andWhere('report.type = :type', { type });
    
    // Đếm số lượng nhóm unique
    const distinctGroups = await countQuery
        .groupBy(`report.${targetColumn}`)
        .getRawMany();
    
    const totalItems = distinctGroups.length;

    // --- BƯỚC 3: LẤY CHI TIẾT (HYDRATION) ---
    if (rawGroups.length === 0) {
      return {
        data: [],
        meta: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: limit },
      };
    }

    // Duyệt qua từng nhóm để lấy danh sách report chi tiết
    const result = await Promise.all(
      rawGroups.map(async (group) => {
        const targetId = group.targetId;
        
        // Tìm tất cả report con thuộc về targetId này
        const reportsList = await this.reportRepository.find({
          where: {
            // 🔥 QUAN TRỌNG: Query theo Relation Object để tránh lỗi "Property not found"
            // Ví dụ: reportedPost: { id: 1 }
            [relation]: { id: targetId }, 
            
            // Vẫn giữ filter status để đồng bộ
            ...(status ? { status } : {}),
          },
          relations: ['reporter', relation], // Load thông tin chi tiết
          order: { createdAt: 'DESC' },
        });

        // Lấy report đại diện (cái mới nhất) để hiển thị thông tin chung cho nhóm
        const representative = reportsList[0];

        if (!representative) return null;

        // Trả về dữ liệu đã được cấu trúc lại
        return {
          // Các trường cơ bản (tái sử dụng DTO cũ)
          id: representative.id, 
          reason: representative.reason, 
          type: representative.type,
          status: representative.status,
          createdAt: group.latestAt,
          resolvedAt: representative.resolvedAt || undefined,
          
          // Các trường Relation (để UI hiển thị tên bài viết, user...)
          reporter: representative.reporter,
          reportedUser: representative.reportedUser,
          reportedPost: representative.reportedPost,
          reportedComment: representative.reportedComment ? {
            id: representative.reportedComment.id,
            contentPreview: representative.reportedComment.content 
              ? representative.reportedComment.content.substring(0, 200) // Cắt ngắn nếu cần
              : '', 
          } : undefined,

          // 🔥 CÁC TRƯỜNG BỔ SUNG CHO GROUP (Frontend cần cái này)
          totalReports: parseInt(group.totalReports, 10), // Convert string count sang number
          latestReason: representative.reason,
          
          // Map danh sách con sang DTO chuẩn để bảo mật thông tin
          reportsList: reportsList.map(r => this.mapToResponseDto(r)), 
        };
      })
    );

    // Lọc bỏ null nếu có lỗi data rác
    const cleanResult = result.filter(item => item !== null);

    return {
      items: cleanResult,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
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
   *  Xử lý báo cáo
   */
  async resolveReport(id: number, type: EReportType, action: 'APPROVE' | 'REJECT', userId: number): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
    });

    if (!report) throw new NotFoundException('Báo cáo không tồn tại');

    if (report.type !== type) {
      throw new BadRequestException('Loại báo cáo không khớp với dữ liệu hệ thống');
    }
    
    if (report.status === EReportStatus.RESOLVED) {
        throw new BadRequestException('Báo cáo này đã được giải quyết trước đó');
    }

    if (action === 'APPROVE') {
      switch (type) {
        case EReportType.POST:
          await this.handlePostResolution(report, userId);
          break;

        case EReportType.COMMENT:
          await this.handleCommentResolution(report);
          report.reportedComment = null;
          break;

        case EReportType.USER:
          await this.handleUserResolution(report);
          break;

        default:
          throw new BadRequestException('Loại báo cáo không được hỗ trợ');
      }
    }

    report.status = EReportStatus.RESOLVED;
    
    const savedReport = await this.reportRepository.save(report);

    return this.mapToResponseDto(savedReport);
  }

  /**
   * 🚀 Xử lý TOÀN BỘ báo cáo theo đối tượng (Target)
   * Áp dụng cho: Post, Comment, User
   */
  async resolveAllByTarget(
    targetId: number,
    type: EReportType,
    action: 'APPROVE' | 'REJECT',
    adminId: number,
  ): Promise<{ message: string; count: number }> {
    
    let whereCondition: any = { status: EReportStatus.PENDING };
    
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
      default:
        throw new BadRequestException('Loại báo cáo không hợp lệ');
    }

    const count = await this.reportRepository.count({ where: whereCondition });

    if (count === 0) {
      return { message: 'Không có báo cáo chờ xử lý nào cho đối tượng này', count: 0 };
    }

    await this.reportRepository.update(whereCondition, {
      status: EReportStatus.RESOLVED,
      resolvedAt: new Date(),
    });

    if (action === 'APPROVE') {
      switch (type) {
        case EReportType.POST:
          await this.blogPostsService.hide(targetId, adminId);
          break;

        case EReportType.COMMENT:
          await this.commentsService.remove(targetId);
          break;

        case EReportType.USER:
          await this.usersService.banUser(targetId, 'Vi phạm tiêu chuẩn cộng đồng (Xử lý hàng loạt)');
          break;
      }
    }

    return {
      message: `Đã xử lý xong ${count} báo cáo liên quan.`,
      count,
    };
  }

  /**
   * Xử lý Report Bài viết: Chuyển trạng thái bài viết sang HIDDEN
   */
  private async handlePostResolution(report: Report, userId: number): Promise<void> {
    if (!report.reportedPost) return;
    const postId = report.reportedPost.id;
    await this.blogPostsService.hide(postId, userId); 
  }

  /**
   * Xử lý Report Người dùng: Thực hiện BAN tài khoản người dùng
   */
  private async handleUserResolution(report: Report): Promise<void> {
    if (!report.reportedUser) return;
    const userId = report.reportedUser.id;
    await this.usersService.banUser(userId, report.reason);
  }

  /**
   * Xử lý Report Bình luận: Xóa vĩnh viễn bình luận khỏi hệ thống
   */
  private async handleCommentResolution(report: Report): Promise<void> {
    if (!report.reportedComment) return;
    const commentId = report.reportedComment.id;  
    await this.commentsService.remove(commentId);
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
      resolvedAt: report.resolvedAt || undefined,
      status: report.status,
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
