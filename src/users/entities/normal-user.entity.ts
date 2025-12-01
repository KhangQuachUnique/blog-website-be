// import { ChildEntity, OneToMany } from 'typeorm';
// import { User } from './user.entity';
// import { CommunityMember } from 'src/communities/entities/community-member.entity';

// @ChildEntity('user')
// export class NormalUser extends User {
//   // Không được khai báo lại savedPostList / following / followers / ...
//   // TẤT CẢ các quan hệ đó đã có trong User

//   @OneToMany(() => CommunityMember, (cm) => cm.user)
//   communityMembers: CommunityMember[];
// }
