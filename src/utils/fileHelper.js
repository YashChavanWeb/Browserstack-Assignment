const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

class FileHelper {
    static ensureDirectoryExistence(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    static downloadImage(url, filepath) {
        return new Promise((resolve, reject) => {
            if (!url) return resolve();
            if (url.startsWith('//')) url = 'https:' + url;

            const client = url.startsWith('https') ? https : http;

            const file = fs.createWriteStream(filepath);
            client.get(url, (response) => {
                // Handle Redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    file.close();
                    fs.unlink(filepath, () => { });
                    if (response.headers.location) {
                        return this.downloadImage(response.headers.location, filepath)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        return reject(new Error("Redirect with no location header"));
                    }
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlink(filepath, () => { });
                    return reject(new Error(`Status ${response.statusCode}`));
                }

                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(filepath, () => { });
                reject(err);
            });
        });
    }

    static saveToFile(filename, content) {
        fs.writeFileSync(filename, content);
    }
}

module.exports = FileHelper;
