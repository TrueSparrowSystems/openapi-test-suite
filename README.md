
### DRY test framework

> Automation to generate automation test suite driven by OpenAPI specification. Start API testing and its response behaviour just using OpenAPI.json file.

### Project Name

> Openapi Test Suite

### Getting Started

These instructions will help you install and run openapi-test-suite module.

### Objective

In a fast-paced and big project involving many APIs, it takes significant efforts to test and maintain them all manually. It becomes cumbersome to test these APIs against every possible combination of parameters.
This module overcomes the stated problem by automatically testing every API and its parameters listed in openapi specification.

### Usage

A framework to generate an automation suite to test response behaviour and parameters of APIs:
- Test cases are generated for every possible combination of parameters. These correct/incorrect values are generated based on the mandatoriness and type of parameters.

- Response validations
    - for success response, response entities are validated.
    - for error response, parameter level errors are validated.

### Prerequisites

Implementation of OpenAPI Specification in your Nodejs project.

### Instantiation
```
In node console,
    openApiObj = require('/config/openapi.json');
    ApiTestSuite = require('/openapi-test-suite/index.js');
    serverIndex = 0; // Specify the server index (Local, Test or Production)
    new ApiTestSuite(openApiObj, serverIndex).runTest();
```

### Example
In node console, try this:
```
openapiObj = {
  "definition": {
    "openapi": "3.0.0",
    "info": {
      "title": "Node JS API",
      "description": "REST API implemented using Node JS",
      "version": "1.0.0"
    },
    "servers": [
      {
        "url": "http://localhost:3000",
        "description": "Local dev server"
      }
    ],
    "components": {
      "schemas": {
        "otp_detail": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer",
              "example": 1
            },
            "sms_identifier": {
              "type": "string",
              "example": "1:abc-111-rrr"
            },
            "uts": {
              "type": "integer",
              "example": 1651666861
            }
          },
          "required": [
            "id",
            "sms_identifier",
            "uts"
          ]
        },
        "current_admin": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer",
              "example": 1,
              "description": "This is the id of admin table"
            },
            "first_name": {
              "type": "string",
              "example": "Alex"
            },
            "last_name": {
              "type": "string",
              "example": "Morgan"
            },
            "profile_image_id": {
              "type": "integer",
              "example": 1651666861,
              "description": "profile_image_id is images table id"
            },
            "default_profile_image_id": {
              "type": "integer",
              "example": -1,
              "description": "default_profile_image_id is static map id (-1,-2)"
            },
            "status": {
              "type": "integer",
              "example": 1
            },
            "uts": {
              "type": "integer",
              "example": 1651666861
            }
          },
          "required": [
            "id",
            "status",
            "default_profile_image_id",
            "uts"
          ]
        },
        "images": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "example": 100000
              },
              "resolutions": {
                "type": "string",
                "example": "{\"520w\":{\"s\":40330,\"h\":\"520\",\"w\":\"520\"},\"260w\":{\"s\":20391,\"h\":\"260\",\"w\":\"260\"}}",
                "description": "This is the resolution of image. it contains size, height and width"
              },
              "status": {
                "type": "string",
                "example": "ACTIVE"
              },
              "uts": {
                "type": "integer",
                "example": 1651666861
              }
            },
            "required": [
              "id",
              "status",
              "uts"
            ]
          },
          "example": {
            "100000": {
              "id": 100000,
              "resolutions": "{\"520w\":{\"s\":40330,\"h\":\"520\",\"w\":\"520\"},\"260w\":{\"s\":20391,\"h\":\"260\",\"w\":\"260\"}}",
              "status": "ACTIVE",
              "uts": 1651666861
            }
          }
        }
      }
    },
    "paths": {
      "/api/admin/web/login/phone/otp": {
        "get": {
          "summary": "Get login otp for admin",
          "tags": [
            "Admin Auth"
          ],
          "parameters": [
            {
              "in": "query string",
              "name": "country_code",
              "required": true,
              "schema": {
                "type": "number"
              }
            },
            {
              "in": "query string",
              "name": "raw_phone_number",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "string",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "otp_detail": {
                            "$ref": "#/components/schemas/otp_detail"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "apis": [
    "./routes/api/admin/web/index"
  ]
}

ApiTestSuite = require('openapi-test-suite/index.js')
serverIndex = openapiObj.server[0]
new ApiTestSuite(openApiObj,serverIndex).runTest()

```

Sample response where parameter validation fails:
```
    GET /api/admin/web/login/phone/otp 
    params: {"country_code":"959bb2","raw_phone_number":null} 
    Expected response success: false 
    incorrectParamsMap: {"country_code":"Value cannot be string","raw_phone_number":"Value cannot be null"} 
    Response HTTP code: 200 
    API response: {"success":false,"err":{"code":"BAD_REQUEST","msg":"Something went wrong.","error_data":[{"parameter":"country_code","msg":"Invalid parameter country_code.  Please ensure the input is well formed."},{"parameter":"phone_number","msg":"Invalid phone number."}],"internal_id":"v_ap_rd_1"}} 
    cResponse validation error: {"kind":"parameterErrorNotObtained","parameter":"phone_number"} 
```

### Error logging

Error Response for correct case
    
    All parameters are correct and success response is false 

Parameter Error not obtained
    
    Api response error for correct parameter

Response entity type mismatch
    
    The response parameter type does not match the required parameter
    
## Future Scope

- APIs with parameters involving sensitive fields such as cookies will be added.
- Constraints on parameters like min-length, max-length, etc will be validated.
- Parameter combination for optional and mandatory fields and it's validation.

## Authors

**[Kartik Kapgate](https://github.com/10kartik), [Vaibhav Dighe](https://github.com/V-R-Dighe), [Ajinkya Chikale](https://github.com/ajinkyac03), [Isha Bansod](https://github.com/ishabansod)**

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this Project.

## License
