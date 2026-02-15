const https = require('https');
const { CONFIG } = require('../config/constants');

class TranslatorService {
    async translateHeaders(headers) {
        console.log("Translating headers using RapidAPI...");

        const postData = JSON.stringify({
            from: 'es',
            to: 'en',
            q: headers
        });

        const options = {
            hostname: CONFIG.RAPID_API_HOST,
            path: '/t',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': CONFIG.RAPID_API_HOST,
                'x-rapidapi-key': CONFIG.RAPID_API_KEY,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        if (!body) {
                            return reject(new Error('Empty response from translation API'));
                        }
                        try {
                            const json = JSON.parse(body);
                            resolve(json);
                        } catch (e) {
                            reject(new Error(`Failed to parse response: ${e.message}`));
                        }
                    } else {
                        reject(new Error(`API Error: ${res.statusCode} ${body}`));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(postData);
            req.end();
        });
    }
}

module.exports = new TranslatorService();
