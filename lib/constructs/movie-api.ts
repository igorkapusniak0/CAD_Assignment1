import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../../shared/util";
import { movies, movieCasts, actors, awards } from "../../seed/movies";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

type MovieApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};

export class MovieApi extends Construct {
  constructor(scope: Construct, id: string, props: MovieApiProps) {
    super(scope, id);

    const CAD_CA1_Table = new dynamodb.Table(this, "AppTable", {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName: "CAD-CA1",
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });
  
    CAD_CA1_Table.addGlobalSecondaryIndex({
        indexName: "GSI1",
        partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      });

      

      const appCommonFnProps = {
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "handler",
        environment: {
          USER_POOL_ID: props.userPoolId,
          CLIENT_ID: props.userPoolClientId,
          TABLE_NAME: CAD_CA1_Table.tableName,
          REGION: cdk.Aws.REGION,
        },
      };
      
      const getMovieByIdFn = new lambdanode.NodejsFunction(
        this,
        "GetMovieByIdFn",
        {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/getMovieById.ts`,
        }
      );
  
      const getMovieActorsFn = new lambdanode.NodejsFunction(
        this,
        "getMovieActorsFn",
        {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/getMovieActors.ts`,
          
        }
      );
  
      const getMovieCastMemberFn = new lambdanode.NodejsFunction(
        this,
        "getMovieCastMemberFn",
        {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/getMovieCastMember.ts`,
          
        }
      );
  
      const getAwardFn = new lambdanode.NodejsFunction(
        this,
        "getAwardFn",
        {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/getAward.ts`,
        }
      );
  
  
      const addMovieFn = new lambdanode.NodejsFunction(
        this,
        "addMovieFn",
        {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/addMovie.ts`,
          
        }
      );
      
      const deleteMovieFn = new lambdanode.NodejsFunction(
        this,
        "deleteMovieFn",
        {
          ...appCommonFnProps,
          entry: `${__dirname}/../../lambdas/deleteMovie.ts`,
          
        }
      );
  
      const authorizerFn = new lambdanode.NodejsFunction(this, "AuthorizerFn", {
        ...appCommonFnProps,
        entry: "./lambdas/auth/authorizer.ts",
      });

      const stateChangeLoggerFn = new lambdanode.NodejsFunction(this, "StateChangeLoggerFn", {
        ...appCommonFnProps,
        entry: `${__dirname}/../../lambdas/stateChangeLogger.ts`,
      });
      
      
      
      
  
      const allItems = [...movies, ...actors, ...movieCasts, ...awards];
  
      const batchItems = generateBatch(allItems).filter(Boolean);
      if (batchItems.length === 0) {
      }
          
      new custom.AwsCustomResource(this, "ddbInitData", {
        onCreate: {
          service: "DynamoDB",
          action: "batchWriteItem",
          parameters: {
            RequestItems: {
              [CAD_CA1_Table.tableName]: batchItems,
            },
          },
          physicalResourceId: custom.PhysicalResourceId.of("ddbInitData"),
        },
        policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [CAD_CA1_Table.tableArn],
        }),
      });
          
          
      CAD_CA1_Table.grantReadData(getMovieByIdFn);
      CAD_CA1_Table.grantReadData(getMovieActorsFn);
      CAD_CA1_Table.grantReadData(getMovieCastMemberFn);
      CAD_CA1_Table.grantReadData(getAwardFn);
      CAD_CA1_Table.grantWriteData(addMovieFn);
      CAD_CA1_Table.grantWriteData(deleteMovieFn);
      CAD_CA1_Table.grantStreamRead(stateChangeLoggerFn);
  
          
      const api = new apig.RestApi(this, "RestAPI", {
        description: "demo api",
        deployOptions: {
          stageName: "dev",
        },
        defaultCorsPreflightOptions: {
          allowHeaders: ["Content-Type", "X-Amz-Date"],
          allowMethods: ["OPTIONS", "GET", "POST", "DELETE"],
          allowCredentials: true,
          allowOrigins: ["*"],
        },
      });

      const apiKey = api.addApiKey("AdminApiKey", {
        apiKeyName: "AdminApiKey",
        description: "Administrator API Key",
      });
      
      const plan = api.addUsagePlan("AdminUsagePlan", {
        name: "AdminPlan",
        apiStages: [{ stage: api.deploymentStage }],
        throttle: {
          rateLimit: 10,
          burstLimit: 2,
        },
      });
      
      plan.addApiKey(apiKey);

      new cdk.CfnOutput(this, "AdminApiKeyOutput", {
        value: apiKey.keyId,
      });
  
      const moviesEndpoint = api.root.addResource("movies");
      const movieEndpoint = moviesEndpoint.addResource("{movieId}");
      const actorsEndpoint = movieEndpoint.addResource("actors");
      const actorEndpoint = actorsEndpoint.addResource("{actorId}");
      const awardsEndpoint = api.root.addResource("awards")
  
      const requestAuthorizer = new apig.RequestAuthorizer(
        this,
        "RequestAuthorizer",
        {
          identitySources: [apig.IdentitySource.header("cookie")],
          handler: authorizerFn,
          resultsCacheTtl: cdk.Duration.minutes(0),
        }
      );
  
      // Get Movie by Id
      movieEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieByIdFn, {proxy: true}),
        {
            authorizer: requestAuthorizer,
            authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );
  
      // Get All Actors for Movie
      actorsEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieActorsFn, {proxy: true}),
        {
            authorizer: requestAuthorizer,
            authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );
  
      // Get Movie Cast Member by Actor Id
      actorEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieCastMemberFn, {proxy: true}),
        {
            authorizer: requestAuthorizer,
            authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );
  
      // Get Awards
      awardsEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getAwardFn, {proxy: true}),
        {
            authorizer: requestAuthorizer,
            authorizationType: apig.AuthorizationType.CUSTOM,
        }
      );
  
      // Add Movie
      moviesEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(addMovieFn, { proxy: true }),
        { apiKeyRequired: true }
      );
  
      // Delete movie
      movieEndpoint.addMethod(
        "DELETE",
        new apig.LambdaIntegration(deleteMovieFn, {proxy: true}),
        { apiKeyRequired: true }
      );
  
      stateChangeLoggerFn.addEventSource(
        new lambdaEventSources.DynamoEventSource(CAD_CA1_Table, {
          startingPosition: lambda.StartingPosition.TRIM_HORIZON,
          batchSize: 5,
          retryAttempts: 2,
        })
      );

    
  }
}
