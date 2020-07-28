import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { IsArray, IsInt, IsString, Max, Min } from "class-validator";

export function getSourceFileName(fileName: string, distFolderName = 'dist'): string {
  return fileName.replace(distFolderName, 'src');
}

export class IdWrapper {
  @IsString()
  _id!: string;
}

export class IdsAndPaging implements Paging {
  @IsString({ each: true })
  @IsArray()
  _ids!: string[];

  @IsInt()
  @Min(1)
  @Max(10000)
  pageNumber: number = 1;

  @IsInt()
  @Min(0)
  @Max(10000)
  pageSize: number = 50;
}

export type ErrorResponse = {
  statusCode: number;
  errorMessage: string;
  stackTrace?: string;
};

export interface Projection {
  includeResponseFields?: string[];
  excludeResponseFields?: string[];
}

export interface Paging {
  pageNumber: number;
  pageSize: number;
}

export interface Sorting {
  sortBy?: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface PostQueryOperations extends Projection, Sorting, Paging {
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

export function getMongoDbProjection(args: Projection): object {
  const includeFieldsMap = getIncludeFieldsMap(args.includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(args.excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
