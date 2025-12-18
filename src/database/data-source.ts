import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres.nhmlmwlvvrdabyikxvzo:kadfwfsfsvs@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
  database: 'postgres',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Auto-sync to create new ban columns
  logging: false,
});
