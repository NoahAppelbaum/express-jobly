"use strict";

const { sqlForPartialUpdate, sqlForFilter } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("works: returns object with setCols and values keys", function () {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya" },
      { firstName: "first_name" }
    );

    expect(result).toEqual({
      setCols: `"first_name"=$1`,
      values: ["Aliya"]
    });
  });

  test("throws 400: empty dataToUpdate argument", function () {
    expect(() => sqlForPartialUpdate({}, { firstName: "first_name" }))
      .toThrow(BadRequestError);
  });
});

describe("sqlForFilter", function () {
  test("works: returns object with where clause values array", function () {
    const result = sqlForFilter(
      {
        nameLike: "name",
        maxEmployees: "7",
        minEmployees: "4"
      });

    expect(result).toEqual({
      where: `WHERE num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3`,
      values: [4, 7, "%name%"]
    });
  });


  test("returns appropriate values for empty obj", function () {
    const result = sqlForFilter({});
    expect(result).toEqual({ where: "", values: [] });
  });


  test("throws error on minEmployees>maxEmployees", function () {
    expect(() => sqlForFilter(
      {
        maxEmployees: "1",
        minEmployees: "2"
      }
    ))
      .toThrow(BadRequestError);
  });

});
