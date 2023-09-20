"use strict";

const { BadRequestError } = require("../expressError");

/** sqlForPartialUpdate:
 * Accepts an object `dataToUpdate`, from which to construct an SQL update
 * query, and an object `jsToSql`, containing key/value pairs of JavaScript
 * variable names, and their corresponding SQL columns in the table.
 *
 * Returns an object like:
 * {
 *  setCols: A string, used for an Update query, setting inputs to
 *    variables for sanitization
 *  values: An array of corresponding values to be input in the DB query
 * }
 *
 * sqlForPartialUpdate({firstName: "Aliya"}, {firstName: first_name}) =>
 * {
 *  setCols: "first_name=$1",
 *  values: ["Aliya"]
 *  }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
