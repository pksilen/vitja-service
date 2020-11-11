# Vitja service

TODO:
- redis request cache for getting multiple entities
  - cache error logging
  - cache metrics
- Support kubernetes namespace to additionally identify topic
  - Kafka consumer/sendTo
  - Redis consumer/sendTo
- Support Redis/Kafka consumer to send successful response to another service
  - Kafka
  - Redis
- GDPR logging
  -audit log should go to separate server
  - methods that use userName or userId
  - userService methods
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
   - getEntitiesByFilter, updateEntitiesByFilter, deleteEntitiesByFilter
- allow paging for sub entities, by limiting query within an id range
- @ManyToMany
- MariaDb/MySql
- Mongodb transactions, update/delete preconditions, encyprt/decrypt, filters, null value, manytoMany
  - UpdateItem pitää hakea itemi ja käydä koko itemi puu läpi ja poistaa subitem lisäysyrityksett.
    - Tämän jälkeen kun lisäysyrittykset on poistettu, voidaan databasesta haettuun itemiin mergetä update itemi.
  - Update default prometheus metrics
- Add boolean field to entity to test it
- New entities: User has Friends, Posts, show posts from friends
  - GetEntitiesByIn: get Posts where userId in User's friendIds
- Unit testaa: shouldIncludeField eri keissit
- Create opentelemetry kafkajs plugin

TODO NEXT RELEASE:
- getDbManager support for multiple dbmanagers
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
- For javascript CEP: http://alasql.org/
- IsExprTrue annotation should be documented in servicemetadata with the function, so that frontend can use same functiongit 
- Backk-frontend automatically create a frontend for one or more backends
  - backend metadata fetch urls are given in env variable as parameter
