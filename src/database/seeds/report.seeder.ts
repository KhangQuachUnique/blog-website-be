import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { PostReport } from '../../reports/entities/post-report.entity';
import { CommentReport } from '../../reports/entities/comment-report.entity';
import { UserReport } from '../../reports/entities/user-report.entity';
import { ReportFactory } from '../factories/report.factory';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';
import { Comment } from '../../comments/entities/comment.entity';

export class ReportSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Reports...');

    const postReportRepository = this.dataSource.getRepository(PostReport);
    const commentReportRepository = this.dataSource.getRepository(CommentReport);
    const userReportRepository = this.dataSource.getRepository(UserReport);
    const userRepository = this.dataSource.getRepository(NormalUser);
    const blogPostRepository = this.dataSource.getRepository(BlogPost);
    const commentRepository = this.dataSource.getRepository(Comment);

    try {
      // Get data
      const users = await userRepository.find();
      const blogPosts = await blogPostRepository.find();
      const comments = await commentRepository.find();

      if (users.length === 0) {
        this.error('No users found. Please run UserSeeder first.');
        return;
      }

      // 1. Create Post Reports
      console.log('  🚨 Creating post reports...');
      if (blogPosts.length > 0) {
        // 5% of posts get reported
        const reportCount = Math.floor(blogPosts.length * 0.05);
        const postReports: PostReport[] = [];

        for (let i = 0; i < reportCount; i++) {
          const reporter = users[Math.floor(Math.random() * users.length)];
          const post = blogPosts[Math.floor(Math.random() * blogPosts.length)];
          const useVietnamese = Math.random() < 0.7; // 70% Vietnamese

          const report = ReportFactory.createPostReport(reporter, post, {}, useVietnamese);
          if (report) postReports.push(report);
        }

        await postReportRepository.save(postReports);
        this.success(`Created ${postReports.length} post reports`);
      }

      // 2. Create Comment Reports
      console.log('  💬 Creating comment reports...');
      if (comments.length > 0) {
        // 3% of comments get reported
        const reportCount = Math.floor(comments.length * 0.03);
        const commentReports: CommentReport[] = [];

        for (let i = 0; i < reportCount; i++) {
          const reporter = users[Math.floor(Math.random() * users.length)];
          const comment = comments[Math.floor(Math.random() * comments.length)];
          const useVietnamese = Math.random() < 0.7;

          const report = ReportFactory.createCommentReport(reporter, comment, {}, useVietnamese);
          if (report) commentReports.push(report);
        }

        await commentReportRepository.save(commentReports);
        this.success(`Created ${commentReports.length} comment reports`);
      }

      // 3. Create User Reports
      console.log('  👤 Creating user reports...');
      // 2% of users get reported
      const userReportCount = Math.floor(users.length * 0.02);
      const userReports: UserReport[] = [];

      for (let i = 0; i < userReportCount; i++) {
        const reporter = users[Math.floor(Math.random() * users.length)];
        const reportedUser = users[Math.floor(Math.random() * users.length)];
        const useVietnamese = Math.random() < 0.7;

        const report = ReportFactory.createUserReport(reporter, reportedUser, {}, useVietnamese);
        if (report) userReports.push(report);
      }

      await userReportRepository.save(userReports);
      this.success(`Created ${userReports.length} user reports`);

      this.success('✓ Reports seeded successfully');
    } catch (error) {
      this.error('Failed to seed reports', error);
      throw error;
    }
  }
}
