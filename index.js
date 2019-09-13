// change process' current dir
process.chdir(__dirname);

// load environment variables from `.env`
require("dotenv-defaults").config();

const express = require('express'),
    bodyParser = require("body-parser"),
    cors = require("cors"),
    app = express(),
    port = process.env.PORT || 8081,
    os = require("os"),
    path = require("path");

//enable CORS
app.use(cors());

// parse incoming request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// where temporary store files while uploading
let uploadPath;
if (process.env.FILEBROWSER_UPLOAD_PATH) {
    uploadPath = path.resolve(process.cwd(), process.env.FILEBROWSER_UPLOAD_PATH);
} else {
    uploadPath = os.tmpdir();
}

const LocalStorage = require("./sdk").LocalStorage;

// setup routes
app.use("/storage", require("./sdk").Router([
    new LocalStorage()
], {
    uploadPath
}));

// home route
app.get('/', (req, res) => res.send("Vuetify File Browser server"));

app.listen(port, () => console.log(`Vuetify File Browser server listening on port ${port}!`))