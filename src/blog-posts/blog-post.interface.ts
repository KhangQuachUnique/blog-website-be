import { EVoteType } from 'src/user-votes/entities/user-vote.entity';

export interface GetVotesInterface {
  upvotes: number;
  downvotes: number;
  userVote: EVoteType.UPVOTE | EVoteType.DOWNVOTE | null;
}
