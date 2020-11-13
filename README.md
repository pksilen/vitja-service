# Vitja service

TODO:
- Null value support for fields (createOrder: trackingUrl ja deliveredTime nulls)
  - if type metadata does not have | null after array checking, make SQL field NOT NULL
  - All array checking must be changed because type name ending can be  | null instead of []
  - Find all slice(0, -2) calls also
  - support (type | null)[]
- Support dynamic filters with Map-type argument property
  _filters in input argument
  filters: Filter[]
   Filter : { fieldName: string, operator?: '>=' | '<=' | '!=' ..., value: any }
   -assert fieldName is a legal column name
   creates SQL WHERE fragment 'fieldName >= :fieldName', e.g. quantity >= :quantity
   - getEntitiesByFilter, updateEntitiesByFilter, deleteEntitiesByFilter
- allow paging for sub entities using window functions
  paginations: [{ fieldName?: string, pageNumber, pageSize }]
- @ManyToMany
- npm mysql2 for MariaDb/MySql
- Mongodb transactions, update/delete preconditions, encyprt/decrypt, filters, null value, manytoMany
  - UpdateItem pitää hakea itemi ja käydä koko itemi puu läpi ja poistaa subitem lisäysyrityksett.
    - Tämän jälkeen kun lisäysyrittykset on poistettu, voidaan databasesta haettuun itemiin mergetä update itemi.
  - Update default prometheus metrics
- Add boolean field to entity to test it
- User has SalesItems and Orders subentities
- New entities: User has Friends, Posts, show posts from friends
  - GetEntitiesByIn: get Posts where userId in User's friendIds
- Unit testaa: shouldIncludeField eri keissit
- Response headers added:
  - X-content-type-options: nosniff
  - Strict-Transport-Security: max-age 
Node project for Backk: https://github.com/jsynowiec/node-typescript-boilerplate

TODO NEXT RELEASE:
- getDbManager support for multiple dbmanagers
- SQL Server
- Oracle
- Add implementation for FOREIGN KEY REFERENCES in CREATE TABLE
- Default loginService, signUpService, passwordReset service
    - Login route, check Referer header exists and domain ending is correct, eg. https://<something>.domain.com
    - User, add role field, joka voi olla createUserissa vain "user"
    - userName should be capitalized when comparing existence
    - userName should checked first that it does not exist (case-insensitive)
    - loginService hook to perform eg. account validation email sending
    - 2-factor authentication, browser fingerprinting
- Optimoi sivutus, jos order by:tä ei ole annettu:
    https://en.wikipedia.org/wiki/Select_(SQL)#Method_with_filter_(it_is_more_sophisticated_but_necessary_for_very_big_dataset)
- Support for analytics aggregated queries, aggregations (function name, fieldname), group by, filters
    - Put analytics query inside its service and enabled for 'management' role for u
- Add Avro schema generation and content type support (avro-js)
- For javascript CEP: http://alasql.org/
- Backk-frontend automatically create a frontend for one or more backends
  - backend metadata fetch urls are given in env variable as parameter

Release 3:
- Create opentelemetry kafkajs plugin
- Add support for POstgreSql CHECK and DEFAULT, GENERATED ALWAYS AS column constraint in CREATE TABLE
