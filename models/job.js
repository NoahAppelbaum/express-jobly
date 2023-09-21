"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilter } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({ title, salary, equity, companyHandle }) {
    // TODO: do we want to allow dupes?
    const result = await db.query(`
                INSERT INTO jobs (title,
                                       salary,
                                       equity,
                                       company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity
                    company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle
    ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Accepts optional object filterParams, to filter results
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filterParams = {}) {
    const filter = Job.sqlForFilter(filterParams);

    const jobsRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        ${filter.where}
        ORDER BY company_handle`,
      filter.values);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity
               company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${handleVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  /** Takes in an object of filter params.
  *
  * Returns an object with a SQL WHERE clause and an array of values like:
  *
  * { where: "WHERE name ILIKE $1", values: ['%name%'] }
  *
  * Filter params must be one of nameLike, minEmployees, or maxEmployees.
  */
  static sqlForFilter(filterParams) {
    if (filterParams.minEmployees && filterParams.maxEmployees) {
      if (filterParams.minEmployees > filterParams.maxEmployees) {
        throw new BadRequestError("minEmployees must be less than maxEmployees.");
      }
    }

    const where = [];
    const values = [];
    let num = 1;

    if (filterParams.minEmployees) {
      where.push(`num_employees >= $${num}`);
      values.push(filterParams.minEmployees);
      num++;
    }

    if (filterParams.maxEmployees) {
      where.push(`num_employees <= $${num}`);
      values.push(filterParams.maxEmployees);
      num++;
    }

    if (filterParams.nameLike) {
      where.push(`name ILIKE $${num}`);
      values.push(`%${filterParams.nameLike}%`);
      num++;
    }

    return (values.length
      ? {
      where: `WHERE ${where.join(" AND ")}`,
      values: values,
      }
      : { where: "", values: [] });
  }
}


module.exports = Job;
