import { ErrorResponse } from '../../types/ErrorResponse';
import createErrorResponseFromError from '../../errors/createErrorResponseFromError';
import isErrorResponse from '../../errors/isErrorResponse';
import call from '../http/call';
import sendTo from '../messagequeue/sendTo';

export default async function executeInsideRemoteTransaction<T>(
  remoteServiceFunctionCallUrl: string,
  executable: () => Promise<T | ErrorResponse>
): Promise<T | ErrorResponse> {
  if (!remoteServiceFunctionCallUrl.endsWith('TransactionService')) {
    throw new Error('remote service function call url must end with TransactionService');
  }
  const isSyncCall = remoteServiceFunctionCallUrl.startsWith('https://');

  let possibleErrorResponse: ErrorResponse | void;
  const startTransactionUrl = remoteServiceFunctionCallUrl + '.' + 'beginTransaction';
  if (isSyncCall) {
    possibleErrorResponse = await call<void>(startTransactionUrl, {});
  } else {
    possibleErrorResponse = await sendTo(startTransactionUrl, {});
  }

  if (possibleErrorResponse) {
    return possibleErrorResponse;
  }

  const result = await executable();

  if (isErrorResponse(result)) {
    const rollbackTransactionUrl = remoteServiceFunctionCallUrl + '.' + 'rollbackTransaction';
    if (isSyncCall) {
      await call<void>(rollbackTransactionUrl, {});
    } else {
      await sendTo(rollbackTransactionUrl, {});
    }
  } else {
    const commitTransactionUrl = remoteServiceFunctionCallUrl + '.' + 'commitTransaction';
    if (isSyncCall) {
      await call<void>(commitTransactionUrl, {});
    } else {
      await sendTo(commitTransactionUrl, {});
    }
  }

  return result;
}
