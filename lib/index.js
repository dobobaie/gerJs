const fs = require('fs');
const {
  formatToRef,
  retrieveContentType
} = require('./utils');

const swaggerConfig = {
  openapi_version: '3.0.0',
  servers_url: ['http://locahost:8000/'],
  version: '1.0.0',
  title: 'Swagger documentation',
  description: 'Retrieve all information from the API inside this documents.'
};

const createSwaggerHeader = options => () => {
  let swaggerFile = ``;
  swaggerFile += `openapi: ${swaggerConfig.openapi_version}\r\n`;
  swaggerFile += `servers:\r\n`;
  options.swagger.servers_url.map(server_url =>
    swaggerFile += `  - url: '${server_url}'\r\n`
  );
  swaggerFile += `info:\r\n`;
  swaggerFile += `  version: "${options.swagger.version}"\r\n`;
  swaggerFile += `  title: "${options.swagger.title}"\r\n`;
  swaggerFile += `  description: "${options.swagger.description}"\r\n`;
  return swaggerFile;
};

const createSwaggerRule = options => (key, rule) => {
  let swaggerFile = ``;
  switch (key) {
    case 'string_min':
      swaggerFile += `minLength: ${rule.args.limit}`;
    break;
    case 'string_max':
      swaggerFile += `maxLength: ${rule.args.limit}`;
    break;
    case 'number_greater':
      swaggerFile += `minimum: ${rule.args.limit}`;
    break;
    case 'number_less':
      swaggerFile += `maximum: ${rule.args.limit}`;
    break;
    default:
      return null;
  }
  return swaggerFile;
}

const createSwaggerRefRequestBody = options => (ref, label) => {
  if (!ref) return '';
  let swaggerFile = ``;
  swaggerFile += `     ${formatToRef(label)}:\r\n`;
  swaggerFile += `      description: "${ref._flags.description || ''}"\r\n`;
  swaggerFile += `      required: ${ref._flags.presence === 'required' || false}\r\n`;
  swaggerFile += `      content:\r\n`;
  swaggerFile += `       ${retrieveContentType(ref.type)}:\r\n`;
  swaggerFile += `        schema:\r\n`;
  swaggerFile += `         $ref: '#/components/schemas/${formatToRef(label)}'\r\n`;
  return swaggerFile;
};

const createSwaggerRefPropreties = options => nlabel => proprety => {
  let lSwaggerFile = ``;
  let swaggerFile = ``;
  swaggerFile += `        ${proprety.id}:\r\n`;
  swaggerFile += `          type: "${proprety.schema.type}"\r\n`;
  proprety.schema._singleRules.forEach((rule, key) => {
    if (key === 'items') return ;
    const retrieveRule = createSwaggerRule(options)(proprety.schema.type + '_' + key, rule);
    swaggerFile += retrieveRule ? `          ${retrieveRule}\r\n` : ``;
  });
  if (proprety.schema.type === 'array') {
    const item = proprety.schema['$_terms'].items.shift();
    const plabel = formatToRef(item._flags.label || nlabel + '_' + proprety.id);
    swaggerFile += `          items:\r\n`;
    swaggerFile += `            type: "${item.type}"\r\n`;
    item._singleRules.forEach((rule, key) => {
      const retrieveRule = createSwaggerRule(options)(item.type + '_' + key, rule);
      swaggerFile += retrieveRule ? `            ${retrieveRule}\r\n` : ``;
    });
    if (item.type === 'object' || item.type === 'array') {
      swaggerFile += `            $ref: '#/components/schemas/${plabel}'\r\n`;
      lSwaggerFile += createSwaggerRefSchema(options)(item, plabel);
    }
  }
  if (proprety.schema.type === 'object') {
    const plabel = formatToRef(proprety.schema._flags.label || nlabel + '_' + proprety.id);
    swaggerFile += `          $ref: '#/components/schemas/${plabel}'\r\n`;
    lSwaggerFile += createSwaggerRefSchema(options)(proprety.schema, plabel);
  }
  return { sf: swaggerFile, lsf: lSwaggerFile };
};

