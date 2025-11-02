import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient, jsonResponse } from "../shared/util";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["Movie"] || {});
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const body = event.body ? JSON.parse(event.body) : undefined;

    if (!body) {
      return jsonResponse(400, { message: "Missing request body" });
    }

    if (!isValidBodyParams(body)) {
      return jsonResponse(400, {
        message: `Incorrect type. Must match Movie schema`,
        schema: schema.definitions["Movie"],
      });
    }

    const movieId = body.movieId
    const item = {
      ...body,
      PK: `m#${movieId}`,
      SK: `m#${movieId}`,
      entityType: "Movie",
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
      })
    );

    return jsonResponse(201, { message: "Movie added", item });
  } catch (error: any) {
    console.error("Error adding movie:", error);
    return jsonResponse(500, { error: error.message || "Internal Server Error" });
  }
};


