
# Openapi Test Suite

## Objective
This package aims to solve the following two problems:
1. Maintenance is a big problem to solve in any test suite. As the APIs evolve at a fast pace, maintenance becomes more difficult.
2. Usually when negative test cases are written, all combinations of parameters are not covered. Writing all the combinations manually is difficult and gets neglected.

We solve point 1, by consuming the openapi.json file to generate test cases in DRY manner.
Openapi.json is auto-generated using a generator script, as described in this [blog](https://plgworks.com/blog/dry-api-docs-and-validations/).

To solve point 2, we use the cartesian product of possible (correct as well as incorrect) sets of values for each parameter to get to the set of all negative test cases.

## Approach
- For each route, we figure out the possible set of values (correct as well as incorrect) for each parameter. Now, we take the 
   cartesian product of these sets, to get all possible combinations of parameters. Correctness of the values is based 
   on the parameter type and parameter constraints given in openapi.json
- For all the incorrect combinations, we fire API calls and check whether the API response has the correct param level error.

## Initialize

```
    const openapiObj = require('./examples/openapi_1.json');
    
    const ApiTestSuite = require('openapi-test-suite/index.js')
    const serverIndex = 0; // Index of the server (to be hit) from the servers block of openapi.json
    const apiSuiteObj = new ApiTestSuite(openApiObj,serverIndex);
```

## Run Test Suite
```
// To run the test suite, use following command
apiSuiteObj.runTest();

// After the test suite run is over, it is recommended to call cleanup
apiSuiteObj.cleanup();
```

### Examples
// TODO - Ajinkya / Isha

#### Case 3: Incorrect parameter passed but not obtained back as an error
In the following, we can see that `raw_phone_number` was passed incorrectly, but the API response `error_data` does not convey the same.
```
    GET /api/admin/web/login/phone/otp 
    params: {"country_code":"959bb2","raw_phone_number":null} 
    Expected response success: false 
    incorrectParamsMap: {"country_code":"Value cannot be string","raw_phone_number":"Value cannot be null"} 
    Response HTTP code: 200 
    API response: {"success":false,"err":{"code":"BAD_REQUEST","msg":"Something went wrong.","error_data":[{"parameter":"country_code","msg":"Invalid parameter country_code.  Please ensure the input is well formed."},{"parameter":"phone_number","msg":"Invalid phone number."}],"internal_id":"v_ap_rd_1"}} 
    cResponse validation error: {"kind":"parameterErrorNotObtained","parameter":"phone_number"} 
```

## Schema Validator
// TODO - Vaibhav / Kartik

### Examples

## Future Scope
- Routes that perform cookie validations are not supported currently.
- Parameter value constraints are not supported.
- Parameter combination for optional and mandatory fields and their validation.
