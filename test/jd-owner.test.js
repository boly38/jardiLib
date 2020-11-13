const JardiDocs = require('../lib/JardiDocs');
const pjson = require('../package.json');
const assert = require('assert').strict;
const expect = require('chai').expect
const util = require('util')
const TestHelper =  require('./TestHelper');

const UNAVAILABLE_ERROR = 'la base de données n\'est pas disponible.';
const UNAVAILABLE_ADMIN_ERROR = 'les fonctions d\'admin ne sont pas disponibles';
const testUserDbUri = process.env.JARDI_TEST_USER_MONGO_URI;
const testDbUri = process.env.JARDI_TEST_MONGO_URI;
const testAdminDbUri = process.env.JARDI_TEST_ADMIN_MONGO_DB_NAME;
const sleep = (t) =>  ({ then: (r) => setTimeout(r, t) })
let jd = null;

describe("JardiDocs as Owner", function() {
    before(function () {
      jd = new JardiDocs(testDbUri, testAdminDbUri);
    });

    it("should require db uri", async function() {
        try {
          new JardiDocs(null, null);
          expect.fail("expect InputValidationError");
        } catch (err) {
           // DEBUG // console.info(JSON.stringify(err));
          expect(err.name).to.eql('ConfigurationIsMissingError');
          expect(err.data.configuration).to.eql('URI de la base de données');
        }
    });

    it("should init", async function() {
        await jd.init();
        await jd.deleteAllDocuments();
        await jd.deleteAllContribs();
    });

    it("should be available", async function() {
        var unavailableJd = new JardiDocs("osef", "osef");
        expect(() => unavailableJd.listDocuments({})).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.listContribs({})).to.throw(UNAVAILABLE_ADMIN_ERROR);
        expect(() => unavailableJd.deleteAllDocuments()).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.deleteAllContribs((err,nb)=>{})).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.deleteDocuments({})).to.throw(UNAVAILABLE_ERROR);
        expect(() => unavailableJd.count()).to.throw(UNAVAILABLE_ERROR);
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
        var upsertsResults = await jd.addLocalDatabase().catch((err) => { expect.fail(err); });
        expect(upsertsResults).to.eql(10);
        assert.equal(await jd.count(), 10);
    });

    it("should delete (and re-add local database)", async function() {
        await jd.deleteAllDocuments()
        .catch((err) => { expect.fail(err); })
        .then((nbDeleted) => {
            expect(nbDeleted).to.eql(10);
        });

        var upsertsResults = await jd.addLocalDatabase().catch((err) => { expect.fail(err); });
        // DEBUG // console.info("add results=",upsertsResults);
        assert.equal(await jd.count(), 10);
    });

    it("should not listContribs with wrong options", async function() {
        await jd.listContribs({"nom":"^°$"})
        .then((docs) => {
            expect.fail("should not get here");
        })
        .catch((err) => {
             // DEBUG // console.info(JSON.stringify(err));
            expect(err.name).to.eql('InputValidationError');
            expect(err.data.field).to.eql('options');
        });

        await jd.listContribs({id:'^10°¤90$'})
        .then((docs) => {
          console.info("docs", docs);
          expect.fail("listContribs should not success");
        })
        .catch((err) => {
           // DEBUG // console.info(err);
          expect(err.name, err).to.eql('InputValidationError');
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

        assert.equal(await jd.count(), 10);
        assert.equal(await jd.contribsCount(), 0);

        // contribute
        await jd.contribute(testContrib);

        // list contribute by regex // fully tested on jd-user listDocuments
        var filteredContrib = await jd.listContribs({nom:'.*Contrib'}).catch((err) => {  expect.fail(err); });
        TestHelper.expectDocEntry(filteredContrib[0].doc, 'nom', 'jdTestContrib');

        // list contribute by name
        var acceptedContribByName = await jd.listContribs({nom:testContrib.nom}).catch((err) => {  expect.fail(err); });
        assert.equal(acceptedContribByName.length, 1);
        assert.equal(acceptedContribByName[0].doc.nom_scientifique, testContrib.nom_scientifique);

        // acceptContribution
        await jd.acceptContribution(acceptedContribByName[0]._id).catch((err) => {  expect.fail(err); });

        assert.equal(await jd.count(), 10);
        assert.equal(await jd.contribsCount(), 0);
        var documents = await jd.listDocuments({}).catch((err) => { throw err});
        var cosmosEntry = documents.filter(d => d.nom_scientifique == 'Cosmos bipinnatus')[0];
        TestHelper.expectDocEntry(cosmosEntry, 'nom', 'jdTestContrib');
        TestHelper.expectDocEntry(cosmosEntry, 'nom_scientifique','Cosmos bipinnatus');
        TestHelper.expectDocEntry(cosmosEntry, 'type', ["fleur bi-annuelle", "vivace"]);
        TestHelper.expectDocEntry(cosmosEntry, 'familles', ["Astéracées", "Composées", "Tests"]);
        TestHelper.expectDocEntryPeriod(cosmosEntry, 'semi', [3,4,5]);
        TestHelper.expectDocEntryPeriod(cosmosEntry, 'plantation', [4,5,6]);// unchanged
        TestHelper.expectDocEntryPeriod(cosmosEntry, 'floraison', [7,8,9,11]);
        TestHelper.expectDocEntryPeriod(cosmosEntry, 'recolte', [7,8,9,10]);
    });


    it("should contribute, reject, count and listContribs", async function() {
      var testContrib = {
          "nom": "jdTestContribRejected",
          "nom_scientifique": "Cosmos bipinnatus mal éctritus",
          "type": ["fleur bi-annuelle", "vivace"],
          "familles": ["Astéracées", "Composées", "Tests"],
          "semi": {"m":[3,4,5]},
          // plantation
          "floraison": {"m":[7,8,9,11]},
          "recolte": {"m":[7,8,9,10]}
      };

      assert.equal(await jd.count(), 10);
      assert.equal(await jd.contribsCount(), 0);

      // contribute
      await jd.contribute(testContrib);

      // list contribute by name
      var rejectedContribByName = await jd.listContribs({nom:testContrib.nom}).catch((err) => {  expect.fail(err); });
      assert.equal(rejectedContribByName.length, 1);
      assert.equal(rejectedContribByName[0].doc.nom_scientifique, testContrib.nom_scientifique);

      // list contribute by id
      var rejectedContribById = await jd.listContribs({id:rejectedContribByName.id}).catch((err) => {  expect.fail(err); });
      assert.equal(rejectedContribById.length, 1);
      assert.equal(rejectedContribById[0].doc.nom_scientifique, testContrib.nom_scientifique);

      // rejectContribution
      await jd.rejectContribution(rejectedContribByName[0]._id).catch((err) => {  expect.fail(err); });;

      assert.equal(await jd.count(), 10);
      assert.equal(await jd.contribsCount(), 0);
    });

    after(function () {
      if (jd != null) {
        jd.close();
      }
    });
});