import getClassPropertyNameToPropertyTypeNameMap from '../metadata/getClassPropertyNameToPropertyTypeNameMap';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import typePropertyAnnotationContainer from '../decorators/typeproperty/typePropertyAnnotationContainer';
import callRemoteService from '../remote/http/callRemoteService';

export default async function fetchFromRemoteServices(
  Type: new () => any,
  serviceFunctionArgument: any,
  response: any,
  responsePath = ''
) {
  const typePropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(Type);

  try {
    await forEachAsyncParallel(Object.keys(typePropertyNameToPropertyTypeNameMap), async (propertyName) => {
      const remoteServiceFetchSpec = typePropertyAnnotationContainer.getTypePropertyRemoteServiceFetchSpec(
        Type,
        propertyName
      );

      if (remoteServiceFetchSpec) {
        const remoteServiceFunctionArgument = remoteServiceFetchSpec.buildRemoteServiceFunctionArgument(
          serviceFunctionArgument,
          response
        );

        const [remoteResponse, error] = await callRemoteService(
          remoteServiceFetchSpec.remoteServiceFunctionUrl,
          remoteServiceFunctionArgument,
          remoteServiceFetchSpec.options
        );

        if (error) {
          error.message = `${remoteServiceFetchSpec.remoteServiceFunctionUrl} failed: ${error.message}`;
          throw error;
        }

        response[responsePath + propertyName] = remoteResponse;
      }
    });
  } catch (error) {
    if (responsePath !== '') {
      throw error;
    }
  }
}
