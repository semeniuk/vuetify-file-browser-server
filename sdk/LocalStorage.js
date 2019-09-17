const os = require("os"),
    nodePath = require("path"),
    fsPromises = require("fs").promises,
    readdir = fsPromises.readdir,
    stat = fsPromises.stat,
    rename = fsPromises.rename,
    unlink = fsPromises.unlink,
    lstat = fsPromises.lstat,
    util = require("util"),
    rimraf = util.promisify(require("rimraf"));


class LocalStorage {
    constructor(root) {
        this.code = "local";
        if (root) {
            this.root = root;
        } else if (process.env.FILEBROWSER_ROOT_PATH) {
            this.root = nodePath.resolve(process.cwd(), process.env.FILEBROWSER_ROOT_PATH);
        } else {
            this.root = os.homedir();
        }
    }

    async list(path) {
        try {
            let dirs = [],
                files = [];

            if (path[path.length - 1] !== "/") {
                path += "/";
            }
            console.log(this.root + path);
            let items = await readdir(this.root + path, { withFileTypes: true });

            for (let item of items) {
                let isFile = item.isFile(),
                    isDir = item.isDirectory();

                if (!isFile && !isDir) {
                    continue;
                }

                let result = {
                    type: isFile ? "file" : "dir",
                    path: path + item.name,
                };

                result.basename = result.name = nodePath.basename(result.path);

                if (isFile) {
                    let fileStat = await stat(this.root + result.path);
                    result.size = fileStat.size;
                    result.extension = nodePath.extname(result.path).slice(1);
                    result.name = nodePath.basename(result.path, "." + result.extension);
                    files.push(result);
                } else {
                    result.path += "/";
                    dirs.push(result);
                }
            }

            return dirs.concat(files);
        } catch (err) {
            console.error(err);
        }
    }

    async upload(path, files) {
        try {
            for (let file of files) {
                await rename(file.path, this.root + path + file.originalname);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async mkdir(path) {
        throw new Error("TBD");
    }

    async delete(path) {
        try {
            let stat = await lstat(this.root + path),
                isDir = stat.isDirectory(),
                isFile = stat.isFile();

            if (isFile) {
                await unlink(this.root + path);
            } else if (isDir) {
                console.log("Delete folder: ", this.root + path);
                await rimraf(this.root + path);
            }
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = LocalStorage;