import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { IsBoolean, IsString } from 'class-validator';

export class IdWrapper {
  @IsString()
  _id!: string;
}

export type ErrorResponse = {
  statusCode: number;
  message: string;
};

export interface Projectable {
  includeResponseFields?: string[];
  excludeResponseFields?: string[];
}

export default class Backk {
  static transformResponse<T extends object>(responseObjects: T[], args: Projectable): Array<Partial<T>> {
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

  static getIncludeFieldsMap(includeResponseFields?: string[]): object {
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

  static getExcludeFieldsMap(excludeResponseFields?: string[]): object {
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

  static getProjection(args: Projectable): object {
    const includeFieldsMap = Backk.getIncludeFieldsMap(args.includeResponseFields);
    const excludeFieldsMap = Backk.getExcludeFieldsMap(args.excludeResponseFields);
    return { ...includeFieldsMap, ...excludeFieldsMap };
  }
}
