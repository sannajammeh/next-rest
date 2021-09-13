import { Boom } from "@hapi/boom";
import { NextApiResponse } from "next";

export const defaultLogError = (err: Boom<any>) => {
  // Only log internal server errors
  if (!err.isServer) {
    return;
  }

  // Log original error if passed
  if (err.data && err.data.originalError) {
    err = err.data.originalError;
  }

  console.error(err.stack);
};

/**
 * @typedef {Function} SendError
 *
 * @param {object} res - Node.js response object.
 * @param {Error} err - The Boom error object.
 */
/**
 * @typedef {Function} LogError
 *
 * @param {Error} err - The Boom error object.
 */

export const defaultSendError = (res: NextApiResponse, err: Boom<any>) => {
  const { output } = err;
  const { headers, statusCode, payload } = output;

  Object.entries(headers).forEach(([key, value]: [string, any]) =>
    res.setHeader(key, value)
  );

  res.status(statusCode).json(payload);
};
