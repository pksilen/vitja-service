import { Pool } from 'pg';
import { HttpException, HttpStatus } from '@nestjs/common';

class PostgreSqlDbManager {
  pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  })

  async execute<T>(dbOperationFunction: (pool: Pool) => Promise<T>): Promise<T> {
    try {
      return await dbOperationFunction(this.pool);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

export default new PostgreSqlDbManager();
