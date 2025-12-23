import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import {
  ReportResponseDto,
  ReportListResponseDto,
  CreateReportResponseDto,
  CheckReportedResponseDto,
} from './dto/response/report-response.dto';
import { EReportType } from './enums/report-type.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

/**
 * 🚨 ReportsController
 * 
 * Endpoints:
 * - POST /reports - Tạo báo cáo mới
 * - GET /reports/check - Kiểm tra đã báo cáo chưa
 * - GET /reports/posts/:postId - Lấy báo cáo của 1 bài viết
 * - GET /reports - Lấy tất cả báo cáo (Admin)
 * - GET /reports/:id - Chi tiết báo cáo
 * - PATCH /reports/:id - Cập nhật báo cáo
 * - DELETE /reports/:id - Xóa báo cáo
 */
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * 📝 Tạo báo cáo mới
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo báo cáo mới (POST/COMMENT/USER)' })
  @ApiResponse({ status: 201, description: 'Báo cáo thành công', type: CreateReportResponseDto })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc đã báo cáo trước đó' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đối tượng báo cáo' })
  async create(
    @Body() createReportDto: CreateReportDto,
    @Req() req: Request,
  ): Promise<CreateReportResponseDto> {
    // Set reporterId from authenticated user (required)
    const userId = (req.user as any)?.id;
    createReportDto.reporterId = userId;
    return this.reportsService.create(createReportDto);
  }

  /**
   * ✅ Kiểm tra đã báo cáo chưa
   */
  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra đã báo cáo nội dung này chưa' })
  @ApiQuery({ name: 'type', enum: EReportType, description: 'Loại báo cáo' })
  @ApiQuery({ name: 'targetId', type: Number, description: 'ID của đối tượng (postId/commentId/userId)' })
  @ApiResponse({ status: 200, type: CheckReportedResponseDto })
  async checkIfReported(
    @Query('type') type: EReportType,
    @Query('targetId', ParseIntPipe) targetId: number,
    @Req() req: Request,
  ): Promise<CheckReportedResponseDto> {
    const userId = (req.user as any)?.id;
    return this.reportsService.checkIfReported(userId, type, targetId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy TOÀN BỘ báo cáo (Không phân trang - Export)' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  async getAllReportsNoPagination(): Promise<ReportResponseDto[]> {
    return this.reportsService.getAll();
  }

  /**
   * ⏳ Lấy danh sách báo cáo đang chờ xử lý (PENDING)
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy các báo cáo CHỜ XỬ LÝ (Pending)' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  async getPendingReports(): Promise<ReportResponseDto[]> {
    return this.reportsService.getPending();
  }

  /**
   * ✅ Lấy danh sách báo cáo đã giải quyết (RESOLVED)
   */
  @Get('resolved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy các báo cáo ĐÃ GIẢI QUYẾT (Resolved)' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  async getResolvedReports(): Promise<ReportResponseDto[]> {
    return this.reportsService.getResolved();
  }

  /**
   * 📋 Lấy tất cả báo cáo với pagination (Admin)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả báo cáo (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng (default: 20)' })
  @ApiResponse({ status: 200, type: ReportListResponseDto })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ReportListResponseDto> {
    return this.reportsService.findAll(page || 1, limit || 20);
  }

  /**
   * 📋 Lấy báo cáo của 1 bài viết
   */
  @Get('posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách báo cáo của bài viết' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  async getReportsByPost(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<ReportResponseDto[]> {
    return this.reportsService.getReportsByPost(postId);
  }

  /**
   * ⚖️ Xử lý báo cáo (Duyệt/Từ chối) - Admin Only
   * Endpoint này quan trọng nhất vừa thêm vào
   */
  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xử lý báo cáo (Chấp thuận/Từ chối)' })
  @ApiResponse({ status: 200, type: ReportResponseDto, description: 'Xử lý thành công' })
  @ApiResponse({ status: 400, description: 'Trạng thái không hợp lệ hoặc đã xử lý rồi' })
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() resolveDto: ResolveReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.resolveReport(
      id,
      resolveDto.type,
      resolveDto.action,
    );
  }

  /**
   * 🔍 Chi tiết 1 báo cáo
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết 1 báo cáo' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy báo cáo' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ReportResponseDto> {
    return this.reportsService.findOne(id);
  }

  /**
   * ✏️ Cập nhật báo cáo (Admin)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật báo cáo' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy báo cáo' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.update(id, updateReportDto);
  }

  /**
   * 🗑️ Xóa báo cáo
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa báo cáo' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy báo cáo' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.reportsService.remove(id);
  }
}
