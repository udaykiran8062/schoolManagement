import app from "../../app.mjs";
import request from "supertest";
import dbConnection from "../../config/db.config.mjs";

beforeAll(async () => {
  // Ensure the database is initialized before running any tests
  await dbConnection.authenticate();
  await dbConnection.sync();
  console.log("Database connected and synchronized before tests");
});

afterAll(async () => {
  // Close the database connection after tests
  await dbConnection.close();
  console.log("Database connection closed after tests");
});

describe("Rate Limiter Middleware", () => {
  it("should allow up to 1000 requests and block the 1001st request", async () => {
    const requests = [];

    for (let i = 1; i < 1001; i++) {
      requests.push(request(app).get("/v1/auth/test"));
    }

    const responses = await Promise.all(requests);

    // Check that all 1000 requests were successful
    responses.forEach(response => {
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Success");
    });

    // 1001st request should be blocked
    const blockedResponse = await request(app).get("/v1/auth/test");
    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.body.message).toBe("Too many requests, please try again later.");
  }, 20 * 1000);
});
