import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import { JSONPath } from 'jsonpath-plus';
import { ErrorResponse } from '../../types/ErrorResponse';
import { PreHook } from './PreHook';
import createErrorMessageWithStatusCode from '../../errors/createErrorMessageWithStatusCode';
import isErrorResponse from '../../errors/isErrorResponse';
import { HttpStatusCodes } from '../../constants/constants';
import { PostHook } from './PostHook';
import { getNamespace } from "cls-hooked";

export default async function tryExecutePostHook(
  postHook: PostHook,
  responseOrErrorResponse?: any | ErrorResponse
) {
  if (
    typeof responseOrErrorResponse === 'object' &&
    'errorMessage' in responseOrErrorResponse &&
    isErrorResponse(responseOrErrorResponse)
  ) {
    throw responseOrErrorResponse;
  }

  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('isInsidePostHook', true);
  const hookCallResult = await postHook.expectSuccess();
  clsNamespace?.set('isInsidePostHook', false);

  if (typeof hookCallResult === 'object' && 'errorMessage' in hookCallResult) {
    throw hookCallResult;
  }
}
