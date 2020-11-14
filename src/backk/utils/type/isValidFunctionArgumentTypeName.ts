import { hasSrcFilenameForTypeName } from "../file/getSrcFilePathNameForTypeName";

export default function isValidFunctionArgumentTypeName(typeName: string): boolean {
  if (
    typeName === '_Id' ||
    typeName === 'Id' ||
    typeName === 'DefaultPostQueryOperationsArg' ||
    typeName === 'IdsAndDefaultPostQueryOperationsArg' ||
    typeName === 'SortBy' ||
    typeName === 'IdAndUserId'
  ) {
    return true;
  }
  return hasSrcFilenameForTypeName(typeName);
}
