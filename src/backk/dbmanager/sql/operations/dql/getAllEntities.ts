import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { BackkError } from '../../../../types/BackkError';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createBackkErrorFromError from '../../../../errors/createBackkErrorFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';
import Pagination from '../../../../types/postqueryoperations/Pagination';
import getTableName from "../../../utils/getTableName";
import { PromiseOfErrorOr } from "../../../../types/PromiseOfErrorOr";

export default async function getAllEntities<T>(
  dbManager: AbstractSqlDbManager,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): PromiseOfErrorOr<T[]> {
  updateDbLocalTransactionCount(dbManager);

  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  const finalPostQueryOperations: PostQueryOperations = postQueryOperations ?? {
    ...new DefaultPostQueryOperations(),
    paginations: [new Pagination('', 1, Number.MAX_SAFE_INTEGER)]
  };

  try {
    const { columns, joinClauses, rootSortClause, outerSortClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      EntityClass
    );

    const tableName = getTableName(EntityClass.name);
    const tableAlias = dbManager.schema + '_' + EntityClass.name.toLowerCase();

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      rootSortClause,
      `) AS ${tableAlias}`,
      joinClauses,
      outerSortClause
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQuery(selectStatement);

    const entities = transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      finalPostQueryOperations,
      dbManager.getTypes()
    );

    return [entities, null];
  } catch (error) {
    return [null, createBackkErrorFromError(error)];
  }
}
