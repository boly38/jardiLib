const path = require('path');
const assert = require('assert').strict;
const expect = require('chai').expect
const databasePath = path.join(__dirname, '../database');
const TestHelper =  require('./TestHelper');
const JardiFichiers = require('../lib/JardiFichiers');

let jf = null;

describe("JardiFichiers", function() {
    before(function () {
      jf = new JardiFichiers(databasePath);
    });

    it("should init", async function() {
        await TestHelper.asPromise(jf, jf.init);
    });

    it("should list names", async function() {
        var result = await TestHelper.asPromise(jf, jf.get, {"champ":"nom"})
                                .catch((err) =>  console.error("err",err));
        assert.equal(result.length, 10);
    });

    it("should list for a month", async function() {
        var documents = await TestHelper.asPromise(jf, jf.get, {"m":[10]})
                                .catch((err) =>  console.error("err",err));
        expect(documents.map(d => d.nom).sort())
         .to.eql(['Concombre', 'Coreopsis', 'Courgette', 'Cosmos', 'Framboisier', "Oeillets d'Inde", 'Souci', 'Tomate'].sort());
        var cosmosEntry = documents.filter(d => d.nom == 'Cosmos')[0];
        assert.equal(cosmosEntry.nom, 'Cosmos');
        assert.equal(cosmosEntry.nom_scientifique, 'Cosmos bipinnatus');
        expect(cosmosEntry.type).to.eql(["fleur annuelle", "vivace"]);
        expect(cosmosEntry.familles).to.eql(["Astéracées", "Composées"]);
        expect(cosmosEntry.semi).to.eql({ "m": [3,4,5]});
        expect(cosmosEntry.plantation).to.eql({ "m": [4,5,6] });
        expect(cosmosEntry.floraison).to.eql({ "m": [7,8,9,10] });

    });

    after(function () {
        // nothing to do
    });
});