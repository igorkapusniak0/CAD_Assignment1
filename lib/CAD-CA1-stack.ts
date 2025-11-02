import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { movies, movieCasts, actors, awards } from "../seed/movies";
import * as apig from "aws-cdk-lib/aws-apigateway";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const CAD_CA1_Table = new dynamodb.Table(this, "AppTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "CAD-CA1",
    });

    CAD_CA1_Table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
    });

    
    
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: CAD_CA1_Table.tableName,
          REGION: cdk.Aws.REGION,
        },
      }
    );

    const getMovieActorsFn = new lambdanode.NodejsFunction(
      this,
      "getMovieActorsFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieActors.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: CAD_CA1_Table.tableName,
          REGION: cdk.Aws.REGION,
        },
      }
    );

    const getMovieCastMemberFn = new lambdanode.NodejsFunction(
      this,
      "getMovieCastMemberFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: CAD_CA1_Table.tableName,
          REGION: cdk.Aws.REGION,
        },
      }
    );

    const getAwardFn = new lambdanode.NodejsFunction(
      this,
      "getAwardFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getAward.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: CAD_CA1_Table.tableName,
          REGION: cdk.Aws.REGION,
        },
      }
    );


    const addMovieFn = new lambdanode.NodejsFunction(
      this,
      "addMovieFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/addMovie.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: CAD_CA1_Table.tableName,
          REGION: cdk.Aws.REGION,
        },
      }
    );
    
    const deleteMovieFn = new lambdanode.NodejsFunction(
      this,
      "deleteMovieFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/deleteMovie.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: CAD_CA1_Table.tableName,
          REGION: cdk.Aws.REGION,
        },
      }
    );


        
    new custom.AwsCustomResource(this, "ddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [CAD_CA1_Table.tableName]: generateBatch([
              ...movies,
              ...actors,
              ...movieCasts,
              ...awards,
            ]),
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

    const moviesEndpoint = api.root.addResource("movies");
    const movieEndpoint = moviesEndpoint.addResource("{movieId}");
    const actorsEndpoint = movieEndpoint.addResource("actors");
    const actorEndpoint = actorsEndpoint.addResource("{actorId}");
    const awardsEndpoint = api.root.addResource("awards")

    // Get Movie by Id
    movieEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieByIdFn, {proxy: true})
    );

    // Get All Actors for Movie
    actorsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieActorsFn, {proxy: true})
    );

    // Get Movie Cast Member by Actor Id
    actorEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieCastMemberFn, {proxy: true})
    );

    // Get Awards
    awardsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAwardFn, {proxy: true})
    );

    // Add Movie
    moviesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(addMovieFn, { proxy: true })
    );

    // Delete movie
    movieEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteMovieFn, {proxy: true})
    );

  


  }    
}
    