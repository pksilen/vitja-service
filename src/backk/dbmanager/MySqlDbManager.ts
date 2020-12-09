import mysql, { Pool } from 'mysql2/promise';
import AbstractSqlDbManager from "./AbstractSqlDbManager";

export default class MySqlDbManager extends AbstractSqlDbManager {
  private pool: Pool;

  constructor(
    private readonly host: string,
    private readonly user: string,
    private readonly password: string,
    database: string
  ) {
    super(database);

    this.pool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  getDbManagerType(): string {
    return 'MySQL';
  }

  getDbHost(): string {
    return this.host;
  }

  getPool(): any {
    return this.pool;
  }

  getConnection(): Promise<any> {
    return mysql.createConnection({
      host: this.host,
      user: this.user,
      password: this.password,
      database: this.schema
    });
  }

  getIdColumnType(): string {
    return 'BIGINT AUTO_INCREMENT PRIMARY KEY'
  }
}
