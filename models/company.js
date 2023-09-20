"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilter } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Accepts optional object filterParams, to filter results
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filterParams = {}) {
    const filter = Company.sqlForFilter(filterParams);

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${filter.where}
        ORDER BY name`,
      filter.values);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
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
  static sqlForFilter(filterParams) {
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
}


module.exports = Company;
