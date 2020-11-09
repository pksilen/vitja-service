export default function parseRemoteServiceUrlParts(remoteServiceUrl: string) {
  const scheme = remoteServiceUrl.slice(0, 5);
  let broker, topic, db;

  if (scheme === 'kafka') {
    [broker, topic] = remoteServiceUrl.slice(8).split('/');
  } else if (scheme === 'redis') {
    [broker, db, topic] = remoteServiceUrl.slice(8).split('/')
    broker = broker + '/' + db;
  } else {
    throw new Error('Only schemes kafka and redis are supported')
  }

  return { scheme, broker, topic };
}
