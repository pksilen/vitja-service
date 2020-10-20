import { IsArray, IsIn, IsInstance, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import omit from 'lodash/omit';
import pick from 'lodash/pick';

export type RecursivePartial<T> = {
  [P in keyof T]?:
  T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
      T[P];
};

export const MAX_INT_VALUE = 2147483647;

export function getSourceFileName(fileName: string, distFolderName = 'dist'): string {
  return fileName.replace(distFolderName, 'src');
}

export class Id {
  @IsString()
  @MaxLength(24)
  _id!: string;
}

export class IdAndUserId extends Id {
  @IsString()
  @MaxLength(24)
  userId!: string;
}

export interface Captcha {
  captchaToken: string;
}

export class SortBy implements ISortBy {
  constructor(sortField: string, sortDirection: 'ASC' | 'DESC') {
    this.sortField = sortField;
    this.sortDirection = sortDirection;
  }

  @MaxLength(512)
  @IsString()
  sortField!: string;

  @IsIn(['ASC', 'DESC'])
  sortDirection!: 'ASC' | 'DESC';
}

export class OptPostQueryOps implements Partial<Paging>, OptionalProjection {
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
  @IsArray()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
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
  @IsInstance(SortBy, { each: true })
  @IsArray()
  sortBys?: SortBy[];
}

export class IdsAndOptPostQueryOps extends OptPostQueryOps {
  @IsString({ each: true })
  @MaxLength(24, { each: true })
  @IsArray()
  _ids!: string[];
}

export const errorResponseSymbol = Symbol();

export type ErrorResponse = {
  [errorResponseSymbol]: true,
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

export interface ISortBy {
  sortField: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface PostQueryOps extends OptionalProjection, Paging {
  sortBys: ISortBy[];
}

export function transformResponse<T extends object>(
  responseObjects: T[],
  args: PostQueryOps
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
  // TODO handle nested projection
  const includeFieldsMap = getIncludeFieldsMap(args.includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(args.excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
