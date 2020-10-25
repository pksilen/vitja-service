import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import typeAnnotationContainer from "../../../../decorators/typeproperty/typePropertyAnnotationContainer";
import AbstractDbManager, { Field } from "../../../AbstractDbManager";
import getEnumSqlColumnType from "./utils/getEnumSqlColumnType";
import getSqlColumnType from "./utils/getSqlColumnType";
import setSubEntityInfo from "./utils/setSubEntityInfo";
import createAdditionalTable from "./utils/createAdditionalTable";
import addJoinSpec from "./utils/addJoinSpec";
import getTypeMetadata from "../../../../metadata/getTypeMetadata";

export default async function alterTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined,
  databaseFields: Field[]
) {
  const entityMetadata = getTypeMetadata(entityClass as any);
  await forEachAsyncParallel(
    Object.entries(entityMetadata),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      const doesFieldExistInDatabase = !!databaseFields.find(
        (field) => field.name.toLowerCase() === fieldName.toLowerCase()
      );

      if (!doesFieldExistInDatabase) {
        let alterTableStatement = `ALTER TABLE ${schema}.${entityName} ADD `;
        let baseFieldTypeName = fieldTypeName;
        let isArray = false;
        let sqlColumnType: string;

        if (fieldTypeName.endsWith('[]')) {
          baseFieldTypeName = fieldTypeName.slice(0, -2);
          isArray = true;
        }

        sqlColumnType = getSqlColumnType(fieldName, baseFieldTypeName);

        if (!sqlColumnType && baseFieldTypeName[0] === '(') {
          sqlColumnType = getEnumSqlColumnType(baseFieldTypeName, sqlColumnType);
        }

        if (baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
          setSubEntityInfo(entityName, baseFieldTypeName);
        } else if (isArray) {
          const idFieldName = await createAdditionalTable(
            schema,
            entityName,
            fieldName,
            sqlColumnType,
            dbManager
          );

          addJoinSpec(entityName, fieldName, idFieldName);
        } else {
          const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
          alterTableStatement += fieldName + ' ' + sqlColumnType + (isUnique ? ' UNIQUE' : '');
          await dbManager.tryExecuteSqlWithoutCls(alterTableStatement);
        }
      }
    }
  );
}
