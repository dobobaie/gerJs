# [BETA] - gerJs

Create Swagger documentation from Joi models

Example for Koa : [https://github.com/dobobaie/example-koa-gerjs-server](https://github.com/dobobaie/example-koa-gerjs-server)  
Example for Express : [https://github.com/dobobaie/example-express-gerjs-server](https://github.com/dobobaie/example-express-gerjs-server)  

Help us to improve the project by contributing 👥  

## ☁️ Installation

```
$ npm install gerjs-core
```

## 📝 Usage

### Initialization

Create a new instance :

``` js
const modelsAPI = require("./models/models");
const gerJs = require("gerjs-core")({
  swagger: {
    title: "Swagger title",
    description: "Swagger description",
    servers_url: [ "http://apiUrl/" ],
    vesion: "1.0.0"
  },
  destinationPath: "/path"
})(modelsAPI);
```

### 📋 Instance options

``` js
{
  swagger: {
    title: "Swagger title", // string ; default: Swagger documentation
    description: "Swagger description", // string ; default: Retrieve all information from the API inside this documents.
    servers_url: [ "http://apiUrl/" ], // Array<string> ; default: ['http://locahost:8000/']
    vesion: "1.0.0" // string ; default: "1.0.0"
  },
  destinationPath: "/path" // string ; required
}
```

## ⚙️ Model examples

[`Joi`](https://hapi.dev/family/joi/) is required to create the models 

``` js
const Joi = require('@hapi/joi');

const refs = {
  token:
    Joi.object({
      token: Joi.string().required().min(12).max(30),
    }).label("token"),
  classic:
    Joi.object({
      message: Joi.string(),
      result: Joi.boolean()
    }).label("classic")
};

const models =
{
  'POST/register': {
    description: 'Register route',
    tags: [ // tags are generate automaticly but you can customize them
      "register"
    ],
    body:
      Joi.object({
        username: Joi.string().default("John").description(`Username of the user`),
        firstname: Joi.string().min(12).max(30).required().description(`Lastname of the user`),
        lastname: Joi.string().description(`Lastname of the user`),
        extra: refs.classic,
        test: Joi.array().items(
          Joi.object({
            number: Joi.number()
          })
        ),
        created: Joi.date().default(Date.now),
        status: Joi.any().default('registered')
      }).description("Body description").required(),
    response: refs.classic.description("Extra register description for the response with a reference")
  },

  'PUT/users/:id': {
    queries: refs.token,
    body: 
      Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
      }),
    response: refs.classic.description('Extra description for the response with a reference').default({ toto: Joi.string() })
  },
  
  'GET/': {
      queries: refs.token,
      response: Joi.string().default("Default response").description('...')
      // OR
      response: Joi.any().meta({ "Content-Type": "text/plain" }).description('...')
  }
};

module.exports = models;

```

## Usage Model

``` js
{
  // METHOD + ROUTE
  '{POST|GET|PUT|DELETE|...}{route: / | /hello | /...}': {
    description: String, // default: empty
    tags: Array<String>, // default: automatic
    queries: Joi, // optional
    body: Joi, // optional
    response: Joi, // required
  }
}
```

## Usage Refs

This is classic `Joi` declaration. But `label(String)` is required to make a link between each same refs.  

For example :  
``` js
const Joi = require('@hapi/joi');

const refs = {
  token:
    Joi.object({
      token: Joi.string().required().min(12).max(30),
    }).label("token"),
};
```
  
As you can see `refs.token` own `token` label from `.label("token")` declaration.  
So everytime `refs.token` will be called, the token decaration will be referenced in the same reference in the Swagger file.  

If you don't specified the `label` declaration then another reference will be created with another specific name.   

## Specify `Content-Type`

The `Content-type` is automaticly determined by the `Joi` declaration.  
Ex: `Joi.object(...)` is `application/json`.  
  
About the `response` part, you can determined the `Content-Type` directly in the `meta` declaration.  
Ex: `response: Joi.any().meta({ "Content-Type": "text/plain" })` the route return a `Content-Type` type `text/plain`.  

## 👥 Contributing

Please help us to improve the project by contributing :)  

## ❓️ Testing

Clone the repo and run from the project root:

```
$ npm install
$ npm test
```
