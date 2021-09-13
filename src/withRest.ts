import Boom from "@hapi/boom";
import { NextApiRequest, NextApiResponse } from "next";
import { defaultLogError, defaultSendError } from "./utils/error";
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export type RequestTypes = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Config = Partial<{
  logError: (err: Boom.Boom<any>) => void;
  sendError: typeof defaultSendError;
}>;

export type Handler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<T>
) => T | Promise<T>;

export type Handlers = AtLeastOne<Record<RequestTypes, Handler>>;

/**
 * Matches handlers defined in `methods` against the HTTP method, like `GET` or `POST`.
 *
 * @param {object.<string, Function>} handlers - An object mapping HTTP methods to their handlers.
 * @param {object} options - The options.
 * @param {SendError} options.sendError - A function responsible to send Boom errors back to the client.
 * @param {LogError} options.logError - A function that logs errors.
 *
 * @returns {Function} The composed HTTP handler.
 *
 * @example
 *
 * export default withRest({
 *   GET: async (req, res) => {
 *     // Do something...
 *
 *     return { foo: 'bar' };
 *   },
 * });
 */
const withRest = (handlers: Handlers, options?: Config) => {
  const config = {
    logError: defaultLogError,
    sendError: defaultSendError,
    ...options,
  };

  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const handler = handlers && handlers[req.method! as RequestTypes];

      if (!handler) {
        throw Boom.methodNotAllowed(
          `Method ${req.method} is not supported for this endpoint`
        );
      }

      const json = await handler(req, res);

      // Do nothing if the request is already sent (e.g.: a redirect was issued)
      if (res.headersSent) {
        if (json !== undefined) {
          config.logError(
            Boom.internal(
              "You have sent the response inside your handler but still returned something. This error was not sent to the client, however you should probably not return a value in the handler."
            )
          );
        }

        return;
      }

      // Next.js doesn't support nulls as `RFC7159` dictates, but we do
      if (json === null) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Length", "4");
        res.end("null");
      } else {
        res.json(json);
      }
    } catch (err) {
      // Not an ApiError? Then wrap it into an ApiError and log it.
      if (!err.isBoom) {
        // eslint-disable-next-line no-ex-assign
        err = Boom.internal(undefined, { originalError: err });
      }

      config.logError(err);
      config.sendError(res, err);
    }
  };
};
export default withRest;
