// crud-server.js

require("dotenv").config();

const { main } = require("./src/server.js");

main([...process.argv], process.env);

//__EOF__
