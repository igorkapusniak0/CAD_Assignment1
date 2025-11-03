import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createDDbDocClient, jsonResponse } from "../shared/util";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const movieId = event?.pathParameters?.movieId;
    const actorId = event?.pathParameters?.actorId;

    if (!movieId) return jsonResponse(400, { message: "Missing movieId" });
    if (!actorId) return jsonResponse(400, { message: "Missing actorId" });

    const movieKey = `m#${movieId}`;
    const castSortKey = `c#a#${actorId}`; 

    const cmd = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: movieKey,
        SK: castSortKey,
      },
    });

    const output = await ddbDocClient.send(cmd);


    if (!output.Item) {
      return jsonResponse(404, {message: `No cast member found for movie ${movieId} and actor ${actorId}`});
    }

    return jsonResponse(200, { data: output.Item });
  } catch (error: any) {
    console.error(error);
    return jsonResponse(500, { error });
  }
};