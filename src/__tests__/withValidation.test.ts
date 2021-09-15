import test from "ava";
import { NextApiRequest, NextApiResponse } from "next";
import { mockReq, mockRes } from "sinon-express-mock";
import withRest from "../index";
import chai, { expect } from "chai";
import sinonChai from "sinon-chai";
import Joi from "joi";
import { withJoi } from "../withJoi";
import { match } from "sinon";
chai.use(sinonChai);

const postSchema = {
  body: Joi.object({
    foo: Joi.string().max(200).required(),
  }),
};
test("withRest() with POST request passing", async (t) => {
  const req = mockReq({
    body: {
      foo: "bar",
    },
  });
  const res = mockRes();
  req.method = "POST";
  (res as any).headersSent = false;

  const payload = {
    message: "success",
  };

  const handler = withRest({
    POST: withJoi(postSchema)(() => {
      return payload;
    }),
  });

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.json).to.be.calledWith(payload);
  t.pass();
});

test("withRest() with invalid POST body", async (t) => {
  const req = mockReq({
    body: {
      bar: "foo",
    },
  });
  const res = mockRes();
  req.method = "POST";
  (res as any).headersSent = false;

  const payload = {
    message: "success",
  };

  const handler = withRest({
    POST: withJoi(postSchema)(() => {
      return payload;
    }),
  });

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.json).to.be.calledWith(match.has("statusCode", 400));
  t.pass();
});
