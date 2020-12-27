import AbstractSqlDbManager from './AbstractSqlDbManager';
import { Pool, types } from 'pg';
import { pg } from 'yesql';

export default class PostgreSqlDbManager extends AbstractSqlDbManager {
  cleanupTransaction(): void {
      throw new Error("Method not implemented.");
  }
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

  releaseConnection(connection?: any) {
    connection?.release();
  }

  getIdColumnType(): string {
    return 'BIGSERIAL PRIMARY KEY';
  }

  getTimestampType(): string {
    return 'TIMESTAMPTZ';
  }

  getVarCharType(maxLength: number): string {
    return `VARCHAR(${maxLength})`;
  }

  getResultRows(result: any): any[] {
    return result.rows;
  }

  getResultFields(result: any): any[] {
    return result.fields;
  }

  getValuePlaceholder(index: number): string {
    return `$${index}`;
  }

  getReturningIdClause(): string {
    return 'RETURNING _id';
  }

  getBeginTransactionStatement(): string {
    return 'BEGIN';
  }

  getInsertId(result: any): number {
    return result?.rows[0]?._id;
  }

  getIdColumnCastType(): string {
    return 'VARCHAR';
  }

  executeSql(connection: any, sqlStatement: string, values?: any[]): Promise<any> {
    return connection.query(sqlStatement, values);
  }

  executeSqlWithNamedPlaceholders(connection: any, sqlStatement: string, values: object): Promise<any> {
    return connection.query(pg(sqlStatement)(values));
  }
}
