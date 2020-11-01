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
        await jd.init();
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

    it("should not listDocuments with wrong options", function() {
        jd.listDocuments({"limit":1090})
        .then((docs) => {
          should.fail("should not get here");
        })
        .catch((err) => {
           // DEBUG // console.info(JSON.stringify(err));
          expect(err.name).to.eql('InputValidationError');
          expect(err.data.field).to.eql('options');
        });
    });

    it("should count and listDocuments", async function() {
        // count
        assert.equal(await jd.count(), 10);

        // list
        var documents = await jd.listDocuments({}).catch((err) => { throw err});
        // DEBUG // console.info("documents", documents);
        var cosmosEntry = documents.filter(d => d.nom == 'jdTestContrib')[0];
        TestHelper.expectDocEntry(cosmosEntry, 'nom', 'jdTestContrib');
        TestHelper.expectDocEntry(cosmosEntry, 'nom_scientifique','Cosmos bipinnatus');
        TestHelper.expectDocEntry(cosmosEntry, 'type', ["fleur bi-annuelle", "vivace"]);
        TestHelper.expectDocEntry(cosmosEntry, 'familles', ["Astéracées", "Composées", "Tests"]);
        TestHelper.expectDocEntryPeriod(cosmosEntry, 'semi', [3,4,5]);
        TestHelper.expectDocEntryPeriod(cosmosEntry, 'plantation', [4,5,6]);
        TestHelper.expectDocEntryPeriod(cosmosEntry, 'floraison', [7,8,9,11]);
    });


    it("should listDocuments with limit and bookmark", async function() {
        var filter = {"limit":2};
        var documentsFirst = await jd.listDocuments(filter).catch((err) => { throw err});
        expect(documentsFirst.length).to.eql(2);

        filter = {"limit":3, "bookmark":documentsFirst[1]._id};
        var documentsSecond = await jd.listDocuments(filter).catch((err) => { throw err});
        expect(documentsSecond.length).to.eql(3);
    });

    after(function () {
      if (jd != null) {
        jd.close();
      }
    });
});