import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { MovieApi } from "./constructs/movie-api";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

interface MovieStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
  table: dynamodb.Table;
}

export class MovieStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MovieStackProps) {
    super(scope, id, props);

    new MovieApi(this, "MovieApi", {
      userPoolId: props.userPoolId,
      userPoolClientId: props.userPoolClientId,
      table: props.table
    });

  }
}
