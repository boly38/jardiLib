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

    it("should not listDocuments with wrong options", async function() {
        await jd.listDocuments({"limit":1090})
        .then((docs) => {
          expect.fail("should not get here");
        })
        .catch((err) => {
           // DEBUG // console.info(JSON.stringify(err));
          expect(err.name).to.eql('InputValidationError');
          expect(err.data.field).to.eql('options');
        });

        await jd.listDocuments({nom:'^10°¤90$'})
        .then((docs) => {
          console.info("docs", docs);
          expect.fail("listDocuments should not success");
        })
        .catch((err) => {
           // DEBUG // console.info(err);
          expect(err.name, err).to.eql('InputValidationError');
          expect(err.data.field).to.eql('options');
        });

        await jd.listDocuments({id:'^10°¤90$'})
        .then((docs) => {
          console.info("docs", docs);
          expect.fail("listDocuments should not success");
        })
        .catch((err) => {
           // DEBUG // console.info(err);
          expect(err.name, err).to.eql('InputValidationError');
          expect(err.data.field).to.eql('options');
        });
    });

    it("should count and listDocuments", async function() {
        // count
        assert.equal(await jd.count(), 9);

        // list
        var documents = await jd.listDocuments({}).catch((err) => {  expect.fail(err); });
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

    it("should listDocuments by 'nom', 'id'", async function() {
        var nigelleDocuments = await jd.listDocuments({nom:'Nigelle de Damas'}).catch((err) => {  expect.fail(err); });
        TestHelper.expectDocEntry(nigelleDocuments[0], 'nom', 'Nigelle de Damas');

        var nig = await jd.listDocuments({nom:'Nig'}).catch((err) => {  expect.fail(err); });
        TestHelper.expectDocEntry(nig[0], 'nom', 'Nigelle de Damas');

        var niga = await jd.listDocuments({nom:'^Nigella damascena$'}).catch((err) => {  expect.fail(err); });
        TestHelper.expectDocEntry(niga[0], 'nom', 'Nigelle de Damas');

        var nigWildcardScena = await jd.listDocuments({nom:'Nig.*scena'}).catch((err) => {  expect.fail(err); });
        TestHelper.expectDocEntry(nigWildcardScena[0], 'nom', 'Nigelle de Damas');

        var anigWildcardScena = await jd.listDocuments({nom:'aNig.*scena'}).catch((err) => {  expect.fail(err); });
        expect(anigWildcardScena.length).to.eql(0);

        var nigelleDocuments = await jd.listDocuments({id:nigelleDocuments[0].id}).catch((err) => {  expect.fail(err); });
        TestHelper.expectDocEntry(nigelleDocuments[0], 'nom', 'Nigelle de Damas');

    });

    it("should listDocuments with limit and bookmark", async function() {
        var filter = {"limit":2};
        var documentsFirst = await jd.listDocuments(filter).catch((err) => {  expect.fail(err); });
        expect(documentsFirst.length).to.eql(2);

        filter = {"limit":3, "bookmark":String(documentsFirst[1]._id)};
        // DEBUG // console.info("filter", filter);
        var documentsSecond = await jd.listDocuments(filter).catch((err) => {  expect.fail(err); });
        expect(documentsSecond.length).to.eql(3);
    });

    it("should list types", async function() {
        var types = await jd.listTypes().catch((err) => {  expect.fail(err); });
        // DEBUG // console.info("types", types);
        expect(types.length).to.eql(9);
    });

    it("should list families", async function() {
        var families = await jd.listFamilies().catch((err) => {  expect.fail(err); });
        // DEBUG // console.info("families", families);
        expect(families.length).to.eql(7);
    });

    after(function () {
      if (jd != null) {
        jd.close();
      }
    });
});