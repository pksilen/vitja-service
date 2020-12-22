import ResponseCacheConfigService from '../../backk/cache/ResponseCacheConfigService';

export default class ResponseCacheConfigServiceImpl implements ResponseCacheConfigService {
  getCachingDurationInSecs(serviceFunctionName: string, serviceFunctionArgument: any): number {
    return 60;
  }

  shouldCacheServiceFunctionCallResponse(serviceFunctionName: string, serviceFunctionArgument: any): boolean {
    if (
      serviceFunctionName === 'salesItemsService.getSalesItems' &&
      serviceFunctionArgument.pageNumber <= 3 &&
      serviceFunctionArgument.pageSize === 50
    ) {
      return true;
    }

    return false;
  }
}
