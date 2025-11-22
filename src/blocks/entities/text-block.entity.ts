import { ChildEntity, Column } from 'typeorm';

import { Block } from './block.entity';

@ChildEntity('text')
export class TextBlock extends Block {
  @Column({ type: 'json' })
  text: string;
}
