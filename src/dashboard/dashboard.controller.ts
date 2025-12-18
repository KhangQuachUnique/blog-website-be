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

@Controller('api/admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
}
