import { faker, Faker } from '@faker-js/faker';
import { vi } from '@faker-js/faker';
import { Comment } from '../../comments/entities/comment.entity';
import { ChildComment } from '../../comments/entities/child-comment.entity';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';
import { Block } from '../../blocks/entities/block.entity';
import { ECommentType } from '../../comments/enums/comment-type.enum';

const fakerVi = new Faker({ locale: vi });

export class CommentFactory {
  static createPostComment(
    commenter: User,
    post: BlogPost,
    override: Partial<Comment> = {},
    useVietnamese = true,
  ): Comment {
    const comment = new Comment();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    comment.content = override.content || fakerInstance.lorem.sentences({ min: 1, max: 3 });
    comment.commenter = commenter;
    comment.post = post;
    comment.type = ECommentType.POST;

    return comment;
  }

  static createBlockComment(
    commenter: User,
    block: Block,
    override: Partial<Comment> = {},
    useVietnamese = true,
  ): Comment {
    const comment = new Comment();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    comment.content = override.content || fakerInstance.lorem.sentences({ min: 1, max: 2 });
    comment.commenter = commenter;
    comment.block = block;
    comment.type = ECommentType.BLOCK;

    return comment;
  }

  static createChildComment(
    commentUser: User,
    replyToUser: User,
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
    commenters: User[],
    post: BlogPost,
    count: number,
    useVietnamese = true,
  ): Comment[] {
    return Array.from({ length: count }, () => {
      const randomCommenter = commenters[Math.floor(Math.random() * commenters.length)];
      return this.createPostComment(randomCommenter, post, {}, useVietnamese);
    });
  }

  static createChildCommentBatch(
    users: User[],
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
