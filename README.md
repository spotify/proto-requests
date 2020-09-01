# proto-requests

`proto-requests` helps you generate clients and models from .proto files so that you can use them on your web application to make requests to your backend.  These clients send JSON-based messages, so you can still debug requests from the browser as you would any normal JSON payload.  You can integrate `proto-requests` as part of your backend build process and have it publish it's clients and models so that various front end web applications can easily reach out to the service.  We also support generating `.d.ts` annotations for all of our clients and models -- so TypeScript is fully supported!  We have optimized our code generation process to break the generated code into separate files, so that you don't need to import the entire set of models or clients when you only need one.  This helps to keep package size down.

`proto-requests` uses [protobuf.js](https://github.com/protobufjs/protobuf.js) as well as some of it's own code generation to help make this happen.

We have provided the `HttpServiceClient` and `SplitModels` to help you generate clients.  However you are also free to fork this repository and build any code generator you like using the framework we have provided.

## What is a generated client?

If you've never used a generated client to interact with your backend before, it's a game changer.  Instead of writing your own fetch calls, the generated code package will provide you with classes to build your requests.  This is great because it eliminates any ambiguity around what endpoints you need to reach out to and what the payload must be structured like.  When paired with TypeScript, you will also have type checks running against your payloads at compile (transpile) time, NOT at runtime in production.

Here is an example of what making a fetch call might look like WITHOUT a generated client:

```
export async function getTodo(
  userId: string,
  todoId: string,
): Promise<typeof GetTodoResponse> {
  const url = '/myapp/TodoService/v1/getTodo';
  const opts = {
    method: 'POST',
    body: JSON.stringify({
      userId: userId,
      todoId: todoId,
    }),
  };
  return fetch(url, opts);
}
```

And this is what it could look like with our generated client:

```
const config = getClientConfig();
const client = new TodoService(globalProtoFetch, config);

export async function getTodo(
  userId: string,
  todoId: string,
): Promise<typeof GetTodoResponse> {
  const request = new GetTodoRequest()
    .setUserId(userId)
    .setTodoId(todoId)
    .toObject();
  return client.getTodo(request);
}
```

## Prerequisites for use

In order to best use this package you will want to have the following:

- A backend service that describes it's models and endpoints using `.proto` files.
- Your backend service should also have a consistent scheme for generating the urls of the backend endpoints for the services declared in it's `.proto` files.
- Your backend service should be able to accept HTTP requests with JSON bodies that correspond to the models and endpoints described in it's `.proto` files.

## How to use this package

There's two main ways you can use this package.  The first, and recommended way, is to generate the models and clients as part of your backend's build process and publish them in some way (perhaps npm or a private npm?).  In this way, you will have easy access to the `.proto` files in your backend build, and you can publish a new version of the models / clients each time a new version of your backend is published.  The second way is to generate code as part of your front end's build phase.  If you choose this method, you will need to figure out how to get the `.proto` files belonging to your backend into your front end solution.  Next let's take a look at how you actually generate the models / clients.

## Generating models / clients

First install the package using `npm install proto-requests`.

There are three methods exported from this package:

- `HttpServiceClient`
- `SplitModels`
- `generateDts`

### Using `HttpServiceClient` to generate a JSON-based client for the Front End.

The `HttpServiceClient` helps you generate clients for any services declared in your `.proto` files.  See the [setup example](https://github.com/spotify/proto-requests/blob/master/test/generateHttpServiceClient.ts) for an example of use.

### Using `SplitModels` to generate optimized models for the Front End.

The `SplitModels` helps you generate models for any messages declared in your `.proto` files.  The reason it is called "split" models is because each proto message will have it's code generated into a separate file.  This helps to reduce your overall front end bundle size should you not need to include every single server side model in your application or any of it's chunks.  See the [setup example](https://github.com/spotify/proto-requests/blob/master/test/generateModels.ts) for an example of use.

### Using `generateDts` to build `.d.ts` TypeScript annotations for clients or models.

Once you have a client or models generated via `HttpServiceClient` or `SplitModels` you can generate `.d.ts` TypeScript annotations for them.  The files generated by `HttpServiceClient` and `SplitModels` contain generated comments that allow us to automatically build the `.d.ts` files using `generateDts`.  See the [setup example](https://github.com/spotify/proto-requests/blob/master/test/generateDts.ts) for an example of use.

## Optimized JSON models for Front End (SplitModels)

We can also generate models that are optimized for the front end and are broken down into individual files so that you don't have to include a massive file in your bundle.

You can see `/test/generateModels.ts` for an example of how to generate the SplitModels. You can run the file to see the output in the `/generated` folder.

## Trying things out locally (in this package)

If you just want to sample what this package is like without fully integrating it into your backend, you can use our own test code to generate models, clients, and TypeScript annotations to see what it look like.  You'll start by copying over some `.proto` files from your backend to the `testproto/` directory that you want to test with.

### Generating models locally

Add a directory `testproto/` along with your test proto files. Add the file `test/config.ts` with the contents of [`test/config.template.txt`](). In `test/config.ts`, set `clientConfig.rootLocation` to the location of the `testproto` directory:

```
...
testConfig.rootLocation = "/Users/<your-username>/projects/proto-request/testproto/";
...
```

Specify the locations of the protofiles in `test/config.ts`:

```
testConfig.protoFiles = [
  "com/org/testservice/testservice.proto"
];
```

Run `npm run test:generate:models` to generate model builder classes.
Run `npm run test:generate:client` to generate client classes.

### Compiling ts annotations locally

`npm run build:all`
`npm run compilets <dir-to-generate-ts-for>`

This project adheres to the [Open Code of Conduct][code-of-conduct]. By participating, you are expected to honor this code.

[code-of-conduct]: https://github.com/spotify/code-of-conduct/blob/master/code-of-conduct.md
