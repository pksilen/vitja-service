# Vitja service

TODO:
- Input arg must be object
- Return value arg can have only one OR type and it is ErrorResponse after the success type. 
    Return value type must be void, object or object[] or Array<object>
- PostQueryOperations: Projection, Sorting, Paging
- When returning response JSON and input parameter contains pageSize, ensure it is enforced
- For number fields, it must have @Min and @Max annotations
- For string fields, it must have @MaxLength annotation 
- Handle exclude response fields in getProjection and createResultMaps
-Testaa että JSON response eka objecti validoituu funktion paluu tyyppiin
-Create functions should have captcha_token in input arg or @NoCaptcha annotation, captchaChecker is used to validate request
-AnyRole/Role() annotation
-AnyUser/User(userFieldName) annotation
-UserOrRole('userName', 'admin')
-Give error when unknown service/function is called
- Liveness probe
- Readiness probe
- Prometheus metrics
- Correct includes('.') fields name, eg. in sort field name and includeResponseField, SqlInExpression
- include/exclude to support wildcards: property1.property2.*
- @ManyToMany
-Optimoi sivutus, jos order by:tä ei ole annettu:
 https://en.wikipedia.org/wiki/Select_(SQL)#Method_with_filter_(it_is_more_sophisticated_but_necessary_for_very_big_dataset)


- MariaDb/MySql
- SQL Server
- Oracle


- By default following fields are Hashed (and salted), or use @NotHashed annotation
    - password
- By default following fields are encrypted, or use @NotEncrypted annotation
- Give an error, if numeric field is of type number, because it cannot be encrypted
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
    
- In sql statement logging remove values part
    
TODO NEXT RELEASE:
- Service aggregation and composition
    - Parallel
    - In sequence
    - For loops, if clauses
    - remote service execution
