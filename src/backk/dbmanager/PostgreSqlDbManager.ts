import AbstractSqlDbManager from "./AbstractSqlDbManager";
import { Pool, types } from "pg";

export default class PostgreSqlDbManager extends AbstractSqlDbManager {
  private pool: Pool;

  constructor(
    private readonly host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    schema: string
  ) {
    super(schema);

    types.setTypeParser(20, 'text', parseInt);

    this.pool = new Pool({
      user,
      host,
      database,
      password,
      port
    });
  }

  getDbManagerType(): string {
    return 'PostgreSQL';
  }

  getDbHost(): string {
    return this.host;
  }

  getPool(): any {
    return this.pool;
  }

  getConnection(): Promise<any> {
    return this.pool.connect();
  }

  getIdColumnType(): string {
    return 'BIGSERIAL PRIMARY KEY'
  }

  getTimestampType(): string {
    return 'TIMESTAMPTZ';
  }

  getVarCharType(maxLength: number): string {
    return `VARCHAR(${maxLength})`;
  }
}
