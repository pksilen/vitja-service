# Vitja service

TODO:
- Improve @Index annotation (ASC/DESC, INCLUDE, NULLS FIRST/LAST, WHERE, WITH)
- By default following fields are Hashed (and salted), or use @NotHashed annotation
    - password
- By default following fields are encrypted, or use @NotEncrypted annotation
- @Encrypted annotation
- Give an error, if numeric field is of type number, because it cannot be encrypted
    - Protected Health Information (PHI)
    - Address
    - Last Name, First Name, Full Name
    - Phone number
    - Email
    - Account number
    - Credit Card
    - CVC
    - Drivers license
    - Passport
    - Social security
    - Birth Date
    - City
    - State
    - Post(al) code
    - zip code
    - Country
    - Gender
    - Race
    - Age
    - Job title/position/description
    - Workplace
    - Company
    - Geo position/location
    - latitude/longitude
    
- Move order delivery status, trackingUrl and deliveredTimestamp to shopping cart item
- Order should have OrderItem array, order item should have one Delivery item as child
- Possible to delete shopping cart item from order if it is not yet delivered
- Prometheus metrics (Opentelemetry)
- Jaeger tracing (Opentelemetry)
- Logger
- GDPR logging
  -audit log should go to separate server
- MariaDb/MySql
- @ManyToMany
 - Own remote service function executor (Http)
     - call('http://app-service-dns-name/serviceName.functionName', inputArgObj)
     - env variable USE_FAKE_REMOTE_SERVICES_IN_TESTS (default true)
- Custom readinessProbe should use defaultReadinessProbe plus all other services it is using
- executeMultipleInParallel endpoint, to execute multiple serviceCalls in parallel
- Handle order modification and delete to reflect in salesItem states
- getDbManager support for multiple dbmanagers
- Date/Timestamp type support
- Null value support for fields (createOrder: trackingUrl ja deliveredTime nulls)
  - in setPropertyTypeValidationDecorators, check if ends with | null (after checking if is array)
  - Use @ValidateIf(o => o.propertyName !== null)
  - Add | null also to type's metadata
  - if type metadata does not have | null after array checking, make SQL field NOT NULL
  - All array checking must be changed because type name ending can be  | null instead of []
- Support dynamic filters with Map-type argument property
  filters: Filter[]
   Filter : { fieldName: string, operator?: '>=' | '<=' | '!=' ..., value: any }
   -assert fieldName is a legal column name
   creates SQL WHERE fragment 'fieldName >= :fieldName', e.g. quantity >= :quantity
- Mongodb transactions, update/delete preconditions
- Unit testaa: shouldIncludeField eri keissit

TODO NEXT RELEASE:
- Response headers added Api gateway:
  - X-content-type-options: nosniff
  - Strict-Transport-Security: max-age 
- SQL Server
- Oracle
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
    - Put analytics query inside its service and enabled for 'management' role for use
- ExpectInTestsToMatch annotation to include support for import libraries like lodash or moment
- Add Avro schema generation and content type support (avro-js)
- IsExprTrue annotation should be documented in servicemetadata with the function, so that frontend can use same functiongit 
- Backk-frontend automatically create a frontend for one or more backends
  - backend metadata fetch urls are given in env variable as parameter
