"use strict";

const { BadRequestError } = require("../expressError");

/** sqlForPartialUpdate:
 * Accepts an object `dataToUpdate`, from which to construct an SQL update
 * query, and an object `jsToSql`, containing key/value pairs of JavaScript
 * variable names, and their corresponding SQL columns in the table.
 * TODO:Put example input here
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
 *  setCols: `"first_name"=$1`,
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

/** Takes in an object of filter params.
*
* Returns an object with a SQL WHERE clause and an array of values like:
*
* { where: "WHERE name ILIKE $1", values: ['%name%'] }
*
* Filter params must be one of nameLike, minEmployees, or maxEmployees.
*/
// FIXME: make these numbers numbers in route, and fix schema. Adjust below:
function sqlForFilter(filterParams) {
  //FIXME: validate this at the end; return w/ ternary
  const keys = Object.keys(filterParams);
  if (keys.length === 0) return { where: "", values: [] };

  if (filterParams.minEmployees && filterParams.maxEmployees) {
    if (+filterParams.minEmployees > +filterParams.maxEmployees) {
      throw new BadRequestError("minEmployees must be less than maxEmployees.");
    }
  }

  const where = [];
  const values = [];
  let num = 1;

  if (filterParams.minEmployees) {
    where.push(`num_employees >= $${num}`);
    values.push(+filterParams.minEmployees);
    num++;
  }

  if (filterParams.maxEmployees) {
    where.push(`num_employees <= $${num}`);
    values.push(+filterParams.maxEmployees);
    num++;
  }

  if (filterParams.nameLike) {
    where.push(`name ILIKE $${num}`);
    values.push(`%${filterParams.nameLike}%`);
    num++;
  }


  return {
    where: `WHERE ${where.join(" AND ")}`,
    values: values,
  };
}

module.exports = { sqlForPartialUpdate, sqlForFilter };
