import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo báo cáo mới' })
  @ApiResponse({ status: 201, description: 'Báo cáo thành công' })
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả báo cáo' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Lấy báo cáo của bài viết' })
  getReportsByPost(@Param('postId') postId: string) {
    return this.reportsService.getReportsByPost(+postId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(+id, updateReportDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa báo cáo' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(+id);
  }
}
