
# DRY test framework

> DRY test framework - automation to generate automation test suite driven by OpenAPI specification. Start your API testing and it's response behaviour right from the OpenAPI Spec.

## Table of contents

  - [Project Name](#project-name)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
  - [Prerequisites](#prerequisites)
  - [Installation](#Installation)
  - [Instantiation](#Instantiation)
  - [Authors](#authors)
  - [License](#license)

## Project Name

Openapi Test Suite

## Getting Started

These instructions will help you install and run openapi-test-suite module.

## Usage

A framework to generate an automation suite to test response behaviour and parameters of APIs:
- Test cases are generated using various combinations of parameters. These correct/incorrect values are generated based on the mandatoriness and type of parameters.

- Response validations
    - for success response, response entities will be validated.
    - for error response, parameter level errors will be validated.

## Prerequisites

Implementation of OpenAPI Specification in your Nodejs project.

## Installation

Navigate to your project/working directory:

```sh
$ cd project
```

To install and set up the library, run:

```sh
$ npm install -S openapi-test-suite
```

Or if you prefer using Yarn:

```sh
$ yarn add --dev openapi-test-suite
```

## Instantiation
```
In node console,
    openApiObj = require('/config/openapi.json');
    ApiTestSuite = require('/openapi-test-suite/index.js');
    serverIndex = 0; // Specify the server index (Local, Test or Production)
    new ApiTestSuite(openApiObj, serverIndex).runTest();
```
### Logging:

Any of the logging methods take `n` arguments, which are each joined by ' ' (similar to `console.log()`). If an argument is not a string, it is string-ified by `sys.inspect()`
```
    logger.info('loading an array', [1,2,3], 'now!');
    //=> info [Sat Jun 12 2010 01:12:05 GMT-0400 (EDT)]  loading an array [ 1, 2, 3, [length]: 3 ] now!
    logger.debug('this wont be logged');
    //=> false
    logger.setLevel('debug');
    logger.debug('this will be logged now');
    //=> debug [Sat Jun 12 2010 01:12:54 GMT-0400 (EDT)]  this will be logged now
```

## Authors

**[Kartik Kapgate](https://github.com/10kartik), [Vaibhav Dighe](https://github.com/V-R-Dighe), [Ajinkya Chikale](https://github.com/ajinkyac03), [Isha Bansod](https://github.com/ishabansod)**

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License
