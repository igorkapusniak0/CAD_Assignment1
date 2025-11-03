import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient, jsonResponse } from "../shared/util";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const movieId = event?.pathParameters?.movieId;
    if (!movieId) return jsonResponse(400, { message: "Missing movieId" });

    const movieKey = `m#${movieId}`;

    const castCommand = new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": movieKey,
        ":prefix": "c#",
      },
    });

    const castResult = await ddbDocClient.send(castCommand);
    const castItems = castResult.Items || [];

    if (castItems.length === 0) {
      return jsonResponse(404, { message: `No actors found for movie ${movieId}` });
    }

    const actors = await Promise.all(
      castItems.map(async (cast) => {
        const actorId = cast.actorId;
        const actorKey = `a#${actorId}`;

        const getCommand = new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: { PK: actorKey, SK: actorKey },
        });

        const actorResult = await ddbDocClient.send(getCommand);
        return actorResult.Item;
      })
    );

    return jsonResponse(200, { data: actors });
  } catch (error: any) {
    console.error(error);
    return jsonResponse(500, { error: error.message || error });
  }
};