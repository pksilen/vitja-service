import ResponseCacheConfigService from '../../backk/cache/ResponseCacheConfigService';

export default class ResponseCacheConfigServiceImpl implements ResponseCacheConfigService {
  getCachingDurationInSecs(): number {
    return 60;
  }

  getRedisUrl(): string {
    return 'redis://localhost';
  }

  shouldCacheServiceFunctionCallResponse(serviceFunction: string, serviceFunctionArgument: any): boolean {
    /*if (
      serviceFunction === 'salesItemsService.getSalesItems' &&
      serviceFunctionArgument.pageNumber <= 3 &&
      serviceFunctionArgument.pageSize === 50
    ) {
      return true;
    }*/
    return false;
  }
}
