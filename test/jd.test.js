const JardiDocs = require('../lib/JardiDocs');
const assert = require('assert').strict;
const TestHelper =  require('./TestHelper');

const testDbUri = process.env.JARDI_TEST_MONGO_URI;
const testAdminDbUri = process.env.JARDI_TEST_ADMIN_MONGO_DB_NAME;

let jd = null;

describe("JardiDocs integration tests", function() {
    before(function () {
      jd = new JardiDocs(testDbUri, testAdminDbUri);
    });

    it("should init", async function() {
        await TestHelper.asPromise(jd, jd.init);
    });

    it("should contribute, accept, count and listDocuments", async function() {
        var contribName = "jdTestContrib";

        await TestHelper.asPromise(jd, jd.init);

        await jd.JardiDoc.deleteMany({});
        await jd.JardiContrib.deleteMany({});

        assert.equal(await TestHelper.asPromise(jd, jd.contribsCount), 0);
        await TestHelper.asPromise(jd, jd.contribute, {nom:contribName});
        assert.equal(await TestHelper.asPromise(jd, jd.contribsCount), 1);
        assert.equal(await TestHelper.asPromise(jd, jd.count), 0);

        await TestHelper.asPromise(jd, jd.acceptContribution, contribName);
        assert.equal(await TestHelper.asPromise(jd, jd.count), 1);

        var documents = await TestHelper.asPromise(jd, jd.listDocuments, {champs:['nom']})
           .catch((err) =>  console.error("err",err));
        assert.equal(documents[0].nom, contribName);
    });

    after(function () {
      if (jd != null) {
        jd.close();
      }
    });
});