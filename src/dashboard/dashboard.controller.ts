import { Controller, Get, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { EUserRole } from 'src/users/enums/role.enum';

@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EUserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
  @HttpCode(HttpStatus.OK)
  async getStats(@Query() filter: DashboardFilterDto) {
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
  @HttpCode(HttpStatus.OK)
  async getCharts(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getCharts(filter);
  }
}
