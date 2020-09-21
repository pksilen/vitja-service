import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export function getSourceFileName(fileName: string, distFolderName = 'dist'): string {
  return fileName.replace(distFolderName, 'src');
}

export class IdWrapper {
  @IsString()
  @MaxLength(24)
  _id!: string;
}

export class OptionalPostQueryOperations implements Partial<Paging>, Partial<Sorting>, OptionalProjection {
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(1024, { each: true})
  @IsArray()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @IsString({ each: true })
  @MaxLength(1024, { each: true})
  @IsArray()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  pageNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  pageSize?: number;

  @IsOptional()
  @MaxLength(512)
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';
}

export class IdsAndOptionalPostQueryOperations extends OptionalPostQueryOperations{
  @IsString({ each: true })
  @MaxLength(24, { each: true})
  @IsArray()
  _ids!: string[];
}

export type ErrorResponse = {
  statusCode: number;
  errorMessage: string;
  stackTrace?: string;
};

export interface OptionalProjection {
  includeResponseFields?: string[];
  excludeResponseFields?: string[];
}

export interface Paging {
  pageNumber: number;
  pageSize: number;
}

export interface Sorting {
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface PostQueryOperations extends OptionalProjection, Sorting, Paging {
}

export interface PostQueryOperations extends OptionalProjection, Sorting, Paging {
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

export function getMongoDbProjection(args: OptionalProjection): object {
  const includeFieldsMap = getIncludeFieldsMap(args.includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(args.excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
