export default function parseServiceFunctionCallUrlParts(remoteServiceUrl: string) {
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

  return { scheme, broker, topic, serviceFunction };
}
