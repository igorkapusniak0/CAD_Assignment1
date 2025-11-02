import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient } from "../shared/util";
import { withMovieId } from "../shared/withMovieId";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  return withMovieId(event, "m.", "movieId", async (movieKey) => {
    const cmd = new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: movieKey },
      ReturnValues: "ALL_OLD",
    });
    const output = await ddbDocClient.send(cmd);
    return output.Attributes ? { message: `Movie deleted`, deletedMovie: output.Attributes } : null;
  });
};