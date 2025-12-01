import { faker, Faker } from '@faker-js/faker';
import { vi } from '@faker-js/faker';
import { Report } from '../../reports/entities/report.entity';
import { EReportType } from '../../reports/enums/report-type.enum';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';
import { Comment } from '../../comments/entities/comment.entity';

const fakerVi = new Faker({ locale: vi });

// Danh sách lý do report tiếng Việt
const REPORT_REASONS_VI = [
  'Nội dung không phù hợp',
  'Spam hoặc quảng cáo',
  'Ngôn từ thù địch hoặc phân biệt đối xử',
  'Thông tin sai lệch',
  'Nội dung bạo lực',
  'Quấy rối hoặc bắt nạt',
  'Vi phạm bản quyền',
  'Nội dung người lớn',
  'Lừa đảo hoặc gian lận',
  'Khác',
];

// English report reasons
const REPORT_REASONS_EN = [
  'Inappropriate content',
  'Spam or advertising',
  'Hate speech or discrimination',
  'Misinformation',
  'Violent content',
  'Harassment or bullying',
  'Copyright violation',
  'Adult content',
  'Scam or fraud',
  'Other',
];

export class ReportFactory {
  /**
   * Track reported items to avoid duplicates
   */
  private static reportedPosts = new Set<string>();
  private static reportedComments = new Set<string>();
  private static reportedUsers = new Set<string>();

  static createPostReport(
    reporter: User,
    post: BlogPost,
    override: Partial<Report> = {},
    useVietnamese = true,
  ): Report | null {
    const key = `${reporter.id}-${post.id}`;
    if (this.reportedPosts.has(key)) {
      return null; // Already reported
    }

    const report = new Report();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;
    const reasons = useVietnamese ? REPORT_REASONS_VI : REPORT_REASONS_EN;

    report.reason = override.reason || fakerInstance.helpers.arrayElement(reasons);
    report.reporter = reporter;
    report.reportedPost = post;
    report.type = EReportType.POST;

    this.reportedPosts.add(key);
    return report;
  }

  static createCommentReport(
    reporter: User,
    comment: Comment,
    override: Partial<Report> = {},
    useVietnamese = true,
  ): Report | null {
    const key = `${reporter.id}-${comment.id}`;
    if (this.reportedComments.has(key)) {
      return null; // Already reported
    }

    const report = new Report();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;
    const reasons = useVietnamese ? REPORT_REASONS_VI : REPORT_REASONS_EN;

    report.reason = override.reason || fakerInstance.helpers.arrayElement(reasons);
    report.reporter = reporter;
    report.reportedComment = comment;
    report.type = EReportType.COMMENT;

    this.reportedComments.add(key);
    return report;
  }

  static createUserReport(
    reporter: User,
    reportedUser: User,
    override: Partial<Report> = {},
    useVietnamese = true,
  ): Report | null {
    const key = `${reporter.id}-${reportedUser.id}`;
    if (this.reportedUsers.has(key) || reporter.id === reportedUser.id) {
      return null; // Already reported or self-report
    }

    const report = new Report();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;
    const reasons = useVietnamese ? REPORT_REASONS_VI : REPORT_REASONS_EN;
    report.reason = override.reason || fakerInstance.helpers.arrayElement(reasons);
    report.reporter = reporter;
    report.reportedUser = reportedUser;
    report.type = EReportType.USER;

    this.reportedUsers.add(key);
    return report;
  }

  static resetTracking(): void {
    this.reportedPosts.clear();
    this.reportedComments.clear();
    this.reportedUsers.clear();
  }
}