const refsMemory = {};
const createSwaggerRefSchema = options => (ref, label) => {
  if (!ref) return '';
  let swaggerFile = ``;
  const nlabel = formatToRef((ref._flags && ref._flags.label) || label);
  if (['object', 'array'].includes(ref.type) && !refsMemory[nlabel]) {
    swaggerFile += `    ${nlabel}:\r\n`;
    swaggerFile += `      type: "${ref.type}"\r\n`;
    if (ref.type === 'array') {
      swaggerFile += `      items:\r\n`;
      const item = ref['$_terms'].items.shift();
      swaggerFile += `        type: "${item.type}"\r\n`;
      const plabel = formatToRef(item._flags.label || nlabel + '_' + 'items');
      item._singleRules.forEach((rule, key) => {
        const retrieveRule = createSwaggerRule(options)(item.type + '_' + key, rule);
        swaggerFile += retrieveRule ? `        ${retrieveRule}\r\n` : ``;
      });
      if (item.type === 'object' || item.type === 'array') {
        swaggerFile += `        $ref: '#/components/schemas/${plabel}'\r\n`;
        swaggerFile += createSwaggerRefSchema(options)(item, plabel);
      }
    } else {
      swaggerFile += `      properties:\r\n`;
      const lsf = Array.from(ref._ids._byKey.values())
        .map(createSwaggerRefPropreties(options)(nlabel))
        .reduce((accumulator, value) => {
          swaggerFile += value.sf;
          return accumulator + value.lsf;
        }, '');
      swaggerFile += lsf;
    }
    refsMemory[nlabel] = true;
  }
  return swaggerFile;
};

const createSwaggerComponents = options => models => {
  let swaggerFile = ``;
  swaggerFile += `components:\r\n`;
  swaggerFile += `  requestBodies:\r\n`;
  Object.keys(models).map(route => {
    swaggerFile += createSwaggerRefRequestBody(options)(models[route].body, route);
   });
  swaggerFile += `  schemas:\r\n`;
  Object.keys(models).map(route => {
    if (models[route].body) models[route].body._flags.label = route;
    swaggerFile += createSwaggerRefSchema(options)(models[route].body);
    swaggerFile += createSwaggerRefSchema(options)(models[route].response, 'response_' + route);  
  });
  return swaggerFile;
};

const createSwaggerQueries = options => (model, key) => {
  if (!model) return '';
  let swaggerFile = ``;
  swaggerFile += `      parameters:\r\n`;
  model._ids._byKey.forEach((query, key) => {
    swaggerFile += `      - name: ${key}\r\n`;
    swaggerFile += `        in: query\r\n`;    
    swaggerFile += `        description: "${query.schema._flags.description || ''}"\r\n`;    
    swaggerFile += `        required: ${query.schema._flags.presence === 'required' || false}\r\n`;    
    swaggerFile += `        schema:\r\n`;    
    swaggerFile += `          type: ${query.schema.type}\r\n`;    
    query.schema._singleRules.forEach((rule, key) => {
      const retrieveRule = createSwaggerRule(options)(query.schema.type + '_' + key, rule);
      swaggerFile += retrieveRule ? `          ${retrieveRule}\r\n` : ``;
    });
  });
  return swaggerFile;
};

const createSwaggerParameters = options => route => {
  let swaggerFile = ``;
  const paths = route.match(/(?<=:).*?(?=(\/|$))/g) || [];
  paths.map(path => {
    swaggerFile += `      - name: ${path}\r\n`;
    swaggerFile += `        in: path\r\n`;    
    swaggerFile += `        description: ":${path} parameter"\r\n`;    
    swaggerFile += `        required: true\r\n`;    
  });
  return swaggerFile;
};

const createSwaggerBody = options => (model, key) => {
  if (!model) return '';
  let swaggerFile = ``;
  swaggerFile += `      requestBody:\r\n`;
  swaggerFile += `        $ref: '#/components/requestBodies/${formatToRef(key)}'\r\n`;
  return swaggerFile;
};

