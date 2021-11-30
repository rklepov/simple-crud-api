# RS School 2021Q4 [NodeJS Course](https://github.com/rolling-scopes-school/basic-nodejs-course "Welcome to the Rolling Scopes School Node.js course!")
## [Simple CRUD API](https://github.com/rolling-scopes-school/basic-nodejs-course/blob/master/descriptions/simple-crud-api.md "Simple CRUD API")

This is the implementation of the simple CRUD API web server which uses in-memory database.

### Requirements
The assumption is that **node** `v16.13.0` is used.

### Installation
1. Clone the repo:
```
git clone https://github.com/rklepov/simple-crud-api.git
```
2. Go to the directory with the repo created on step 1.
3. Switch to `task/03-simple-crud-api` branch:
```
git checkout task/03-simple-crud-api
```
4. Install the dependencies with `npm`:
```
npm install
```

### Usage
1. Create `.env` file in the root directory of the repo to configure the server port number (you can use the provided [`.env.example`](https://github.com/rklepov/simple-crud-api/edit/task/03-simple-crud-api) as a reference).
2. Start the server either in *dev* mode under [**nodemon**](https://www.npmjs.com/package/nodemon) with `npm run start:dev` command or in *prod* mode (as a [**webpack**](https://webpack.js.org/concepts) bundle) with `npm run start:prod`. In either case the result should be the same: the server starts listening on the port provided in *p*.1.
3. You can send a request to the API using the following endpoints: `http://localhost:<port>/person/<id>` and `http://localhost:<port>/person`.
4. It's recommended to use [**Postman**](https://learning.postman.com/docs/getting-started/installation-and-updates/) API client tool to send the requests to the server.
5. You can make GET, POST, PUT, and DELETE requests (and also PATCH as an extra feature).
7. The format of the requests follows the task [requirements](https://github.com/rolling-scopes-school/basic-nodejs-course/blob/master/descriptions/simple-crud-api.md). The body of POST and PUT requests should have the schema:
```
{
  "name": string,
  "age": number,
  "hobbies": [array of string or empty array]
}
```
For example:
```
{
    "name": "John Silver",
    "age": 40,
    "hobbies": [
        "maps",
        "parrots",
        "rum"
    ]
}
```
⚠️ There's a small problem with **DELETE** request in this version: you need to pass `"content-type": "application/json"` and any valid JSON in the request body (like the simplest `{}`) to make it actually work. This is due to the lack of testing unfortunately ☹️

⚠️ I also don't perform thorough validation of the person object passed with POST and PUT requests: just check that the 3 required fields from the task description are present but don't check their types. My point here is that implementing good schema validation logic is far beyond the scope of this educational task. And simply testing the types of the object properties with certain names is just not interesting and again not directly related to the purpose of the exercise. So I deliberately decided to omit this piece.

💡 Try making a POST request to `http://localhost:<port>/person` with `"name": "Harry Potter"` to check *500 Internal server error* scenario.

6. Remember that the database is in-memory meaning that its contents is lost with the server restart.

### Testing 
```
npm run test
```
