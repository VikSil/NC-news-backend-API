const request = require("supertest");
const server = require("../middleware/server");
const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const testData = require("../db/data/test-data/index.js");

afterAll(() => {
  return db.end();
});

beforeEach(() => {
  return seed(testData);
});

describe("server --> nc_news_test", () =>{
    describe("General error handling", () =>{ 
        test("Returns status code 404 to request to non-existant endpoint", () => {
            return request(server).get("/api/thisDoesNotExist").expect(404);
        });
        test("Returns error message to request to non-existant endpoint", () => {
            return request(server)
              .get("/api/thisDoesNotExist")
              .then((result) => {
                expect(result.error.text).toEqual("Invalid URL");
              });
        });
    });
    
    describe("GET /api", () =>{ 
      test("Returns status code 200 and object with correct objects to a correct requests", () => {
        return request(server)
          .get("/api")
          .expect(200)
          .expect("Content-Type", /json/)
          .then(({ body }) => {
            const {endpoints} = body;
            expect(endpoints).toBeInstanceOf(Object);
            const allEndpoints = Object.keys(endpoints);
            expect(allEndpoints.length).toBeGreaterThanOrEqual(1);
            allEndpoints.forEach((endpoint)=>{
              expect(endpoints[endpoint]).toBeInstanceOf(Object);
              expect(Object.keys(endpoints[endpoint])).toHaveLength(4);
              expect(typeof endpoints[endpoint].description).toBe("string");
              expect(endpoints[endpoint].queries).toBeInstanceOf(Array);
              expect(endpoints[endpoint].requestBody).toBeInstanceOf(Object);
              expect(typeof endpoints[endpoint].description).toBe("string");
            })
          });
      });
      test("The response object correctly documents endpoints and responses", async() => {
        const response = await request(server).get("/api");
        const { endpoints } = response.body;
        const allEndpoints = Object.keys(endpoints);
        for (let i= 0; i<allEndpoints.length; i++){
          const commandAndAddress = allEndpoints[i].split(" ");
          if (commandAndAddress[0] === "GET") {
            //this will be reassigned depending on url
            let endpointResponse = null;
            const addressAndParams = commandAndAddress[1].split(":");
            if (addressAndParams.length === 1) {// if url has no parameters
              endpointResponse = await request(server).get(
                commandAndAddress[1]
              );
            } else {
              // if url has parameters
              if (addressAndParams[1].includes("id")) {// if parameter is id
                const address = addressAndParams[0] + "1"; // pick the first object by id
                endpointResponse = await request(server).get(address);
              }
            }
            const { body } = endpointResponse;
            const { statusCode } = endpointResponse;
            const expectedBody = endpoints[allEndpoints[i]].exampleResponse;
            expect(statusCode).toBe(200);
            expect(Object.keys(body)).toEqual(Object.keys(expectedBody));
          }
        }
      }); 
    });

    describe("GET /api/topics", () =>{ 
        test("Returns status code 200 to correct requests", () => {
            return request(server).get("/api/topics").expect(200);
        });
        test("Returns a json body to correct requests", () => {
        return request(server)
          .get("/api/topics")
          .expect("Content-Type", /json/)
        });
        test("Response body contains an array of correctly formatted objects", () => {
            return request(server)
              .get("/api/topics")
              .then(({ body }) => {
                // topics are nested in an array
                expect(body.topics).toBeInstanceOf(Array);
                body.topics.forEach((topic) => {
                  // each topic is an object
                  expect(topic).toBeInstanceOf(Object);
                  // each topic has two and only two keys
                  expect(Object.keys(topic)).toHaveLength(2)
                  // each object has correct keys of correct data type
                  expect(typeof topic.slug).toBe("string");
                  expect(typeof topic.description).toBe("string");
                });
              });
        });
    });

    describe("GET /api/article/:article_id", () => {
      test("Returns status code 200 and correctly formatted body to a correct requests", () => {
        return request(server)
          .get("/api/articles/1")
          .expect(200)
          .expect("Content-Type", /json/)
          .then(({ body }) => {
            const {article} = body
            expect(article).toBeInstanceOf(Object);
            expect(Object.keys(article)).toHaveLength(8);
            expect(typeof article.article_id).toBe("number");
            expect(typeof article.votes).toBe("number");
            expect(typeof article.title).toBe("string");
            expect(typeof article.topic).toBe("string");
            expect(typeof article.author).toBe("string");
            expect(typeof article.body).toBe("string");
            expect(typeof article.created_at).toBe("string");
            expect(typeof article.article_img_url).toBe("string");
          });
      });
      test("Returns status code 200 and correctly formatted body to a correct requests", () => {
        return request(server)
          .get("/api/articles/1")
          .expect(200)
          .expect("Content-Type", /json/)
          .then(({ body }) => {
            const { article } = body;
            expect(article).toBeInstanceOf(Object);
            expect(Object.keys(article)).toHaveLength(8);
            expect(typeof article.article_id).toBe("number");
            expect(typeof article.votes).toBe("number");
            expect(typeof article.title).toBe("string");
            expect(typeof article.topic).toBe("string");
            expect(typeof article.author).toBe("string");
            expect(typeof article.body).toBe("string");
            expect(typeof article.created_at).toBe("string");
            expect(typeof article.article_img_url).toBe("string");
          });
      });
      test("Returns status code 404 if article_id does not exist in the DB", () => {
        return request(server)
          .get("/api/articles/0")
          .expect(404)
          .then((result) => {
            expect(result.error.text).toEqual("Not Found");
          });
      });
      test("Returns status code 400 if article_id is in invalid format", () => {
        return request(server)
          .get("/api/articles/first")
          .expect(400)
          .then((result) => {
            expect(result.error.text).toEqual("Invalid URL");
          });
      });
      test("Returns status code 400 if injection is attempted via url", () => {
        return request(server)
          .get("/api/articles/first; DROP table articles;")
          .expect(400)
          .then((result) => {
            expect(result.error.text).toEqual("Invalid URL");
          });
      });


    });
});
