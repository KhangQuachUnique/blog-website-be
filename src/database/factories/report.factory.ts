import { faker, Faker } from '@faker-js/faker';
import { vi } from '@faker-js/faker';
import { PostReport } from '../../reports/entities/post-report.entity';
import { CommentReport } from '../../reports/entities/comment-report.entity';
import { UserReport } from '../../reports/entities/user-report.entity';
import { NormalUser } from '../../users/entities/normal-user.entity';
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
    reporter: NormalUser,
    post: BlogPost,
    override: Partial<PostReport> = {},
    useVietnamese = true,
  ): PostReport | null {
    const key = `${reporter.id}-${post.id}`;
    if (this.reportedPosts.has(key)) {
      return null; // Already reported
    }

    const report = new PostReport();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;
    const reasons = useVietnamese ? REPORT_REASONS_VI : REPORT_REASONS_EN;

    report.reason = override.reason || fakerInstance.helpers.arrayElement(reasons);
    report.reporter = reporter;
    report.post = post;

    this.reportedPosts.add(key);
    return report;
  }

  static createCommentReport(
    reporter: NormalUser,
    comment: Comment,
    override: Partial<CommentReport> = {},
    useVietnamese = true,
  ): CommentReport | null {
    const key = `${reporter.id}-${comment.id}`;
    if (this.reportedComments.has(key)) {
      return null; // Already reported
    }

    const report = new CommentReport();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;
    const reasons = useVietnamese ? REPORT_REASONS_VI : REPORT_REASONS_EN;

    report.reason = override.reason || fakerInstance.helpers.arrayElement(reasons);
    report.reporter = reporter;
    report.comment = comment;

    this.reportedComments.add(key);
    return report;
  }

  static createUserReport(
    reporter: NormalUser,
    reportedUser: NormalUser,
    override: Partial<UserReport> = {},
    useVietnamese = true,
  ): UserReport | null {
    const key = `${reporter.id}-${reportedUser.id}`;
    if (this.reportedUsers.has(key) || reporter.id === reportedUser.id) {
      return null; // Already reported or self-report
    }

    const report = new UserReport();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;
    const reasons = useVietnamese ? REPORT_REASONS_VI : REPORT_REASONS_EN;

    report.reason = override.reason || fakerInstance.helpers.arrayElement(reasons);
    report.reporter = reporter;
    report.user = reportedUser;

    this.reportedUsers.add(key);
    return report;
  }

  static resetTracking(): void {
    this.reportedPosts.clear();
    this.reportedComments.clear();
    this.reportedUsers.clear();
  }
}
