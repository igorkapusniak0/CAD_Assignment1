import { marshall } from "@aws-sdk/util-dynamodb";
import { Movie, MovieCast } from "./types";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

type Entity = Movie | MovieCast;
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
 },
 };
};

export function generateBatch(items: any[]) {
  return items
    .map((item) => {
      let pk = "";
      let sk = "";
      let entityType = "";

      if ("movieId" in item && "title" in item) {
        pk = `m#${item.movieId}`;
        sk = pk;
        entityType = "Movie";
      } 
      else if ("actorId" in item && "name" in item) {
        pk = `a#${item.actorId}`;
        sk = pk;
        entityType = "Actor";
      } 
      else if ("movieId" in item && "actorId" in item) {
        pk = `m#${item.movieId}`;
        sk = `a#${item.actorId}`;
        entityType = "Cast";
      }
      else if ("awardId" in item && item.body) {
        pk = item.PK
        sk = `w#${item.body}`;
        entityType = "Award";
      } 
      else {
        console.error("Unknown item type:", item);
        return undefined;
      }

      return {
        PutRequest: {
          Item: marshall({
            ...item,
            PK: pk,
            SK: sk,
            entityType,
          }),
        },
      };
    })
    .filter((x) => x !== undefined);
}

export function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  return DynamoDBDocumentClient.from(ddbClient, { marshallOptions, unmarshallOptions });
}

export function jsonResponse(statusCode: number, body: Record<string, any>) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

