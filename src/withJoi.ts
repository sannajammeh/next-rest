import Boom from "@hapi/boom";
import Joi from "joi";
import { NextApiRequest, NextApiResponse } from "next";
import { Handler } from "./types";

/**
 * Wraps a HTTP request handler with validation against Joi schemas.
 *
 * @param {object} schemas - An object with `query`, `body` or `headers` keys and their associated Joi schemas.
 *                           Each of these schemas will be matched against the incoming request.
 *
 * @returns {Function} The HTTP handler that validates the request.
 *
 * @example
 *
 * const getSchema = {
 *   query: Joi.object({
 *      id: Joi.string().required(),
 *   }),
 * };
 *
 * export default withRest({
 *   get: withValidation(getSchema)(async req, res) => {
 *     // Do something with `req.query.id`
 *
 *     return { foo: 'bar' };
 *   },
 * });
 */

const withJoi =
  <Body = any, Response = any>(
    schemas: Joi.PartialSchemaMap<any> | undefined
  ) =>
  (fn: Handler<Body, Response>) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const joiSchema = Joi.object(schemas).unknown(true);

    let validated: any;

    try {
      validated = await joiSchema.validateAsync(req);
    } catch (err) {
      throw Boom.badRequest(err.message, { originalError: err });
    }

    // Joi normalizes values, so we must copy things back to req
    (["headers", "body", "query"] as const).forEach((key) => {
      req[key] = validated[key];
    });

    return fn(req, res);
  };

export default withJoi;
