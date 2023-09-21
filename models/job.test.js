"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let j1Id
async function setJ1Id(){
  const j1 = await db.query(`
  SELECT id
    FROM jobs
    WHERE title = 'doctor 1'
  `);

  j1Id = j1.rows[0].id;
  }
setJ1Id();


/************************************** create */

describe("create", function () {
  const newJob = {
    title: "doctor",
    salary: 100,
    equity: 0.1,
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "doctor",
      salary: 100,
      equity: "0.1",
      company_handle: "c1",
    });

    const id = job.id;

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [id]);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "doctor",
        salary: 100,
        equity: "0.1",
        company_handle: "c1",
      },
    ]);
  });

  test("bad request with missing data", async function () {
    try {
      await Job.create({});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with bad data", async function () {
    try {
      await Job.create(
        {
          title: "doctor",
          salary: 100,
          equity: 0,
          company_handle: "doesntexist",
        }
      );
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "doctor 1",
        salary: 100,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "doctor 2",
        salary: 200,
        equity: "0.1",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "doctor 3",
        salary: 300,
        equity: "0.2",
        company_handle: "c1",
      },
    ]);
  });

  test("works: with filter where title is '3'", async function () {
    let jobs = await Job.findAll({ title: '3'});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "doctor 3",
        salary: 300,
        equity: "0.2",
        company_handle: "c1",
      },
    ]);
  });

  test("works: with filter where minSalary is 200", async function () {
    let jobs = await Job.findAll({ minSalary: 200 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "doctor 2",
        salary: 200,
        equity: "0.1",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "doctor 3",
        salary: 300,
        equity: "0.2",
        company_handle: "c1",
      },
    ]);
  });

  test("works: with filter where hasEquity is true", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "doctor 2",
        salary: 200,
        equity: "0.1",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "doctor 3",
        salary: 300,
        equity: "0.2",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(j1Id);
    expect(job).toEqual(
      {
        id: expect.any(Number),
        title: "doctor 1",
        salary: 100,
        equity: "0",
        company_handle: "c1",
      }
    );
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "skiier",
    salary: 99999999,
    equity: .99
  };

  test("works", async function () {
    let job = await Job.update(j1Id, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateData,
      company_handle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [j1Id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "skiier",
      salary: 99999999,
      equity: ".99",
      company_handle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "hat maker",
      salary: 23,
      equity: null
    };

    let job = await Job.update(j1Id, updateDataSetNulls);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateDataSetNulls,
      company_handle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [j1Id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "hat maker",
      salary: 23,
      equity: "0",
      company_handle: "c1"
    }]);
  });

  test("bad request if company_handle in update data", async function () {
    try {
      await Job.update(j1Id, {
        title: "shoe shiner",
        company_handle: "c3"
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });


  test("bad request with no data", async function () {
    try {
      await Job.update(j1Id, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy(); // TODO: is this the same as checking toThrow(BadRequestError)
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(j1Id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [j1Id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** sqlForFilter*/

describe("sqlForFilter", function () {
  test("works: returns object with where clause and values array", function () {
    const result = Job.sqlForFilter(
      {
        title: "name",
        minSalary: 7,
        hasEquity: true
      });

    expect(result).toEqual({
      where: `WHERE title ILIKE $1 AND minSalary >= $2 AND equity > 0`,
      values: ["%name%", 7]
    });
  });

  test("returns default if only filter is hasEquity = false", function () {
    const result = Job.sqlForFilter({
      hasEquity: false
    });
    expect(result).toEqual({ where: "", values: [] });
  });

  test("returns default for empty obj", function () {
    const result = Job.sqlForFilter({});
    expect(result).toEqual({ where: "", values: [] });
  });
});
