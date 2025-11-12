import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createDDbDocClient, jsonResponse } from "../shared/util";
import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["AwardQueryParams"] || {}
);

const ddbDocClient = createDDbDocClient();
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
      const queryParams = event.queryStringParameters;
  
      if (!queryParams) {
        return jsonResponse(400, { message: "Missing query parameters" });
      }
  
      if (!isValidQueryParams(queryParams)) {
        return jsonResponse(400, {
          message: "Incorrect type. Must match Award query schema",
          schema: schema.definitions["AwardQueryParams"],
        });
      }
  
      const { movie, actor, awardBody } = queryParams;
  
      const results: any[] = [];
  
      if (movie) { 
        const movieCommandInput: QueryCommandInput = {
          TableName: process.env.TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          ExpressionAttributeValues: {
            ":pk": `m#${movie}`,
            ":skPrefix": "w#",
          },
        };
  
        const movieOutput = await ddbDocClient.send(new QueryCommand(movieCommandInput));
        results.push(...(movieOutput.Items || []));
      }
  
      if (actor && !movie) {
        const actorCommandInput: QueryCommandInput = {
          TableName: process.env.TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          ExpressionAttributeValues: {
            ":pk": `a#${actor}`,
            ":skPrefix": "w#",
          },
        };
        const actorOutput = await ddbDocClient.send(new QueryCommand(actorCommandInput));
        results.push(...(actorOutput.Items || []));
      }
  
      let filtered = results;
  
      if (actor && movie) {
        filtered = filtered.filter(
          (award) => award.actorId === actor && award.movieId === movie
        );
      }
  
      if (awardBody) {
        filtered = filtered.filter(
          (award) =>  award.category?.toLowerCase() === awardBody.toLowerCase()
        );
      }
  
      return jsonResponse(200, { data: filtered });
    } catch (error: any) {
      console.error(error);
      return jsonResponse(500, { error: error.message || "Internal server error" });
    }
  };
  