import typeAnnotationContainer from './typePropertyAnnotationContainer';

export function FetchFromRemoteService<T, U>(
  remoteServiceUrl: string,
  remoteServiceCallArgumentBuilder: (arg: T, response: U) => { [key: string]: any }
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, propertyName: string) {
    typeAnnotationContainer.setTypePropertyAsFetchedFromRemoteService(
      object.constructor,
      propertyName,
      remoteServiceUrl,
      remoteServiceCallArgumentBuilder
    );
  };
}
