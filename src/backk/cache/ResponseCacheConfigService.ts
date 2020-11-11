export default abstract class ResponseCacheConfigService {
  abstract getRedisUrl(): string;
  abstract shouldCacheServiceFunctionCallResponse(serviceFunction: string, serviceFunctionArgument: object): boolean
  abstract getCachingDurationInSecs(serviceFunction: string): number;
}
