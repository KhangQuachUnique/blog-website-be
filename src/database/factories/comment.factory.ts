import { faker, Faker } from '@faker-js/faker';
import { vi } from '@faker-js/faker';
import { PostComment } from '../../comments/entities/post-comment.entity';
import { BlockComment } from '../../comments/entities/block-comment.entity';
import { ChildComment } from '../../comments/entities/child-comment.entity';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';
import { Block } from '../../blocks/entities/block.entity';
import { Comment } from '../../comments/entities/comment.entity';

const fakerVi = new Faker({ locale: vi });

export class CommentFactory {
  static createPostComment(
    commenter: NormalUser,
    post: BlogPost,
    override: Partial<PostComment> = {},
    useVietnamese = true,
  ): PostComment {
    const comment = new PostComment();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    comment.content = override.content || fakerInstance.lorem.sentences({ min: 1, max: 3 });
    comment.commenter = commenter;
    comment.post = post;

    return comment;
  }

  static createBlockComment(
    commenter: NormalUser,
    block: Block,
    override: Partial<BlockComment> = {},
    useVietnamese = true,
  ): BlockComment {
    const comment = new BlockComment();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    comment.content = override.content || fakerInstance.lorem.sentences({ min: 1, max: 2 });
    comment.commenter = commenter;
    comment.block = block;

    return comment;
  }

  static createChildComment(
    commentUser: NormalUser,
    replyToUser: NormalUser,
    parentComment: Comment,
    override: Partial<ChildComment> = {},
    useVietnamese = true,
  ): ChildComment {
    const childComment = new ChildComment();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    childComment.content = override.content || fakerInstance.lorem.sentences({ min: 1, max: 2 });
    childComment.commentUser = commentUser;
    childComment.replyToUser = replyToUser;
    childComment.parentComment = parentComment;

    return childComment;
  }

  static createPostCommentBatch(
    commenters: NormalUser[],
    post: BlogPost,
    count: number,
    useVietnamese = true,
  ): PostComment[] {
    return Array.from({ length: count }, () => {
      const randomCommenter = commenters[Math.floor(Math.random() * commenters.length)];
      return this.createPostComment(randomCommenter, post, {}, useVietnamese);
    });
  }

  static createChildCommentBatch(
    users: NormalUser[],
    parentComment: Comment,
    count: number,
    useVietnamese = true,
  ): ChildComment[] {
    return Array.from({ length: count }, () => {
      const commentUser = users[Math.floor(Math.random() * users.length)];
      const replyToUser = users[Math.floor(Math.random() * users.length)];
      return this.createChildComment(commentUser, replyToUser, parentComment, {}, useVietnamese);
    });
  }
}
