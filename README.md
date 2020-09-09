# Vitja service

TODO:
- For string fields, it must have @MaxLength annotation
- Save generateServiceMetadata for use in /metadata endpoint
- Give error when unknown service/function is called
- Liveness probe
- Readiness probe
- Error message when update fails due to not found
- OrderWithoutId state voi createssa olla vain yksi, mutta muuten joku 3:sta
- Add state to SalesItem: active, inactive, sold
- Constraint for creating entity based on filter and given max value
  - SalesItem can be created for same userName and state: active only 100 maxItemCount
- Handle exclude response fields in getProjection and createResultMaps
-Testaa että JSON response eka objecti validoituu funktion paluu tyyppiin
-Create functions should havegit s captcha_token in input arg or @NoCaptcha annotation, captchaChecker is used to validate request
-AnyRole/Role() annotation
-AnyUser/User(userFieldName) annotation
-UserOrRole('userName', 'admin')
- Prometheus metrics
- Correct includes('.') fields name, eg. in sort field name and includeResponseField, SqlInExpression
- include/exclude to support wildcards: property1.property2.*
- Enable sql statement logging for TRACE level only
- Enable Error response's stacktrace when TRACE level only
- Date/Timestamp type support
- @ManyToMany

- By default following fields are Hashed (and salted), or use @NotHashed annotation
    - password
- By default following fields are encrypted, or use @NotEncrypted annotation
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
    
- MariaDb/MySql
- SQL Server
- Oracle
- GDPR logging
  -audit log should go to separate server
- Login route, check Referer header exists and domain ending is correct, eg. https://<something>.domain.com
- Response headers added Api gateway:
  - X-content-type-options: nosniff
  - Strict-Transport-Security: max-age 
    
    
TODO NEXT RELEASE:
- Default loginService, signUpService, passwordReset service
- User, add role field, joka voi olla createUserissa vain "user"
- userName should be capitalized when comparing existence
- userName should checked first that it does not exist (case-insensitive)
- loginService hook to perform eg. account validation email sending
- Own remote service function executor (Http)
    - call('http://app-service-dns-name/serviceName.functionName', inputArgObj)
- Own remote service function executor (kafka)
    - send('kafka://kafka-service-dns-name/app-service-dns-name/serviceName.functionName', inputArgObj)
    - app-service-dns-name is a topic eg. 'my-service.my-namespace' and message key is serviceName.functionName and message body is argument
    - By default creates topic if not existing, if you want service to creates its own topics, 
      create a readiness probe that returns true when needed topics are available
- Optimoi sivutus, jos order by:tä ei ole annettu:
 https://en.wikipedia.org/wiki/Select_(SQL)#Method_with_filter_(it_is_more_sophisticated_but_necessary_for_very_big_dataset)
 
- Kafka service, create function(s) in Kafkacontroller for processing different topic(s)
