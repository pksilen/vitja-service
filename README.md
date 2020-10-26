# Vitja service

TODO:
- Must have maxLength or Length decorator
- @Private entity fields which cannot be queried (or included in includeResponseFields)
  - Use existing Private decorator, 'password' is private
- UpdateUser precondition userName is userName
- UpdateUser give previous password
- Generoi default _id/id order by clauset getItemXXX functiohin
- Testaa response rows objectki onko vain yksi subitemi ja pelkkiä nulleja subItemissä => empty subitem array
- All multiple getXX functions should require mandatory PostQueryOperations interface type param
  - Create DefaultPagingAndSorting class which Args can extend
  - page: 1, pageCount: 50, order by _id ASC
- Change Shopping cart: remove updateShopping cart and replace with add/remove to/from shopping cart, precondition for adding, salesitem is forSale.
- Testaa eri orderitem state updated ja tsekkaa viimeisen jälkeen, että salesitem state = forSale
- createItem function can accept projection argument
- Possible to delete order if all of the orderitems are toBeDelivered, tarkista delete precondition jsonpath.query(item, 'orderItems[?(@.state != "toBeDelivered")]')
  -pre operation hooks to update salesitems to forSale
    hooks: { items: orderItems, hook: ({salesItemId}] => updateSalesItemStateTo(salesItemId, 'forSale')
- General pre/post operation hookit kaikki dbmanager functioihin, jos hook palauttaa false tai ErrorResponse, niin operaatio hylätään
  -Hookilla error message parametrii
- Change ExpectInTestsToMatch to use regular function
- In dbManager, rename createItem to createEntity etc.
- Make possible to disable metadata endpoint

- Prometheus metrics (Opentelemetry)
- Jaeger tracing (Opentelemetry)
- Logger
  - Logger.setLogPublisher, Logger.setAlarmPublisher
  - Triggeröidyt hälyt kirjoitetaan persistent volumelle
  - Type: 'Log' | 'Alarm trigger', 'Alarm cancel',
  - level: 'Error' | 'warn' | 'info' | 'debug'
  - source: { service: 'vitja', pod: 'vitja-fsfds-4335', 'host': 'control-01' }
  - timestampIso8601Utc
  - timeZoneIso8601
  - text
- GDPR logging
  -audit log should go to separate server
- Own remote service function executor (Http)
     - call('http://app-service-dns-name/serviceName.functionName', inputArgObj)
     - env variable USE_FAKE_REMOTE_SERVICES_IN_TESTS (default true)
- executeMultipleInParallel endpoint, to execute multiple serviceCalls in parallel
  - executionService.executeInParallel
- executeInSequence
  - executionService.executeInSequence
- getDbManager support for multiple dbmanagers
- Date/Timestamp type support
- Null value support for fields (createOrder: trackingUrl ja deliveredTime nulls)
  - in setPropertyTypeValidationDecorators, check if ends with | null (after checking if is array)
  - Use @ValidateIf(o => o.propertyName !== null)
  - Add | null also to type's metadata
  - if type metadata does not have | null after array checking, make SQL field NOT NULL
  - All array checking must be changed because type name ending can be  | null instead of []
  - Find all slice(0, -2) calls also
- Support dynamic filters with Map-type argument property
  filters: Filter[]
   Filter : { fieldName: string, operator?: '>=' | '<=' | '!=' ..., value: any }
   -assert fieldName is a legal column name
   creates SQL WHERE fragment 'fieldName >= :fieldName', e.g. quantity >= :quantity
- @ManyToMany
- Mongodb transactions, update/delete preconditions, encyprt/decrypt, filters, null value, manytoMany
  - UpdateItem pitää hakea itemi ja käydä koko itemi puu läpi ja poistaa subitem lisäysyrityksett.
    - Tämän jälkeen kun lisäysyrittykset on poistettu, voidaan databasesta haettuun itemiin mergetä update itemi.
- MariaDb/MySql
- ErrorResponse is a base class and different errors can extends from that
- Unit testaa: shouldIncludeField eri keissit

TODO NEXT RELEASE:
- Response headers added Api gateway:
  - X-content-type-options: nosniff
  - Strict-Transport-Security: max-age 
- SQL Server
- Oracle
- Add implementation for FOREIGN KEY REFERENCES in CREATE TABLE
- Add support for POstgreSql CHECK and DEFAULT, GENERATED ALWAYS AS column constraint in CREATE TABLE
- Default loginService, signUpService, passwordReset service
- Login route, check Referer header exists and domain ending is correct, eg. https://<something>.domain.com
- User, add role field, joka voi olla createUserissa vain "user"
- userName should be capitalized when comparing existence
- userName should checked first that it does not exist (case-insensitive)
- loginService hook to perform eg. account validation email sending
- Own remote service function executor (kafka)
    - send('kafka://kafka-service-dns-name/app-service-dns-name/serviceName.functionName', inputArgObj)
    - app-service-dns-name is a topic eg. 'my-service.my-namespace' and message key is serviceName.functionName and message body is argument
    - By default creates topic if not existing, if you want service to creates its own topics, 
      create a readiness probe that returns true when needed topics are available
- Optimoi sivutus, jos order by:tä ei ole annettu:
 https://en.wikipedia.org/wiki/Select_(SQL)#Method_with_filter_(it_is_more_sophisticated_but_necessary_for_very_big_dataset)
- Kafka service, create function(s) in Kafkacontroller for processing different topic(s)
- Support for analytics aggregated queries, aggregations (function name, fieldname), group by, filters
    - Put analytics query inside its service and enabled for 'management' role for u
- Add Avro schema generation and content type support (avro-js)
- IsExprTrue annotation should be documented in servicemetadata with the function, so that frontend can use same functiongit 
- Backk-frontend automatically create a frontend for one or more backends
  - backend metadata fetch urls are given in env variable as parameter
