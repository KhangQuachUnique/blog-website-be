import { ChildEntity, JoinColumn, JoinTable, ManyToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Community } from 'src/communities/entities/community.entity';
import { SavedPostList } from 'src/saved-post-list/entities/saved-post-list.entity';

@ChildEntity('user')
export class NormalUser extends User {
  // Relations
  @ManyToMany(() => Community, (community) => community.members)
  @JoinTable()
  communities: Community[];

  @OneToOne(() => SavedPostList, (list) => list.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  savedPostList: SavedPostList;

  @ManyToMany(() => NormalUser, (user) => user.followers)
  @JoinTable({
    name: 'user_follows',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followingId',
      referencedColumnName: 'id',
    },
  })
  following: NormalUser[];

  @ManyToMany(() => NormalUser, (user) => user.following)
  followers: NormalUser[];

  @ManyToMany(() => NormalUser, (user) => user.blockedBy)
  @JoinTable({
    name: 'user_blocks',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'blockedUserId',
      referencedColumnName: 'id',
    },
  })
  blockedUsers: NormalUser[];

  @ManyToMany(() => NormalUser, (user) => user.blockedUsers)
  blockedBy: NormalUser[];
}
