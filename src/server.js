// server.js

const http = require("http");

const { pipeline } = require("stream/promises");

const { Options } = require("./options.js");
const Database = require("./db.js");

const { PeopleRegistryHandler } = require("./http/api-endpoints.js");
const { RequestBodyStream } = require("./http/streams.js");
const HTTPResponse = require("./http/responses.js");

async function start(opts) {
    const routes = {
        person: new PeopleRegistryHandler(new Database()),
    };

    const server = http.createServer(async (req, res) => {
        try {
            // taking the request header fields
            let method = req.method;
            let contentType = req.headers["content-type"];
            let url = new URL(req.url, `http://${req.headers.host}`);

            console.log(
                `[${new Date().toUTCString()}]`,
                `Request header ${method}, { ${contentType} }, [ ${url.pathname} ]`
            );

            // checking the endpoint
            let path = url.pathname.split("/");
            let endpoint = routes[path[1]];
            if (!endpoint) {
                HTTPResponse.NotFound("The resource doesn't exist on the server", { path }).sendTo(res);
                return;
            }

            // checking supported content type
            if (method !== "GET" && contentType !== "application/json") {
                HTTPResponse.BadRequest(`Unsupported request content type for ${method}`, {
                    "content-type": contentType,
                    expected: "application/json",
                }).sendTo(res);
                return;
            }

            // reading the request body
            let body = new RequestBodyStream();
            await pipeline(req, body);

            console.log(`[${new Date().toUTCString()}]`, `Request body ${body.buffer}`);

            // processing the request
            endpoint.dispatch(method, path.slice(2), JSON.parse(body.buffer)).sendTo(res);
        } catch (e) {
            console.error(`[${new Date().toUTCString()}]`, e);

            if (e instanceof SyntaxError) {
                HTTPResponse.BadRequest("JSON parse failed", { [e.constructor.name]: e.message }).sendTo(res);
                return;
            }

            HTTPResponse.InternalError("Internal server error", { [e.constructor.name]: e.message }).sendTo(res);
            // re-throwing the error will cause the server to stop
            // throw e;
        }
    });

    return new Promise((resolve, reject) => {
        server
            .listen(opts.port)
            .on("listening", () => {
                resolve(opts.port);
            })
            .on("error", (e) => {
                reject(e);
            });
    });
}

async function main(argv, env) {
    try {
        let port = await start(new Options(argv.slice(2), env));
        console.log(`[${new Date().toUTCString()}]`, `Server listening on port ${port}`);
    } catch (e) {
        console.error(e.toString());
        console.error();
        Options.printUsage(argv.slice(0, 2), (...msg) => console.error(...msg));
        console.error();
        process.exit(1); // ? can we do the exit in the top level module ?
    }
}

module.exports = main;

//__EOF__
