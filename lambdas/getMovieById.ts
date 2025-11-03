import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient, jsonResponse } from "../shared/util";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {     
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const parameters  = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;

    // Check if URL Contains Id Param
    if (!movieId) {
      return jsonResponse(400, { message: "Missing movie Id" });
    }

    const movieKey = `m#${movieId}`;

    // Get movie from Table
    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: movieKey, SK: movieKey },
      })
    );

    console.log("GetCommand response: ", commandOutput);

    // Check if Id exists in DB
    if (!commandOutput.Item) {
      return jsonResponse(404, { message: `Movie with ID ${movieId} not found` });
    }

    const body = {
      data: commandOutput.Item,
    };

    return jsonResponse(200, { body });
    
  } 
  catch (error: any) {
    console.log(JSON.stringify(error));
    return jsonResponse(500, { error });
  }
};