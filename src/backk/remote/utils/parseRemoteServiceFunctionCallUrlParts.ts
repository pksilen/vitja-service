export default function parseRemoteServiceFunctionCallUrlParts(remoteServiceUrl: string) {
  const scheme = remoteServiceUrl.slice(0, 5);
  let broker, topic, db, serviceFunction;

  if (scheme === 'kafka') {
    [broker, topic, serviceFunction] = remoteServiceUrl.slice(8).split('/');
  } else if (scheme === 'redis') {
    [broker, db, topic, serviceFunction] = remoteServiceUrl.slice(8).split('/')
    broker = broker + '/' + db;
  } else {
    throw new Error('Only schemes kafka and redis are supported')
  }

  if (!broker || broker === 'undefined') {
    throw new Error ('Remote server not defined in remote service url: ' + remoteServiceUrl)
  } else if(!topic || topic === 'undefined') {
    throw new Error ('Service name not defined in remote service url: ' + remoteServiceUrl);
  } else if (!serviceFunction || serviceFunction === 'undefined') {
    throw new Error('Service function not defined in remote service url: ' +remoteServiceUrl);
  }

  return { scheme, broker, topic, serviceFunction };
}
