const JardiDocs = require('../lib/JardiDocs');
const assert = require('assert').strict;

function asPromise(context, callbackFunction, ...args) {
    return new Promise((resolve, reject) => {
        args.push((err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
        if (context) {
            callbackFunction.call(context, ...args);
        } else {
            callbackFunction(...args);
        }
    });
}
let jd = null;

describe("JardiDocs integration tests", function() {
    it("JardiDocs should be able to init", async function() {
        let jd = new JardiDocs(process.env.JARDI_MONGO_URI, process.env.JARDI_ADMIN_MONGO_DB_NAME);
        await asPromise(jd, jd.init);
        jd.close();
    });
});