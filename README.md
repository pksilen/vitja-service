# Vitja service

TODO
- Test mongodb cronjob and scheduled job
- Add where clause to join select statements (similar as ON)
- Sql filters: (SqlExpression | UserDefinedFilter)[]
- object type filter
- New entities: User has Followers (User-User manyToMany), show SalesItems from followers
  - User has FollowingUser subentity, which is same as User, but remove following related fields
  - FollowingUser is logical entity and physical entity is User
- Convert sql LIKE expr to mongodb RegExp
- Support graphql json for mongodb include/exclude responsefields
- Split to multiple microservices
  - Implement subentities as remote service queries
- Node project for Backk: https://github.com/jsynowiec/node-typescript-boilerplate
- Starter projects:
   http-kubernetes-mysql,
   http-kubernetes-postgresql
   http-kubernetes-mongodb
   kafka-kubernetes-mysql...
   redis-kubernetes-mysql...


TODO NEXT RELEASE:
Split services to different microservices
- Create notification-service
    - Sales item cron job: send email at 16:00 if sales item is going to be removed
- Test call()
  
- Remote Http service integration tests:
  - COnfigure @Before tasks: eg. Order service tests should first do following:
    -initialize Sales item service with integration_uuid, creates a new temp database for test usage
    -create a sample sales item
    -execute Order service tests
    -@After task: remote Sales item temp database is destroyed
- Kafka sendTo integration tests, create topic name with uuid postfix, use that and delete topic at end of testing
- Redis sendTo integeration tests, create db/topic name with uuid postfix, use that and delete topic at end of testing
- mysql2 distributed tracing
- remote service calls can have rollback action and commit action
  - Deletes can move stuff to shadow table and in commit clear from shadow table and do delete
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
