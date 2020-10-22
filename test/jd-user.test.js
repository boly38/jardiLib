const JardiDocs = require('../lib/JardiDocs');
const pjson = require('../package.json');
const assert = require('assert').strict;
const expect = require('chai').expect
const util = require('util')
const TestHelper =  require('./TestHelper');

const testUserDbUri = process.env.JARDI_TEST_USER_MONGO_URI;
let jd = null;

describe("JardiDocs as User", function() {
    before(function () {
      jd = new JardiDocs(testUserDbUri);
    });

    it("should get current configuration", async function() {
        await TestHelper.asPromise(jd, jd.init);
        var configuration = jd.getConfiguration();
        // DEBUG // console.info("configuration",configuration);
        expect(configuration).to.eql({
            db: {
              name:'test-jardin'
            },
            roles:[],
            version: pjson.version
        });
    });

    after(function () {
      if (jd != null) {
        jd.close();
      }
    });
});