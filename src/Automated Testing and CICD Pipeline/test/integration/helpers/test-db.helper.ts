import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../src/modules/users/entities/user.entity';

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT, 10) || 5433,
  username: process.env.TEST_DB_USERNAME || 'test',
  password: process.env.TEST_DB_PASSWORD || 'test',
  database: process.env.TEST_DB_NAME || 'test_db',
  entities: [User],
  synchronize: true,
  dropSchema: true,
  logging: false,
};

export const setupTestDatabase = async () => {
  // Database setup logic for tests
  console.log('Setting up test database...');
};

export const teardownTestDatabase = async () => {
  // Database cleanup logic for tests
  console.log('Tearing down test database...');
};