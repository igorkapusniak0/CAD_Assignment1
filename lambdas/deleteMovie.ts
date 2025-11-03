import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
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

    // Delete Movie from DB
    const commandOutput = await ddbDocClient.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: movieKey, SK: movieKey },
        ReturnValues: "ALL_OLD"
      })
    );

    console.log("GetCommand response: ", commandOutput);

    if (!commandOutput.Attributes) {
      return jsonResponse(404, { message: `Movie with ID ${movieId} not found` });
    }

    // Return Response
    return jsonResponse(200, { message: `Movie with ID ${movieId} deleted`, deletedMovie: commandOutput.Attributes});
    
  } 
  catch (error: any) {
    console.log(JSON.stringify(error));
    return jsonResponse(500, { error });
  }
};