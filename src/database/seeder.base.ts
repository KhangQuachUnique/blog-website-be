import { DataSource } from 'typeorm';

export abstract class Seeder {
  constructor(protected dataSource: DataSource) {}

  abstract run(): Promise<void>;

  protected async clear(entityName: string): Promise<void> {
    const repository = this.dataSource.getRepository(entityName);
    await repository.clear();
    console.log(`✓ Cleared ${entityName}`);
  }

  protected log(message: string): void {
    console.log(`  ${message}`);
  }

  protected success(message: string): void {
    console.log(`✓ ${message}`);
  }

  protected error(message: string, error?: unknown): void {
    const errMsg = error && typeof error === 'object' && 'message' in (error as any) ? (error as any).message : String(error ?? '');
    console.error(`✗ ${message}`, errMsg);
  }
}
