export default function createPostmanCollectionItemFromCustomTest({
  testTemplate: { testTemplateName, serviceName, functionName, functionArgument, response }
}: any) {
  const checkResponseCode = response.statusCode
    ? `pm.test("Status code is ${response.statusCode} OK", function () {
  pm.response.to.have.status(${response.statusCode});
});`
    : '';

  return {
    name: testTemplateName,
    request: {
      method: 'POST',
      header:
        functionArgument === undefined
          ? []
          : [
              {
                key: 'Content-Type',
                name: 'Content-Type',
                value: 'application/json',
                type: 'text'
              }
            ],
      body:
        functionArgument === undefined
          ? undefined
          : {
              mode: 'raw',
              raw: JSON.stringify(functionArgument, null, 4),
              options: {
                raw: {
                  language: 'json'
                }
              }
            },
      url: {
        raw: 'http://localhost:3000/' + serviceName + '.' + functionName,
        protocol: 'http',
        host: ['localhost'],
        port: '3000',
        path: [serviceName + '.' + functionName]
      }
    },
    response: [],
    event: [
      {
        id: serviceName + '.' + functionName,
        listen: 'test',
        script: {
          id: serviceName + '.' + functionName,
          exec: [
            checkResponseCode,
            response.tests ? 'const response = pm.response.json();' : '',
            ...(response.tests
              ? response.tests.map(
                  (test: string) =>
                    `pm.test("test", function () {
  ${test} 
})`
                )
              : [])
          ]
        }
      }
    ]
  };
}
