import { createDDbDocClient, jsonResponse } from "../../cognito-demo-app/shared/util";

const ddbDocClient = createDDbDocClient();

type HandlerCallback = (movieKey: string) => Promise<any>;

export async function withMovieId(
  event: any,
  prefix: string,
  paramName: string,
  callback: HandlerCallback
) {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const movieIdStr = event?.pathParameters?.[paramName];
    if (!movieIdStr) return jsonResponse(400, { message: "Missing movie Id" });

    const movieKey = `${prefix}${parseInt(movieIdStr)}`;

    const result = await callback(movieKey);

    if (!result) return jsonResponse(404, { message: `Movie with ID ${movieIdStr} not found` });

    return jsonResponse(200, result);
  } catch (error: any) {
    console.error(error);
    return jsonResponse(500, { error });
  }
}
