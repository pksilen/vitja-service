# Vitja service

TODO
- In getClassPropertyNameToTypeNameMap, validate Class name and property names to regexp _,a-zA-z0-9
- In Postman API sample responses, readonly fields should be included, private fields not
- db operations where filters, allow Partial<T>
- Duplicate entity error in createEntity
- Add entity NOT_FOUND backk error
- Add invalid_argument backk error
- shouldAllowAdditionOrRemoval = 'none'
- ETags for mongoDB: updateEntity/entities, add/removeSubEntities
- shouldInitializeDb SQL
  - backk taulun nimi: backk_db_initialization: columns: @Unique appVersion, isInitialized
  - tsekkaa voiko lisätä uuden rivin app_version = process.env.npm_package_version
  - when init is ok update isInitialized to true

  
- remove defaultPaymentMethod, replace with isDefault attribute and return user sortedby that
  - test in IsExprTrue annotation that only one paymentmethod can have isDefault true
- Make favoritesalesItemIds a many-to-many map to FavoriteSalesItem[] which is reference to SalesItem
- Rename createOrder to placeOrder
  - placeOrder should has gateway as input arg and create order with paymentinfo: null, then response:
    HTTP/1.1 301 Moved Permanently
    Location: https://payment-gateway/...?successUrl=https://backk-dynamic-frontend/?=backk=OrdersService.payOrder?orderId=xxxx&failureUrl=https://backk-dynamic-frontend/?=backk=discardOrder&orderId=xxx
    paymentGateway adds query params to successUrl to indicate transactionId and amount
    payOrder updates order with paymentinfo: transactionId and amount
    discardOrder removes order by id
    -Create CronJob to remove unpaid orders at intervals
  - remote payment operation could have a url parameter for testing to return fake paymentInfo

- Split to multiple microservices
  - Implement subentities as remote service queries
- Node project for Backk: https://github.com/jsynowiec/node-typescript-boilerplate
- Starter projects:
   http-kubernetes-mysql,
   http-kubernetes-postgresql
   http-kubernetes-mongodb
   kafka-kubernetes-mysql...
   redis-kubernetes-mysql...
- Create backk-client library
  -Sets ETag automatically and removes readonly properties


https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
Split services to different microservices
- Create notification-service
    - Sales item cron job: send email at 16:00 if sales item is going to be removed
- Remote Http service integration tests:
  - COnfigure @Before tasks: eg. Order service tests should first do following:
    -initialize Sales item service with integration_uuid, creates a new temp database for test usage
    -create a sample sales item
    -execute Order service tests
    -@After task: remote Sales item temp database is destroyed
- Kafka sendTo integration tests, create topic name with uuid postfix, use that and delete topic at end of testing
- Redis sendTo integeration tests, create db/topic name with uuid postfix, use that and delete topic at end of testing
- mysql2 distributed tracing
- Default loginService, signUpService, passwordReset service
    - Login route, check Referer header exists and domain ending is correct, eg. https://<something>.domain.com
    - User, add role field, joka voi olla createUserissa vain "user"
    - userName should be capitalized when comparing existence
    - userName should checked first that it does not exist (case-insensitive)
    - loginService hook to perform eg. account validation email sending
    - 2-factor authentication, browser fingerprinting
- Optimoi sivutus, jos order by:tä ei ole annettu ja default order by on by _id:
    https://en.wikipedia.org/wiki/Select_(SQL)#Method_with_filter_(it_is_more_sophisticated_but_necessary_for_very_big_dataset)
- Support for analytics aggregated queries, aggregations (function name, fieldname), group by, filters
    - Put analytics query inside its service and enabled for 'management' role for u
- Add Avro schema generation and content type support (avro-js)

- Backk-frontend automatically create a frontend for one or more backends
  - backend metadata fetch urls are given in env variable as parameter

Release 3:
- Create opentelemetry kafkajs plugin
- Create opentelemetry mysql2 plugin
- gRPC support (convert using protobufjs toObject)
  - generate typescript classes from .proto IDL files
- Add support for POstgreSql/MySql CHECK and DEFAULT, GENERATED ALWAYS AS column constraint in CREATE TABLE
- For javascript CEP: http://alasql.org/
  - Read a kafka consumer batch and put in in-memory table and perform sql and
    update in memory hash table for values and every 1 minute put data to cassandra
    
-https://hasura.io/
