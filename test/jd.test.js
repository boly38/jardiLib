const JardiDocs = require('../lib/JardiDocs');
const assert = require('assert').strict;
const expect = require('chai').expect
const TestHelper =  require('./TestHelper');

const testDbUri = process.env.JARDI_TEST_MONGO_URI;
const testAdminDbUri = process.env.JARDI_TEST_ADMIN_MONGO_DB_NAME;

let jd = null;

function _expectDocEntry(entry, field, value) {
  expect(entry[field], 'doc entry['+field+']').to.eql(value);
}
function _expectDocEntryPeriod(entry, field, value) {
  expect(entry[field].m, 'doc entry['+field+'].m').to.eql(value);
}

describe("JardiDocs", function() {
    before(function () {
      jd = new JardiDocs(testDbUri, testAdminDbUri);
    });

    it("should init", async function() {
        await TestHelper.asPromise(jd, jd.init);
        await jd.JardiDoc.deleteMany({});
        await jd.JardiContrib.deleteMany({});
    });

    it("should get current configuration", async function() {
        var configuration = jd.getConfiguration();
        // DEBUG // console.info("configuration",configuration);
        expect(configuration).to.eql({
            db: {
              name:'test-jardin'
            },
            adminDb: {
              name:'test-jardinAdmin'
            },
            roles:['admin','owner']
        });
    });

    it("should add local database", async function() {
        var upsertsResults = await TestHelper.asPromise(jd, jd.addLocalDatabase)
            .catch((err) => {
                console.info("CATCH", err);
            });
        // DEBUG // console.info("add results=",upsertsResults);
    });

    it("should count and listDocuments", async function() {
        // count
        assert.equal(await TestHelper.asPromise(jd, jd.count), 10);

        // list
        var documents = await TestHelper.asPromise(jd, jd.listDocuments, {})
           .catch((err) =>  console.error("err",err));
        var cosmosEntry = documents.filter(d => d.nom == 'Cosmos')[0];
        _expectDocEntry(cosmosEntry, 'nom', 'Cosmos');
        _expectDocEntry(cosmosEntry, 'nom_scientifique','Cosmos bipinnatus');
        _expectDocEntry(cosmosEntry, 'type', ["fleur annuelle", "vivace"]);
        _expectDocEntry(cosmosEntry, 'familles', ["Astéracées", "Composées"]);
        _expectDocEntryPeriod(cosmosEntry, 'semi', [3,4,5]);
        _expectDocEntryPeriod(cosmosEntry, 'plantation', [4,5,6]);
        _expectDocEntryPeriod(cosmosEntry, 'floraison', [7,8,9,10]);
    });

    it("should contribute, accept, count and listDocuments", async function() {
        var testContrib = {
            "nom": "jdTestContrib",
            "nom_scientifique": "Cosmos bipinnatus",
            "type": ["fleur bi-annuelle", "vivace"],
            "familles": ["Astéracées", "Composées", "Tests"],
            "semi": {"m":[3,4,5]},
            // plantation
            "floraison": {"m":[7,8,9,11]},
            "recolte": {"m":[7,8,9,10]}
        };

        assert.equal(await TestHelper.asPromise(jd, jd.count), 10);
        assert.equal(await TestHelper.asPromise(jd, jd.contribsCount), 0);

        // contribute
        await TestHelper.asPromise(jd, jd.contribute, testContrib);

        assert.equal(await TestHelper.asPromise(jd, jd.contribsCount), 1);
        var contribs = await TestHelper.asPromise(jd, jd.listContribs, {});

        // acceptContribution
        await TestHelper.asPromise(jd, jd.acceptContribution, testContrib["nom_scientifique"]);

        assert.equal(await TestHelper.asPromise(jd, jd.count), 10);
        assert.equal(await TestHelper.asPromise(jd, jd.contribsCount), 0);
        var documents = await TestHelper.asPromise(jd, jd.listDocuments, {})
           .catch((err) =>  console.error("err",err));
        var cosmosEntry = documents.filter(d => d.nom_scientifique == 'Cosmos bipinnatus')[0];
        _expectDocEntry(cosmosEntry, 'nom', 'jdTestContrib');
        _expectDocEntry(cosmosEntry, 'nom_scientifique','Cosmos bipinnatus');
        _expectDocEntry(cosmosEntry, 'type', ["fleur bi-annuelle", "vivace"]);
        _expectDocEntry(cosmosEntry, 'familles', ["Astéracées", "Composées", "Tests"]);
        _expectDocEntryPeriod(cosmosEntry, 'semi', [3,4,5]);
        _expectDocEntryPeriod(cosmosEntry, 'plantation', [4,5,6]);// unchanged
        _expectDocEntryPeriod(cosmosEntry, 'floraison', [7,8,9,11]);
        _expectDocEntryPeriod(cosmosEntry, 'recolte', [7,8,9,10]);
    });

    after(function () {
      if (jd != null) {
        jd.close();
      }
    });
});