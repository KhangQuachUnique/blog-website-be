import { ChildEntity, Column } from 'typeorm';

import { Block } from './block.entity';

@ChildEntity('image')
export class ImageBlock extends Block {
  @Column({ type: 'varchar', length: 255 })
  imageUrl: string;
}
