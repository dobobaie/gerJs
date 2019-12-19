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

const models = {
  'POST/register': {
    description: '',
    body:
      Joi.object({
        username: Joi.string().default("toto").description('username field'),
        firstname: Joi.string().min(12).max(30).required().description('firstname field'),
        lastname: Joi.string().description('lastname field'),
        extra: refs.classic,
        test: Joi.array().items(
          Joi.object({
            number: Joi.number()
          })
        ),
        created: Joi.date().default(Date.now).description('created field'),
        status: Joi.any().default('registered').description('this key will match anything you give it')
      }).description("toto").required(),
    response: refs.classic.description('response field')
  },
  'PUT/users/:id': {
    description: '',
    queries: refs.token,
    body: 
      Joi.object({
        username: Joi.string().required().description('username field'),
        password: Joi.string().required().description('password field')
      }),
    response: refs.classic.description('response field').default({ toto: Joi.string() })
  },
  'GET/': {
    queries: refs.token,
    response: Joi.any().meta({ "Content-Type": "text/plain" })
  },
  'POST/': {
    body: 
      Joi.object({
        token: Joi.string().required().description('...')
      }),
    response: Joi.any().default("Test").meta({ "Content-Type": "text/plain" })
  }
};

module.exports = () => models;
