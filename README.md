## Assignment - Cloud App Development.

__Name:__ Igor Kapusniak
### Links.
__Demo:__ https://youtu.be/WDdO3BxQrxU

### Screenshots.

![Alt text](/images/Screenshot_20251111_195450.png)

![DynamoDB1](/images/new1.png)
![DynamoDB1](/images/new2.png)

![User_Logging](/images/Screenshot_20251112_093029.png)
![User_Logging](/images/Screenshot_20251112_093100.png)
![DynamoDB1](/images/new3.png)

### Design features (if required).

1. Custom L2 Construct: MovieApi encapsulates all movie related Lambda functions, API Gateway routes, authorizers, and state-change logging in a reusable construct.

2. Multi-Stack Architecture: Separated AuthStack, DatabaseStack, and MovieStack to allow for independent deployment.

3. Event Driven State Logging: stateChangeLoggerFn triggered by DynamoDB logs all database changes.

4. API Key Management: API Gateway used with API key for admin only POST and DELETE operations.

5. Custom Request Authorizer: Lambda based authorizer for securing GET requests using Cognito authentication.

6. Data Initialization: Uses AwsCustomResource to batch load seed data into DynamoDB at deployment.

7. Single-Table DynamoDB Design: All entities (movies, actors, casts, awards) stored in one table with prefixed partition keys and sort keys.

###  Extra (If relevant).

N/A

