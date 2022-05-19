
# DRY test framework

> DRY test framework - automation to generate automation test suite driven by OpenAPI.

## Prerequisites

Implementation of OpenAPI Specification in your Nodejs project.

## Table of contents

- [Project Name](#project-name)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Instantiation](#Instantiation)
  - [Usage](#usage)
  - [Authors](#authors)
  - [License](#license)

## Getting Started

These instructions will help you install and run openapi-test-suite module.

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

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

## Usage

A framework to generate automation to test out APIs:
- Test cases are generated using various combinations of parameters. These correct/incorrect values are generated based on the Mandatoriness and type of parameters.

- Response validations
    - for success response, response entities will be validated.
    - for error response, parameter level errors will be validated.

## Instantiation
```
// node/common.js style 
    var openapi-test-suite = require('./openapi-test-suite').perform();
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

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

**[Kartik Kapgate](https://github.com/10kartik), [Vaibhav Dighe](https://github.com/V-R-Dighe), [Ajinkya Chikale](https://github.com/ajinkyac03), [Isha Bansod](https://github.com/ishabansod)**

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License