"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

let j1Id;

beforeAll(commonBeforeAll);
beforeAll(setJ1Id);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

async function setJ1Id(){
  const j1 = await db.query(`
  SELECT id
    FROM jobs
    WHERE title = 'doctor 1'
  `);

  j1Id = j1.rows[0].id;
  }


/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 1000,
    equity: 0,
    companyHandle: "c1",
  };

  test("works for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob,
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);

  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob);
    expect(resp.statusCode).toEqual(401);

  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data types", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: 10,
          salary: "string",
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request empty string title", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "",
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              title: "j1",
              salary: 100,
              equity: "0",
              companyHandle: "c1"
            },
            {
              title: "j2",
              salary: 200,
              equity: "0.1",
              companyHandle: "c1",
            },
            {
              title: "j3",
              salary: 300,
              equity: "0.2",
              companyHandle: "c1",
            },
          ],
    });
  });

  test("ok with filter", async function() {
    const resp = await request(app).get("/jobs").query({
      "title": "1"
    });
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j1",
          salary: 100,
          equity: "0",
          companyHandle: "c1"
        }
      ]
    })

  })

  test("works with equity filter", async function() {
    const resp = await request(app).get("/jobs").query({
      hasEquity: true
    });
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j2",
          salary: 200,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          title: "j3",
          salary: 300,
          equity: "0.2",
          companyHandle: "c1",
        },
      ]
    })
  })

  test("error: extraneous filter param", async function() {
    const resp = await request(app).get("/jobs").query({
      "size": "large"
    });
    expect(resp.statusCode).toEqual(400)
  })
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${j1Id}`);
    expect(resp.body).toEqual({
      job: {
        title: "j1",
        salary: 100,
        equity: 0,
        companyHandle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${j1Id}`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job:  {
        id: expect.any(Number),
        title: "J1-new",
        salary: 100,
        equity: 0,
        companyHandle: "c1"
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${j1Id}`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${j1Id}`)
        .send({
          title: "J1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/jobs/nope`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${j1Id}`)
        .send({
          companyHandle: "bad request",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${j1Id}`)
        .send({
          title: 7,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:handle", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${j1Id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: j1Id });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${j1Id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${j1Id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
