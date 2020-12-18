# Vitja service

TODO
- Test cronJob and scheduleJob
- Watch and re-read log level from config map
- Allow one scheduleCronJob per function
- in transformRowsToObject, split processing to 1000 row chunks
- call remote service testing, find service function argument/return type from git submodule dir or monorepo dir
- Validate call argument against parsed Class. Generate return value sample arg.
- Mongodb transactions, update/delete preconditions, encyprt/decrypt, filters, null value, manytoMany
  - UpdateItem pitää hakea itemi ja käydä koko itemi puu läpi ja poistaa subitem lisäysyrityksett.
    - Tämän jälkeen kun lisäysyrittykset on poistettu, voidaan databasesta haettuun itemiin mergetä update itemi.
  - Update default prometheus metrics
- check if _id and id is consistently correctly used
- User has SalesItems and Orders subentities
- New entities: User has Followers (User-User manyToMany), show SalesItems from followers
  - Add FollowerService
    - create new user (followe)
    - follow(userId, userdId + 1)
- Unit testaa: shouldIncludeField eri keissit 
- Organize adding validation groups in separate method in correct order
- Organize checking missing validations in separate method
- Node project for Backk: https://github.com/jsynowiec/node-typescript-boilerplate
- Starter projects:
   http-kubernetes-mysql,
   http-kubernetes-postgresql
   http-kubernetes-mongodb
   kafka-kubernetes-mysql...
   redis-kubernetes-mysql...
- Split services to different microservices
  - Create notification-service
    - Sales item cron job: send email at 16:00 if sales item is going to be removed


TODO NEXT RELEASE:
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
