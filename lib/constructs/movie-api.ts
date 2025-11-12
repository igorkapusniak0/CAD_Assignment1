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
  table: dynamodb.Table;
};

export class MovieApi extends Construct {
  constructor(scope: Construct, id: string, props: MovieApiProps) {
    super(scope, id);

      const appCommonFnProps = {
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "handler",
        environment: {
          USER_POOL_ID: props.userPoolId,
          CLIENT_ID: props.userPoolClientId,
          TABLE_NAME: props.table.tableName,
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
              [props.table.tableName]: batchItems,
            },
          },
          physicalResourceId: custom.PhysicalResourceId.of("ddbInitData"),
        },
        policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [props.table.tableArn],
        }),
      });
          
          
      props.table.grantReadData(getMovieByIdFn);
      props.table.grantReadData(getMovieActorsFn);
      props.table.grantReadData(getMovieCastMemberFn);
      props.table.grantReadData(getAwardFn);
      props.table.grantWriteData(addMovieFn);
      props.table.grantWriteData(deleteMovieFn);
      props.table.grantStreamRead(stateChangeLoggerFn);
  
          
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
        new lambdaEventSources.DynamoEventSource(props.table, {
          startingPosition: lambda.StartingPosition.TRIM_HORIZON,
          batchSize: 5,
          retryAttempts: 2,
        })
      );

    
  }
}
