import test from "ava";
import Boom from "@hapi/boom";
import { defaultLogError, defaultSendError } from "../../utils/error";
import { mockRes } from "sinon-express-mock";
import { NextApiResponse } from "next";
import sinonChai from "sinon-chai";
import chai, { expect } from "chai";
chai.use(sinonChai);

test("defaultLogError - Server side error", (t) => {
  const err = Boom.internal("Could not contact firebase", {
    originalError: new Error("Firebase failed"),
  });
  t.is(defaultLogError(err), undefined);
});
test("defaultLogError - Server side error w/o data", (t) => {
  const err = Boom.internal("Could not contact firebase");
  t.is(defaultLogError(err), undefined);
});

test("defaultLogError - Default error object", (t) => {
  const err = new Error();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t.is(defaultLogError(err as any), undefined);
});

test("defaultLogError - Boom error with data", (t) => {
  const originalError = new Error("Bad Request");
  const err = Boom.badRequest("Bad Request", { originalError });
  t.is(defaultLogError(err), undefined);
});

test("defaultSendError with headers", (t) => {
  const res = mockRes();
  (res as any).setHeader = () => {
    "noop";
  };
  const payload = { foo: "bar" };
  const error = Boom.badRequest("Bad Request", payload);
  error.output.headers["Content-Type"] = "application/json";

  defaultSendError(res as unknown as NextApiResponse, error);

  expect(res.json).to.be.calledWith(error.output.payload);

  t.pass();
});
