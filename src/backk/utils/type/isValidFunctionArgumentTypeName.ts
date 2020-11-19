import { hasSrcFilenameForTypeName } from "../file/getSrcFilePathNameForTypeName";

export default function isValidFunctionArgumentTypeName(typeName: string): boolean {
  if (
    typeName === '_Id' ||
    typeName === 'Id' ||
    typeName === 'DefaultPostQueryOperations' ||
    typeName === 'IdsAndDefaultPostQueryOperations' ||
    typeName === 'SortBy' ||
    typeName === '_IdAndUserId'
  ) {
    return true;
  }
  return hasSrcFilenameForTypeName(typeName);
}
