/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-unused-vars */
import test from "ava";
import { NextApiRequest, NextApiResponse } from "next";
import { mockReq, mockRes } from "sinon-express-mock";
import withRest from "../index";
import chai, { expect } from "chai";
import sinonChai from "sinon-chai";
import Boom from "@hapi/boom";

chai.use(sinonChai);

test("withRest() with GET request", async (t) => {
  const req = mockReq();
  const res = mockRes();
  req.method = "GET";
  (res as any).headersSent = false;

  const payload = {
    message: "success",
  };

  const handler = withRest({
    GET: () => {
      return payload;
    },
  });

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.json).to.be.calledWith(payload);
  t.pass();
});

test("withRest() returning null", async (t) => {
  const req = mockReq();
  const res = mockRes();
  req.method = "GET";
  (res as any).headersSent = false;
  (res as any).setHeader = (...args) => {
    "noop";
  };

  const payload = null;

  const handler = withRest({
    GET: () => {
      return payload;
    },
  });

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.end).to.be.calledWith("null");
  t.pass();
});

test("withRest() with unknown method", async (t) => {
  const req = mockReq();
  const res = mockRes();
  req.method = "POST";

  const handler = withRest(
    {
      GET: () => {
        return null;
      },
    },
    {
      logError: () => {
        "noop";
      },
    }
  );

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.json).to.be.calledWith(
    Boom.methodNotAllowed(`Method POST is not supported for this endpoint`)
      .output.payload
  );

  t.pass();
});

test("withRest() with throwing error", async (t) => {
  const req = mockReq();
  const res = mockRes();
  req.method = "POST";
  (res as any).headersSent = false;

  const originalError = new Error("Foo");

  const handler = withRest(
    {
      POST: () => {
        throw originalError;
      },
    },
    {
      logError: () => {
        "noop";
      },
    }
  );

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.json).to.be.calledWith(
    Boom.internal(undefined, { originalError }).output.payload
  );

  t.pass();
});

test("withRest() with sending json and returning", async (t) => {
  const req = mockReq();
  const res = mockRes();
  req.method = "POST";

  const payload = { foo: "bar" };

  const handler = withRest(
    {
      POST: (_, req) => {
        req.json(payload);
        return payload;
      },
    },
    {
      logError: () => {
        "noop";
      },
    }
  );

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.json).to.be.calledWith(payload);

  t.pass();
});

test("withRest() manually sending payload", async (t) => {
  const req = mockReq();
  const res = mockRes();
  req.method = "POST";

  const payload = { foo: "bar" };

  const handler = withRest({
    POST: (_, req) => {
      req.json(payload);
    },
  });

  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  expect(res.json).to.be.calledWith(payload);

  t.pass();
});
