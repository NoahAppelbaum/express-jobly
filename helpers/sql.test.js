"use strict";

const { sqlForPartialUpdate } = require("./sql");
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
