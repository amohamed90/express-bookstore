process.env.NODE_ENV = "test";

const request = require("supertest");
const Book = require("../models/book")

const app = require("../app");
const db = require("../db");

let book1;

describe("Test Books Routes", () => {
  beforeEach(async () => {
    await db.query("DELETE FROM books");

    book1 = await Book.create({
      isbn: "1234567890",
      amazon_url: "test.com",
      author: "me",
      language: "en",
      pages: 100,
      publisher: "Houghton",
      title: "Best Book Ever",
      year: 2000
    });
  });

  test("can get a list of all the books", async () => {
    let resp = await request(app)
      .get('/books');

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ books: expect.any(Array) });
  });

  test("can get a single book", async () => {
    let resp = await request(app)
      .get(`/books/${book1.isbn}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ book: expect.any(Object) });
  });

  test("can post a new book to the db", async () => {
    let resp = await request(app)
      .post('/books')
      .send({
        isbn: "0987654321",
        amazon_url: "test.com",
        author: "me",
        language: "en",
        pages: 100,
        publisher: "Houghton",
        title: "Best Book Ever",
        year: 2000
      });
    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({ book: expect.any(Object) });

    const getBooksResp = await request(app).get('/books');
    expect(getBooksResp.statusCode).toBe(200);
    expect(getBooksResp.body.books).toHaveLength(2);
    expect(getBooksResp.body.books).toContainEqual({
      isbn: "0987654321",
      amazon_url: "test.com",
      author: "me",
      language: "en",
      pages: 100,
      publisher: "Houghton",
      title: "Best Book Ever",
      year: 2000
    });
  });

  test("posting a book with missing info throws error", async () => {
    let resp = await request(app)
      .post('/books')
      .send({
        isbn: "0987654321",
        amazon_url: "test.com",
        author: "me",
        language: "en",
        pages: 100,
        publisher: "Houghton", //left out title information
        year: 2000
      });

    expect(resp.statusCode).toBe(400);
  });

  test("posting a book with invalid data types throws an error", async () => {
    let resp = await request(app)
      .post('/books')
      .send({
        isbn: 1234567890, //number instead of string
        amazon_url: "test.com",
        author: "me",
        language: "en",
        pages: 100,
        publisher: "Houghton",
        title: "Best Book Ever",
        year: 2000
      });
    expect(resp.statusCode).toBe(400);
  })

  test("can successfully delete a book", async () => {
    let resp = await request(app)
      .delete(`/books/${1234567890}`);

    expect(resp.statusCode).toBe(200);

    let booksResp = await request(app)
      .get('/books');

    expect(booksResp.body.books).toHaveLength(0);
  })

  test("can successfully update book information", async () => {
    let resp = await request(app)
      .put(`/books/${1234567890}`)
      .send({
        isbn: book1.isbn,
        amazon_url: "www.amazon.com",
        author: "me",
        language: "English",
        pages: 400,
        publisher: "Houghton",
        title: "Best Book Ever",
        year: 2000
      });

    expect(resp.statusCode).toBe(200);

    let bookResp = await request(app)
      .get(`/books/${book1.isbn}`);

    expect(bookResp.body.book.language).toBe("English");
  })

  test("submitting update with missing fields throws error", async () => {
    let resp = await request(app)
      .put(`/books/${1234567890}`)
      .send({
        isbn: book1.isbn,
        amazon_url: "www.amazon.com",
        author: "me",
        language: "English",
        pages: 400,
        publisher: "Houghton", //removed title field
        year: 2000
      });

    expect(resp.statusCode).toBe(400);
  })

  test("submitting update with invalid data types throws error", async () => {
    let resp = await request(app)
      .put(`/books/${1234567890}`)
      .send({
        isbn: book1.isbn,
        amazon_url: "www.amazon.com",
        author: "me",
        language: "English",
        pages: 400,
        publisher: "Houghton",
        title: 3456, // title should be string
        year: 2000
      });

    expect(resp.statusCode).toBe(400);
  })

});

afterAll(async function () {
  await db.end();
});
