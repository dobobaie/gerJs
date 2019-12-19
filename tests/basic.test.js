const test = require('ava');

const fs = require('fs');
const swaggerExample = fs.readFileSync(__dirname + '/swagger.example.yml').toString();

const modelsAPI = require('./models.example');
const gerJs = require('../lib')({
  destinationPath: __dirname
})(modelsAPI());

test("Generate swagger file", t =>
  gerJs.then(swaggerContent =>
    t.is(swaggerContent, swaggerExample, "Difference between swagger content and swagger example")
  )
);
