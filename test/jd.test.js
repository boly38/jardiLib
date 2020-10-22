const JardiDocs = require('../lib/JardiDocs');
const pjson = require('../package.json');
const assert = require('assert').strict;
const expect = require('chai').expect
const util = require('util')
const TestHelper =  require('./TestHelper');

const UNAVAILABLE_ERROR = 'la base de données n\'est pas disponible.';
const UNAVAILABLE_ADMIN_ERROR = 'les fonctions d\'admin ne sont pas disponibles';
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

    it("should require db uri", async function() {
        try {
          new JardiDocs(null, null);
          should.fail("expect InputValidationError");
        } catch (err) {
           // DEBUG // console.info(JSON.stringify(err));
          expect(err.name).to.eql('ConfigurationIsMissingError');
          expect(err.data.configuration).to.eql('URI de la base de données');
        }
    });

    it("should init", async function() {
        await TestHelper.asPromise(jd, jd.init);
        await TestHelper.asPromise(jd, jd.deleteAllDocuments);
        await TestHelper.asPromise(jd, jd.deleteAllContribs);
    });

    it("should be available", async function() {
        var unavailableJd = new JardiDocs("osef", "osef");
        expect(() => unavailableJd.listDocuments({},(err,doc)=>{})).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.listContribs({},(err,doc)=>{})).to.throw(UNAVAILABLE_ADMIN_ERROR);
        expect(() => unavailableJd.deleteAllDocuments((err,nb)=>{})).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.deleteAllContribs((err,nb)=>{})).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.deleteDocuments({}, (err,nb)=>{})).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.count((err,nb)=>{})).to.throw(UNAVAILABLE_ERROR);
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
            roles:['admin','owner'],
            version: pjson.version
        });
    });

    it("should add local database", async function() {
        var upsertsResults = await TestHelper.asPromise(jd, jd.addLocalDatabase)
            .catch((err) => { should.fail(err); });
        expect(upsertsResults).to.eql(10);
        assert.equal(await TestHelper.asPromise(jd, jd.count), 10);
    });

    it("should delete (and re-add local database)", async function() {
        jd.deleteAllDocuments((err, nbDeleted) => {
            expect(nbDeleted).to.eql(10);
        });

        var upsertsResults = await TestHelper.asPromise(jd, jd.addLocalDatabase)
            .catch((err) => { should.fail(err); });
        // DEBUG // console.info("add results=",upsertsResults);
        assert.equal(await TestHelper.asPromise(jd, jd.count), 10);
    });

    it("should not listDocuments with wrong options", function() {
        jd.listDocuments({"limit":1090}, (err, docs) => {
            expect(docs).to.be.an('undefined');
             // DEBUG // console.info(JSON.stringify(err));
            expect(err.name).to.eql('InputValidationError');
            expect(err.data.field).to.eql('options');
        });
    });

    it("should count and listDocuments", async function() {
        // count
        assert.equal(await TestHelper.asPromise(jd, jd.count), 10);

        // list
        var documents = await TestHelper.asPromise(jd, jd.listDocuments, {}).catch((err) => { throw err});
        var cosmosEntry = documents.filter(d => d.nom == 'Cosmos')[0];
        _expectDocEntry(cosmosEntry, 'nom', 'Cosmos');
        _expectDocEntry(cosmosEntry, 'nom_scientifique','Cosmos bipinnatus');
        _expectDocEntry(cosmosEntry, 'type', ["fleur annuelle", "vivace"]);
        _expectDocEntry(cosmosEntry, 'familles', ["Astéracées", "Composées"]);
        _expectDocEntryPeriod(cosmosEntry, 'semi', [3,4,5]);
        _expectDocEntryPeriod(cosmosEntry, 'plantation', [4,5,6]);
        _expectDocEntryPeriod(cosmosEntry, 'floraison', [7,8,9,10]);
    });


    it("should listDocuments with limit and bookmark", async function() {
        var filter = {"limit":2};
        var documentsFirst = await TestHelper.asPromise(jd, jd.listDocuments, filter).catch((err) => { throw err});
        expect(documentsFirst.length).to.eql(2);

        filter = {"limit":3, "bookmark":documentsFirst[1]._id};
        var documentsSecond = await TestHelper.asPromise(jd, jd.listDocuments, filter).catch((err) => { throw err});
        expect(documentsSecond.length).to.eql(3);
    });

    it("should not listContribs with wrong options", function() {
        jd.listContribs({"nom":"^$"}, (err, docs) => {
            expect(docs).to.be.an('undefined');
             // DEBUG // console.info(JSON.stringify(err));
            expect(err.name).to.eql('InputValidationError');
            expect(err.data.field).to.eql('options');
        });
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
        var documents = await TestHelper.asPromise(jd, jd.listDocuments, {}).catch((err) => { throw err});
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