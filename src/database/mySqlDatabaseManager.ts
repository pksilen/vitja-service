import MySqlDbManager from '../backk/dbmanager/MySqlDbManager';

const MYSQL_HOST = 'localhost';
const MYSQL_USER = 'root';
const MYSQL_PASSWORD = 'password';
const MYSQL_DATABASE = 'public';

export const mySqlDbManager = new MySqlDbManager(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE);
