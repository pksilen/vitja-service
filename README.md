# Vitja service

TODO
- On update private field must be undefined
- make default value for allowAdditionAndRemoval.. as []
- npm mysql2 for MariaDb/MySql
  - mysql distributed tracing
- Mongodb transactions, update/delete preconditions, encyprt/decrypt, filters, null value, manytoMany
  - UpdateItem pitää hakea itemi ja käydä koko itemi puu läpi ja poistaa subitem lisäysyrityksett.
    - Tämän jälkeen kun lisäysyrittykset on poistettu, voidaan databasesta haettuun itemiin mergetä update itemi.
  - Update default prometheus metrics
- check if _id and id is consistently correctly used
- User has SalesItems and Orders subentities
- Node project for Backk: https://github.com/jsynowiec/node-typescript-boilerplate

- New entities: User has Friends, Posts, show posts from friends
  - GetEntitiesByIn: get Posts where userId in User's friendIds
- Unit testaa: shouldIncludeField eri keissit

TODO NEXT RELEASE:
- remote service calls can have rollback action and commit action
  - Deletes can move stuff to shadow table and in commit clear from shadow table and do delete
- Add implementation for FOREIGN KEY REFERENCES in CREATE TABLE
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
