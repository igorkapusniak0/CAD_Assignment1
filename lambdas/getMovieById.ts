import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createDDbDocClient } from "../shared/util";
import { withMovieId } from "../shared/withMovieId";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {

  const ddbDocClient = createDDbDocClient();

  return withMovieId(event, "m.", "movieId", async (movieKey) => {
    const cmd = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: movieKey },
    });
    const output = await ddbDocClient.send(cmd);
    return output.Item ? { body: { data: output.Item } } : null;
  });
};