const createSwaggerResponse = options => (code, model, key) => {
  let swaggerFile = ``;
  swaggerFile += `      responses:\r\n`;
  swaggerFile += `        '${code}':\r\n`;
  swaggerFile += `          description: "${model._flags.description || ''}"\r\n`;
  swaggerFile += `          content:\r\n`;
  swaggerFile += `            ${retrieveContentType(model.type, model['$_terms'].metas)}:\r\n`;
  swaggerFile += `              schema:\r\n`;
  
  switch (model.type)
  {
    case 'array':
    case 'object':
      swaggerFile += `                $ref: '#/components/schemas/${formatToRef(model._flags.label || key)}'\r\n`;
    break;
    default:
      swaggerFile += `                type: string\r\n`;
      swaggerFile += `                default: "${model._flags.default || ''}"\r\n`;
  }

  return swaggerFile;
};

const createSwaggerTags = options => (model, route) => {
  let swaggerFile = ``;
  const tags = model.tags !== undefined
    ? model.tags
    : (() => {
      const routes = route.split('/');
      return routes.reduce((tag, route, key) => {
        if (key === 1 && ![':', ''].includes(route)) {
          tag.push(route);
        }
        if (key > 2 && route[0] === ':') {
          tag.push(routes[key - 1]);
        }
        return tag;
      }, []);
    })();

  if (tags && tags.length) {
    swaggerFile += `      tags:\r\n`;
    tags.map(tag =>
      swaggerFile += `        - ${tag}\r\n`
    );
  }
  return swaggerFile;
}

const createSwaggerMethods = options => methods =>
  methods.reduce((swaggerFile, info) => {
    swaggerFile += `    ${info.method}:\r\n`;
    swaggerFile += `      description: "${info.model.description || ''}"\r\n`;
    swaggerFile += createSwaggerTags(options)(info.model, info.route);
    swaggerFile += createSwaggerQueries(options)(info.model.queries, info.key);
    swaggerFile += createSwaggerParameters(options)(info.route);
    swaggerFile += createSwaggerBody(options)(info.model.body, info.key);
    swaggerFile += createSwaggerResponse(options)('200', info.model.response, 'response_' + info.key);
    return swaggerFile;
  }, '');

const createSwaggerPaths = options => models => {
  let swaggerFile = `paths:\r\n`;
  
  const sortedMethods = Object.keys(models)
    .reduce((accumulator, key) => {
      const method = key.split('/').shift().toLowerCase();
      const route = key.substring(method.length);
      accumulator[route] = accumulator[route] || [];
      accumulator[route].push({
        method,
        route,
        key,
        model: models[key]
      });
      return accumulator;
    }, {});

  swaggerFile += Object.keys(sortedMethods)
    .reduce((accumulator, route) => {
      accumulator += `  ${route}:\r\n`;
      accumulator += createSwaggerMethods(options)(sortedMethods[route]);
      return accumulator;
    }, '');

  return swaggerFile;
};

const createSwagger = (options, models) =>
  new Promise((resolve, reject) => {
    let opt = options || {};
    opt.swagger = opt.swagger || {};
    opt.swagger.servers_url = opt.swagger.servers_url || swaggerConfig.servers_url;
    opt.swagger.version = opt.swagger.version || swaggerConfig.version;
    opt.swagger.title = opt.swagger.title || swaggerConfig.title;
    opt.swagger.description = opt.swagger.description || swaggerConfig.description;

    if (!opt.destinationPath) {
      return reject(new Error(`"destinationPath" parameter is required`));
    }

    const swaggerHeader = createSwaggerHeader(opt)();
    const swaggerPaths = createSwaggerPaths(opt)(models);
    const swaggerComponents = createSwaggerComponents(opt)(models);
    const swaggerContent = swaggerHeader + swaggerPaths + swaggerComponents;

    fs.writeFileSync(opt.destinationPath + '/swagger.yml', swaggerContent);
    resolve(swaggerContent);
  });

module.exports = options => models => createSwagger(options, models);
