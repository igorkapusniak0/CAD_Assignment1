import { DynamoDBStreamEvent } from "aws-lambda";

export const handler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    let item;
    
    if (record.eventName === "INSERT") {
        item = record.dynamodb?.NewImage;

    } 
    else if (record.eventName === "REMOVE") {
        item = record.dynamodb?.OldImage;
    }
    const pk = item?.PK?.S  ?? "unknown";
    const title = item.title?.S ?? "unknown";
    const releaseDate = item.releaseDate?.S ?? "unknown";
    const overview = item.overview?.S ?? "unknown";
    const method = record.eventName === "INSERT" ? "POST" :
        record.eventName === "REMOVE" ? "DELETE" :
        record.eventName;     
    console.log(`${method} ${record.eventName} ${pk}  | ${title} | ${releaseDate} | ${overview}`);

  }
};