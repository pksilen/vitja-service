# Vitja service

TODO:
- DTO mapping
- Correct includes('.') fields name, eg. in sort field name and includeResponseField
- All input parameters must extend from Paging
- PostQueryOperations: Projection, Sorting, Paging
- When returning response JSON and input parameter contains pageSize, ensure it is enforced
- For number fields, it must have @Min and @Max annotations
- For string fields, it must have @MaxLength annotation 
- Handle exclude response fields in getProjection and createResultMaps
- @ManyToMany

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
    
TODO NEXT RELEASE:
- Service aggregation and composition
    - Parallel
    - In sequence
    - For loops, if clauses
    - remote service execution
