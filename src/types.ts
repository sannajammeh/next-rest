import { Boom } from "@hapi/boom";
import { NextApiRequest, NextApiResponse } from "next";

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export type SendError = (res: NextApiResponse<any>, err: Boom<any>) => void;
export type LogError = (err: Boom<any>) => void;
export type RequestTypes = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type WithRestConfig = Partial<{
  logError: LogError;
  sendError: SendError;
}>;

export interface BodyNextApiRequest<T = any> extends NextApiRequest {
  body: T;
}

export type Handler<B = any, T = any> = (
  req: BodyNextApiRequest<B>,
  res: NextApiResponse<T>
) => T | Promise<T>;

export type Handlers<B, T> = AtLeastOne<Record<RequestTypes, Handler<B, T>>>;
