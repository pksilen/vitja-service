import MongoDbManager from "../backk/dbmanager/MongoDbManager";

const MONGO_DB_URI = 'mongodb+srv://admin:admin@vitja-tjdze.mongodb.net/test?retryWrites=true&w=majority';
export const mongoDbManager = new MongoDbManager(MONGO_DB_URI, 'vitja');
