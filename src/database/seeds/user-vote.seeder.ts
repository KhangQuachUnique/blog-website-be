import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { UserVoteFactory } from '../factories/user-vote.factory';
import { UserVote } from '../../user-votes/entities/user-vote.entity';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';

export class UserVoteSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding User Votes...');

    const userRepository = this.dataSource.getRepository(User);
    const blogPostRepository = this.dataSource.getRepository(BlogPost);
    const userVoteRepository = this.dataSource.getRepository(UserVote);

    try {
      const users = await userRepository.find();
      const blogPosts = await blogPostRepository.find();

      if (users.length === 0) {
        this.error('No users found. Please run UserSeeder first.');
        return;
      }

      if (blogPosts.length === 0) {
        this.error('No blog posts found. Please run BlogPostSeeder first.');
        return;
      }

      let totalVotes = 0;

      // For each blog post, create 5-20 votes from different users
      for (const post of blogPosts) {
        const voteCount = Math.floor(Math.random() * 16) + 5; // 5-20 votes per post
        const votes = UserVoteFactory.createBatch(users, post, voteCount);

        if (votes.length > 0) {
          const savedVotes = await userVoteRepository.save(votes);
          totalVotes += savedVotes.length;
        }
      }

      this.success(`Created ${totalVotes} votes for ${blogPosts.length} blog posts`);
    } catch (error) {
      this.error('Failed to seed user votes', error);
      throw error;
    }
  }
}
