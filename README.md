
# Openapi Test Suite

## Objective
This package aims to solve the following two problems:
1. Maintenance is a big problem to solve in any test suite. As the APIs evolve at a fast pace, maintenance becomes more difficult.
2. Usually when negative test cases are written, all combinations of parameters are not covered. Writing all the combinations manually is difficult and gets neglected.

We solve point 1, by consuming the openapi.json file to generate test cases. Openapi.json is auto-generated using a generator script, as described in this [blog](https://plgworks.com/blog/dry-api-docs-and-validations/).

To solve point 2, we use the cartesian product of all possible example values for each parameter to get to the set of all negative test cases.

## Approach
- For each route, we figure out the possible values (correct as well as incorrect) for each parameter. Now, we take the 
   cartesian product of these sets, to get all possible combinations of parameters. Correctness of the values is based 
   on the paramter type and paramter constraints (future scope, not in current version) given in openapi.js
- For all the incorrect combinations, we fire API calls and check whether the API response has the correct param level error.

## Initialize and run tests

```
    const openApiObj = require('/config/openapi.json');
    const ApiTestSuite = require('/openapi-test-suite/index.js');
    const serverIndex = 0; // Index of the server (to be hit) from the servers block of openapi.json
    
    // Run tests
    new ApiTestSuite(openApiObj, serverIndex).runTest();
```

### Examples
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
    
## Future Scope
- Routes that perform cookie validations are not supported currently.
- Parameter value constraints are not supported.
- Parameter combination for optional and mandatory fields and their validation.

## Authors

**[Kartik Kapgate](https://github.com/10kartik), [Vaibhav Dighe](https://github.com/V-R-Dighe), [Ajinkya Chikale](https://github.com/ajinkyac03), [Isha Bansod](https://github.com/ishabansod)**

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this Project.
