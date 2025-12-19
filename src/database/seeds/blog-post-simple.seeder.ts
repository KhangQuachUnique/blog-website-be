import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';

export class BlogPostSimpleSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('BlogPostSimpleSeeder - temporarily disabled');
    return Promise.resolve();
  }
}