const nodePath = require("path"),
    AWS = require("aws-sdk");

class S3Storage {
    constructor(accessKeyId, secretKey, endpointName, region, bucket, rootPath) {
        this.code = "s3";
        AWS.config.update({
            accessKeyId: accessKeyId,
            secretAccessKey: secretKey,
            region: region
        });

        const EP = new AWS.Endpoint(endpointName)

        this.S3 = new AWS.S3({
            apiVersion: "2006-03-01",
            params: { Bucket: bucket },
            endpoint: EP
        });

        if (rootPath && rootPath[0] === "/") {
            rootPath = rootPath.slice(1);
        }

        if (rootPath && rootPath[rootPath.length - 1] !== "/") {
            rootPath += "/";
        }

        this.rootPath = rootPath;
    }

    async list(path) {
        try {
            let dirs = [],
                files = [];

            let data = await this.S3.listObjectsV2({
                Delimiter: "/",
                Prefix: this.rootPath + path.slice(1)
            }).promise();

            for (let prefix of data.CommonPrefixes) {
                let dir = {
                    type: "dir",
                    path: "/" + prefix.Prefix.slice(this.rootPath.length)
                };
                dir.basename = dir.name = nodePath.basename(dir.path);
                dirs.push(dir);
            }

            for (let item of data.Contents.filter(item => item.Key != data.Prefix)) {
                let file = {
                    type: "file",
                    path: "/" + item.Key.slice(this.rootPath.length),
                    size: item.Size,
                    lastModified: item.LastModified,
                    eTag: item.ETag
                };
                file.basename = nodePath.basename(file.path);
                file.extension = nodePath.extname(file.path).slice(1);
                file.name = nodePath.basename(file.path, "." + file.extension);
                files.push(file);
            }
            return dirs.concat(files);

        } catch (err) {
            console.error(err);
        }
    }

    async upload(path, files) {
        try {
            const fs = require("fs");
            path = this.rootPath + path.slice(1);

            for (let file of files) {
                var fileStream = fs.createReadStream(file.path);
                await this.S3.upload({
                    Key: path + file.originalname,
                    Body: fileStream
                }).promise();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async mkdir(path) {
        path = this.rootPath + path.slice(1) + "/";
        await this.S3.upload({
            Key: path,
            Body: ""
        }).promise();
    }

    async deleteFile(key) {
        await this.S3.deleteObject({ Key: this.rootPath + key }).promise();
    }

    async deleteDir(prefix) {
        const listedObjects = await this.S3.listObjectsV2({
            Prefix: this.rootPath + prefix
        }).promise();

        if (listedObjects.Contents.length === 0) {
            return;
        }

        const deleteParams = {
            Delete: { Objects: [] }
        };

        listedObjects.Contents.forEach(({ Key }) => {
            deleteParams.Delete.Objects.push({ Key });
        });

        await this.S3.deleteObjects(deleteParams).promise();

        if (listedObjects.IsTruncated) {
            await this.deleteDir(prefix);
        }
    }

    async delete(path) {
        try {
            path = path.slice(1);
            if (path[path.length - 1] == "/") {
                await this.deleteDir(path);
            } else {
                await this.deleteFile(path);
            }
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = S3Storage;