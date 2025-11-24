import { ChildEntity, ManyToOne } from 'typeorm';

import { Comment } from './comment.entity';
import { Block } from 'src/blocks/entities/block.entity';

@ChildEntity('block')
export class BlockComment extends Comment {
  @ManyToOne(() => Block, (block) => block.comments)
  block: Block;
}
