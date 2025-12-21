import { EVoteType } from 'src/user-votes/entities/user-vote.entity';

export class VoteResponseDto {
  upvotes: number;
  downvotes: number;
  userVote: EVoteType | null;
}
