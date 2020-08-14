# Vitja service

TODO:
- For number fields, it must have @Min and @Max annotations
- For Min and Max, assert max >= min
- For string fields, it must have @MaxLength annotation 
- Handle exclude response fields in getProjection and createResultMaps
-Testaa että JSON response eka objecti validoituu funktion paluu tyyppiin
-Create functions should havegit s captcha_token in input arg or @NoCaptcha annotation, captchaChecker is used to validate request
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
- Enable sql statement logging for TRACE level only

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
    
- MariaDb/MySql
- SQL Server
- Oracle
    
TODO NEXT RELEASE:
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
