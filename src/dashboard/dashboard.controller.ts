import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EUserRole } from 'src/users/enums/role.enum';
import { SearchLogService } from 'src/search/search-log.service';

@Controller('api/admin/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly searchLogService: SearchLogService,
  ) {}

  /**
   * Check if user has admin role
   * Since we're not using RolesGuard, we check manually
   */
  private checkAdminRole(req: any): void {
    if (!req.user) {
      throw new ForbiddenException('User not authenticated');
    }
    if (req.user.role !== EUserRole.ADMIN) {
      throw new ForbiddenException(
        `Access denied. Admin role required. Your role: ${req.user.role}`,
      );
    }
  }

  /**
   * GET /api/admin/dashboard/stats
   * Get dashboard statistics (cards data)
   * 
   * Query params:
   * - period: 'today' | '7days' | '30days' | 'custom'
   * - startDate: string (YYYY-MM-DD) - required if period is 'custom'
   * - endDate: string (YYYY-MM-DD) - required if period is 'custom'
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStats(@Request() req, @Query() filter: DashboardFilterDto) {
    this.checkAdminRole(req);
    return this.dashboardService.getStats(filter);
  }

  /**
   * GET /api/admin/dashboard/charts
   * Get chart data for dashboard (growth over time)
   * 
   * Query params:
   * - period: 'today' | '7days' | '30days' | 'custom'
   * - startDate: string (YYYY-MM-DD) - required if period is 'custom'
   * - endDate: string (YYYY-MM-DD) - required if period is 'custom'
   */
  @Get('charts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCharts(@Request() req, @Query() filter: DashboardFilterDto) {
    this.checkAdminRole(req);
    return this.dashboardService.getCharts(filter);
  }

  /**
   * GET /api/admin/dashboard/top-keywords
   * Get top search keywords for analytics
   * 
   * Query params:
   * - period: 'today' | '7days' | '30days' | 'custom'
   * - startDate: string (YYYY-MM-DD) - required if period is 'custom'
   * - endDate: string (YYYY-MM-DD) - required if period is 'custom'
   * - limit: number (default: 10)
   */
  @Get('top-keywords')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getTopKeywords(
    @Request() req,
    @Query() filter: DashboardFilterDto,
    @Query('limit') limit?: number,
  ) {
    this.checkAdminRole(req);
    const { startDate, endDate, label } = this.dashboardService.getDateRange(filter);
    const keywords = await this.searchLogService.getTopKeywords(
      startDate,
      endDate,
      limit || 10,
    );
    return {
      keywords,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        label,
      },
    };
  }
}
