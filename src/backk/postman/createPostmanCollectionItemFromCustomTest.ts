export default function createPostmanCollectionItemFromCustomTest({
  testTemplate: { testTemplateName, serviceFunctionName, argument, response }
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
        argument === undefined
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
        argument === undefined
          ? undefined
          : {
              mode: 'raw',
              raw: JSON.stringify(argument, null, 4),
              options: {
                raw: {
                  language: 'json'
                }
              }
            },
      url: {
        raw: 'http://localhost:3000/' + serviceFunctionName,
        protocol: 'http',
        host: ['localhost'],
        port: '3000',
        path: [serviceFunctionName]
      }
    },
    response: [],
    event: [
      {
        id: serviceFunctionName,
        listen: 'test',
        script: {
          id: serviceFunctionName,
          exec: [
            checkResponseCode,
            response.tests ? 'const body = pm.response.json();' : '',
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
