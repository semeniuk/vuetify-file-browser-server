# Vuetify File Browser Server & Backend SDK

Backend for [Vuetify File Browser Component](https://www.npmjs.com/package/vuetify-file-browser)

## Usage

### As standalone server

```bash
git clone https://github.com/semeniuk/vuetify-file-browser-server
cd vuetify-file-browser-server
cp .env.defaults .env
```

Then set configuration properties in `.env` file. After this run the server:

```bash
npm start
```

### As Express.js router

```bash
npm i vuetify-file-browser-server
```

```js
const express = require("express"),
    app = express(),
    cors = require("cors"),
    bodyParser = require("body-parser"),
    path = require("path"),
    sdk = require("vuetify-file-browser-server/sdk");

// enable CORS
app.use(cors());

// parse incoming request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// get AWS configuration from process.env
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET, FILEBROWSER_AWS_ROOT_PATH } = process.env;

// setup routes
app.use("/storage", sdk.Router([
    new sdk.LocalStorage(path.resolve(__dirname, "./files")),
    new sdk.S3Storage(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET, FILEBROWSER_AWS_ROOT_PATH)
], {
    uploadPath: path.resolve(__dirname, "./upload")
}));

app.listen(process.env.PORT || 8081);
```

### Custom implementation

See [`vuetify-file-browser-server/sdk/Router`](https://github.com/semeniuk/vuetify-file-browser-server/blob/master/sdk/Router.js) for example how to use `LocalStorage` and `S3Storage`