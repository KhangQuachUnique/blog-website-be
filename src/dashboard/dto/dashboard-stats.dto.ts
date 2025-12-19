export class StatsCardDto {
  totalUsers: number;
  newUsers: number;
  totalPosts: number;
  newPosts: number;
  totalComments: number;
  newComments: number;
  totalCommunities: number;
  totalInteractions: number; // votes + comments
}

export class ChartDataPointDto {
  date: string;
  count: number;
}

export class DashboardChartsDto {
  userGrowth: ChartDataPointDto[];
  postGrowth: ChartDataPointDto[];
  commentGrowth: ChartDataPointDto[];
}

export class DashboardStatsResponseDto {
  stats: StatsCardDto;
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
}

export class DashboardChartsResponseDto {
  charts: DashboardChartsDto;
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
}
