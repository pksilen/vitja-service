import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { IsArray, IsString } from 'class-validator';

export function getSourceFileName(fileName: string, distFolderName = 'dist'): string {
  return fileName.replace(distFolderName, 'src');
}

export class IdWrapper {
  @IsString()
  _id!: string;
}

export class IdsWrapper {
  @IsString({ each: true })
  @IsArray()
  _ids!: string[];
}

export type ErrorResponse = {
  statusCode: number;
  message: string;
};

export interface Projectable {
  includeResponseFields?: string[];
  excludeResponseFields?: string[];
}

export interface PostQueryOperations {
  includeResponseFields?: string[];
  excludeResponseFields?: string[];
  sortBy?: string;
  sortDirection: 'ASC' | 'DESC';
  pageNumber: number;
  pageSize: number;
}

export function transformResponse<T extends object>(
  responseObjects: T[],
  args: PostQueryOperations
): Array<Partial<T>> {
  return responseObjects.map((responseObject) => {
    let newResponseObject: Partial<T> = responseObject;
    if (args.includeResponseFields) {
      newResponseObject = pick(responseObject, args.includeResponseFields);
    }
    if (args.excludeResponseFields) {
      newResponseObject = omit(newResponseObject, args.excludeResponseFields);
    }
    return newResponseObject;
  });
}

function getIncludeFieldsMap(includeResponseFields?: string[]): object {
  return includeResponseFields
    ? includeResponseFields.reduce(
        (includeFieldsMap: object, includeResponseField: string) => ({
          ...includeFieldsMap,
          [includeResponseField]: 1
        }),
        {}
      )
    : {};
}

function getExcludeFieldsMap(excludeResponseFields?: string[]): object {
  return excludeResponseFields
    ? excludeResponseFields.reduce(
        (excludeFieldsMap: object, excludeResponseField: string) => ({
          ...excludeFieldsMap,
          [excludeResponseField]: 0
        }),
        {}
      )
    : {};
}

export function getMongoDbProjection(args: Projectable): object {
  const includeFieldsMap = getIncludeFieldsMap(args.includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(args.excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
