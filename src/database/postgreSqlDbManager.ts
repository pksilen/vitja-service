import AbstractSqlDbManager from "../backk/dbmanager/PostgreSqlDbManager";

const POSTGRES_SCHEMA = 'public';
const POSTGRES_USER = 'postgres';
const POSTGRES_HOST = '127.0.0.1';
const POSTGRES_DATABASE = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const POSTGRES_PORT = 5432;

export const postgreSqlDbManager = new AbstractSqlDbManager(
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE,
  POSTGRES_SCHEMA
);
