#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AuthStack } from "../lib/auth-stack";
import { MovieStack } from "../lib/movie-stack";
import { DatabaseStack } from "../lib/database-stack";

const app = new cdk.App();

const authStack = new AuthStack(app, "AuthStack", { env: { region: "eu-west-1" }});

const dbStack = new DatabaseStack(app, "DatabaseStack", { env: { region: "eu-west-1" }});

const movieStack = new MovieStack(app, "MovieStack", {
  userPoolId: authStack.userPoolId,
  userPoolClientId: authStack.userPoolClientId,
  table: dbStack.table,
  env: { region: "eu-west-1" }
});

movieStack.addDependency(authStack);
movieStack.addDependency(dbStack);
