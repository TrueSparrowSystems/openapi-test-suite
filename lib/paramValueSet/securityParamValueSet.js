/**
 * Class for getting security param value set
 *
 * @class SecurityParamValueSet
 */
class SecurityParamValueSet {
  /**
   * Get values for param int
   *
   * @returns {*[]}
   */
  getValues() {
    const oThis = this;

    const valuesArray = [];

    const securityValues = oThis.securityValuesArray();

    for (let index = 0; index < securityValues.length; index++) {
      const securityVal = securityValues[index];

      valuesArray.push({
        value: securityVal,
        description: ''
      });
    }

    return valuesArray;
  }

  /**
   * Returns security param values array
   *
   * @returns {string[]}
   */
  // NOTE: Following is list with SQL and command injection queries which will be tested against all api parameters.
  // More queries can be added according to potential vulnerabilities in project.
  securityValuesArray() {
    return [
      // Auth Bypass SQL Payloads
      " '-' ",
      " ' ' ",
      " '&' ",
      " '^' ",
      " '*' ",
      " ' or ''-' ",
      " ' or '' ' ",
      " ' or ''&' ",
      " ' or ''^' ",
      " ' or ''*' ",

      // Generic injection payloads
      ' / ',
      ' // ',
      '  ',
      ' \\ ',
      ' ; ',
      ' -- or #  ',
      " ' OR '1 ",
      " ' OR 1 -- - ",
      " ' OR '' = ' ",
      " '=' ",
      " 'LIKE' ",
      " '=0--+ ",
      '  OR 1=1 ',
      " ' OR 'x'='x ",
      " ' AND id IS NULL; -- ",
      " '''''''''''''UNION SELECT '2 ",
      ' %00 ',
      ' /*…*/  ',
      ' +		 ',
      ' ||		 ',
      ' %		 ',
      ' @variable ',
      ' @@variable ',
      '  ',
      ' AND 1 ',
      ' AND 0 ',
      ' AND true ',
      ' AND false ',
      ' 1-false ',
      ' 1-true ',
      ' 1*56 ',
      ' -2 ',

      // Error based SQL Payloads
      ' OR 1=1 ',
      ' OR 1=0 ',
      ' OR x=x ',
      ' OR 1=1# ',
      ' OR 1=0# ',
      ' OR x=y# ',
      ' OR 1=0--  ',
      ' OR x=x--  ',
      ' HAVING 1=1 ',
      ' HAVING 1=0 ',
      ' HAVING 1=1# ',
      ' HAVING 1=0# ',
      ' AND 1=1 ',
      ' AND 1=0 ',
      ' AND 1=1--  ',
      ' AND 1=0--  ',
      ' AND 1=1# ',
      " AND 1=1 AND '%'=' ",
      " AND 1=0 AND '%'=' ",
      ' AS INJECTX WHERE 1=1 AND 1=1 ',
      ' AS INJECTX WHERE 1=1 AND 1=0# ',
      ' AS INJECTX WHERE 1=1 AND 1=1-- ',
      ' WHERE 1=1 AND 1=1 ',
      ' WHERE 1=1 AND 1=0 ',
      ' WHERE 1=1 AND 1=1# ',
      ' WHERE 1=1 AND 1=0-- ',
      ' ORDER BY 1--   ',
      ' ORDER BY 1#   ',
      ' ORDER BY 1  ',

      // Time Based SQL Injection Payloads
      ' or SLEEP(5) ',
      ' pg_SLEEP(5)-- ',
      ' sleep(5)# ',
      ' 1 or sleep(5)# ',
      " ;waitfor delay '0:0:5'-- ",
      ' benchmark(10000000,MD5(1))# ',

      // Union Select SQL Injection Payloads
      ' ORDER BY SLEEP(5) ',
      ' ORDER BY 1,SLEEP(5) ',
      ' UNION ALL SELECT 1 ',
      ' UNION ALL SELECT 1,2 ',
      ' UNION SELECT @@VERSION,SLEEP(5),3 ',
      ' UNION ALL SELECT NULL# ',

      // Linux command injection payloads
      'ls -alt ',
      'echo $cmd'
    ];
  }
}

module.exports = SecurityParamValueSet;
