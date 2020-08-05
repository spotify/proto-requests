# proto-request

`proto-request` uses [protobuf.js](https://github.com/protobufjs/protobuf.js) as well as some of it's own code generation to help your front end repository consume .proto files and build clients / request builders to make requests to them. It supports typescript declarations so that you can get code completion going!

The ultimate goal is for `proto-request` to have many different clients, each reaching out to a different form of endpoint. For now we have started by building the `HttpServiceClient`.

## Creating a compiled file using the protobufjs cli

This is the official documentation from protobufjs. We use the section for static code generation.

Example:

`$> pbjs -t static-module -w commonjs -o generated/compiled.js testproto/com/spotify/adstudiobff/draftservice.proto <other-imported-proto-files-here>`

The output should yield file called `compiled.js` in the `/generated` folder.

To generate a typescript declarations file for it run the following command:

`pbts -o generated/compiled.d.ts generated/compiled.js`

## GRPC Builders

Once you have the `compiled.js` file, you can use the `utils/generateTypeBuilders.ts` utils to build a new version of the `compiled.js` file that will also include a builders namespace that mirrors the structure of the existing namespace and will give you the ability to build out the request objects with proper code completion.

You can follow the code in `/test/generateBuilders.ts` for an example of how to do it.

If you run `/test/generateBuilders.ts` it will build out an example file using the drafts service proto.

The file will be fully annotated so you can then create a typescript declarations file by running:

`pbts -o generated/compiledWithBuilders.d.ts generated/compiledWithBuilders.js`

## Optimized JSON models for Front End (SplitModels)

We can also generate models that are optimized for the front end and are broken down into individual files so that you don't have to include a massive file in your bundle.

You can see `/test/generateModels.ts` for an example of how to generate the SplitModels. You can run the file to see the output in the `/generated` folder.

## HttpServiceClient

The last step is to generate a client to be able to make calls to a given service based on the .proto file. For the http service client you will use the `src/HttpServiceClient/index.ts` file as your utility.

You can use the `/test/generateHttpServiceClient.ts` script as an example of how to do this.

Once you have generated the client you can create typescript declarations by running:

`pbts -o generated/compiledClient.d.ts generated/compiledClient.js`

The next thing to do is to copy the generated client and builders over to your project and use them!

## Generate Models Locally

Add a directory `testproto` along with your test proto files. Add the file `test/config.ts` with the contents of `test/config.template.txt`. In `test/config.ts`, set `clientConfig.rootLocation` to the location of the `testproto` directory:

```
...
testConfig.rootLocation = "/Users/kylel/projects/proto-request/testproto/";
...
```

Specify the locations of the protofiles in `test/config.ts`:

```
testConfig.protoFiles = [
  "com/spotify/adstudiobff/draftservice.proto"
];
```

Run `npm run test:generate:models` to generate model builder classes.
Run `npm run test:generate:client` to generate client classes.

## Compiling ts annotations

`npm run build:all`
`npm run compilets <dir-to-generate-ts-for>`
