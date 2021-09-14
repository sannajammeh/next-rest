# Boosted | Next Rest

![NPM](https://img.shields.io/npm/l/@boostedts/next-rest)
![NPM](https://img.shields.io/npm/v/@boostedts/next-rest)
![GitHub Workflow Status](https://github.com/sannajammeh/next-rest/actions/workflows/next-rest.yml/badge.svg?branch=master)

## Motivation

This is a a full TS implementation of [`Moxy´s Next Rest Api`](https://github.com/moxystudio/next-rest-api)

Next.js brought API routes support in v9, but you have to provide your own implementation for handling different HTTP methods, validation, error handling and so on. So in short, this library provides a standard way to:

- Detect HTTP methods (GET, POST, PUT, PATCH, DELETE, etc).
- Validate the request (headers, query, body).
- Handle errors, including how their responses look like.
- Log errors, by printing them to `stderr` by default.

## Installation

<!-- ```sh
$ npm install @moxy/next-rest-api joi @hapi/boom
``` -->

```sh
npm i @boostedts/next-rest
```

Or

```sh
yarn add @boostedts/next-rest
```

This library has a peer-dependency on [`joi`](https://github.com/sideway/joi) and [`@hapi/boom`](https://github.com/hapijs/boom) to perform validation and to output errors in a standard format.

## Usage

### Simple get endpoint:

In `/pages/api/products.js` (or `/pages/api/products/index.js`)

```js
import withRest from "@moxy/next-rest-api";

export default withRest({
  GET: async (req, res) => {
    const products = await listProducts();

    // You may do some post-processing of `products` here...

    return products;
  },
});
```

### Simple get & post endpoint, with validation:

In `/pages/api/products.js` (or `/pages/api/products/index.js`)

```js
import withRest, { withValidation } from "@moxy/next-rest-api";
import Joi from "joi";
import Boom from "@hapi/boom";

const getSchema = {
  query: Joi.object({
    q: Joi.string(),
    sortBy: Joi.valid("price:asc", "price:desc"),
  }),
};

const postSchema = {
  body: Joi.object({
    name: Joi.string().max(200).required(),
    description: Joi.string().max(2000),
    price: Joi.number().min(0).required(),
  }),
};

export default withRest({
  GET: withValidation(getSchema)(async (req, res) => {
    const products = await listProducts(req.query);

    return products;
  }),
  POST: withValidation(postSchema)(async (req, res) => {
    const product = await createProduct(req.body);

    return product;
  }),
});
```

ℹ️ You may use [`p-compose`](https://github.com/JasonPollman/p-compose) to compose your "middlewares" to be more readable, like so:

```js
import withRest, { withValidation } from "@moxy/next-rest-api";
import compose from "p-compose";

export default withRest({
  GET: compose(withValidation(getSchema), async (req, res) => {
    const products = await listProducts(req.query);

    return products;
  }),
});
```

### Simple get, put and delete endpoints, with validation:

In `/pages/api/products/[id].js`

ℹ️ In Next.js, dynamic parameters are assigned to the request query (`req.query.id` in this case).

```js
import withRest, { withValidation } from '@moxy/next-rest-api';
import Joi from 'joi';
import Boom from '@hapi/boom';

const getSchema = {
    query: Joi.object({
        id: Joi.string().required(),
    }),
};

const putSchema = {
    query: getSchema.query,
    body: Joi.object({
        name: Joi.string().max(200).required(),
        description: Joi.string().max(2000),
        price: Joi.number().min(0).required(),
    }),
};

const deleteSchema = {
    query: getSchema.query,
};

export default withRest({
    GET: withValidation(getSchema)(async (req, res) => {
        let product;

        try {
            product = await getProduct(req.query.id);
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                throw Boom.notFound(`Product with id ${req.query.id} does not exist`);
            }

            throw err;
        }

        return product;
    }),
    PUT: withValidation(putSchema)(async (req, res) => {
        let product;

        try {
            product = await updateProduct(req.query.id, req.body);
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                throw Boom.notFound(`Product with id ${req.query.id} does not exist`);
            }

            throw err;
        }

        return product;
    }),
    DELETE: withValidation(deleteSchema)(async (req, res) => {
        try {
            product = await deleteProduct(req.query.id);
        } catch (err) {
            if (err.code === 'NOT_FOUND') {
                return;
            }

            throw err;
        }
    },
});
```

ℹ️ A lot of schemas in the above examples are being repeated. To keep things DRY, it's advisable to reuse them, perhaps in a `schemas.js` file.

## API

### withRest(methods, [options])

Matches handlers defined in `methods` against the HTTP method, like `GET` or `POST`.

Handlers may return any valid JSON as per the [RFC7159](https://tools.ietf.org/html/rfc7159), which includes objects, arrays, booleans and null (undefined is coerced to null). The return value will be sent automatically as a JSON response.

Exceptions thrown within handlers will be caught automatically and sent to the client. You may either throw a [Boom](https://github.com/hapijs/boom) error or a standard error object. If a standard error object is thrown, it will be converted to a Boom error instance automatically (`500`).

In case you throw a Boom error, you may optionally pass the original error inside [`data.originalError`](https://github.com/hapijs/boom/blob/master/API.md#boombadrequestmessage-data), making the default error logger print that error instead of the Boom wrapper (when within the `5xx` range). In fact, this is already done automatically for you when you throw a standard error object inside handlers.

Here's an example on how to pass the original error:

```js
try {
  await deleteProduct(req.query.id);
} catch (err) {
  throw Boom.internal("Unable to delete product", { originalError: err });
}
```

#### methods

Type: `object`

An object mapping HTTP methods to their handlers with the following signature: `async (req, res) => {}`.

#### options

Type: `object`

##### sendError

Type: `function`  
Default: _see `defaultSendError` in [index.js](index.js)_

A function responsible to send Boom errors back to the client. Has the following signature: `(res, err) => {}`.

The default implementation uses the `output` property of the Boom error to set the response headers, status code and payload.

##### logError

Type: `function`  
Default: _see `defaultLogError` in [index.js](index.js)_

A function that logs errors. Has the following signature: `(err) => {}`.

The default implementation ignores any non `5xx` and simply prints the error stack to `stderr`. If the error contains `data.originalError`, that error's stack is printed instead.

### withValidation(schemas)

Wraps a handler with validation against [Joi](https://github.com/hapijs/joi) schemas.

If validation fails, a `400 Bad Request` response will be sent back to the client.

#### schemas

Type: `object`

An object with `query`, `body` or `headers` keys and their associated Joi schemas. Each of these schemas will be matched against the incoming request.

⚠️ Generally you only want to validate a subset of headers. In such situations, your `headers` schema should allow unknown keys with `.unknown(true)`.
