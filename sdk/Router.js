const router = require("express").Router(),
    multer = require("multer");

module.exports = function (storages, options = {}) {
    let uploadPath = options.uploadPath || require("os").tmpdir();
    for (let storage of storages) {
        router.get(`/${storage.code}/list`, async function (req, res) {
            let result = await storage.list(req.query.path);
            return res.json(result);
        });

        router.post(`/${storage.code}/upload`, multer({ dest: uploadPath }).array("files"), async function (req, res) {
            await storage.upload(req.query.path, req.files);
            return res.sendStatus(200);
        });

        router.post(`/${storage.code}/mkdir`, async function (req, res) {
            await storage.mkdir(req.query.path, req.query.name);
            return res.sendStatus(200);
        });

        router.post(`/${storage.code}/delete`, async function (req, res) {
            await storage.delete(req.query.path);
            return res.sendStatus(200);
        });
    }
    return router;
}
