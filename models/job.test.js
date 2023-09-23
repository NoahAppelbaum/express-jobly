"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100,
    equity: 0.1,
    companyHandle: "c1",
  };


  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1",
    });

    const id = job.id;

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null equity", async function() {
    newJob.equity = null;
    let job = await Job.create(newJob);
    expect(job).toEqual(
      {
      id: expect.any(Number),
      title: "new",
      salary: 100,
      equity: null,
      companyHandle: "c1",
      });
  })

  test("bad request with missing data", async function () {
    try {
      await Job.create({ "companyHandle": "c1" });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("not found: bad company handle", async function () {
    try {
      await Job.create(
        {
          title: "new",
          salary: 100,
          equity: 0,
          companyHandle: "doesntexist",
        }
      );
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
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
        title: "j1",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.2",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: with filter where title is '3'", async function () {
    let jobs = await Job.findAll({ title: '3'});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.2",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: with filter where minSalary is 200", async function () {
    let jobs = await Job.findAll({ minSalary: 200 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.2",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: with filter where hasEquity is true", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0.2",
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(jobIds[0]);
    expect(job).toEqual(
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      }
    );
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(3000);
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
    let job = await Job.update(jobIds[0], updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "skiier",
      salary: 99999999,
      equity: "0.99",
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [jobIds[0]]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "skiier",
      salary: 99999999,
      equity: "0.99",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "hat maker",
      salary: 23,
      equity: null
    };

    let job = await Job.update(jobIds[0], updateDataSetNulls);
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateDataSetNulls,
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [jobIds[0]]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "hat maker",
      salary: 23,
      equity: null,
      companyHandle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(3000, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });


  test("bad request with no data", async function () {
    try {
      await Job.update(jobIds[0], {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy(); // TODO: is this the same as checking toThrow(BadRequestError)
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIds[0]);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [jobIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(3000);
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
      where: `WHERE title ILIKE $1 AND salary >= $2 AND equity > 0`,
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
