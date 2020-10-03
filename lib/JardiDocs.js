var mongoose = require('mongoose');

class JardiDocs {
  constructor(jardiMongoUri) {
    this._assumeDatabaseUri(jardiMongoUri);
    this.databaseURI = jardiMongoUri;
    this.available = false;
  }

  init(cb) {
    var repo = this;
    var options = {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        poolSize: 15
    };
    mongoose.connect(repo.databaseURI, options)
    .then(() => {
        repo._initSchema();
        repo.available = true;
        cb();
    })
    .catch(err => {
        console.error('Erreur lors de la connexion:', err.message);
        repo.available = false;
        cb(err);
    });
  }

  example(cb) {
    let repo = this;
    repo.count((err,data) => {
        if (err) {
            console.info("err", err);
            cb();
            return;
        }
        console.info("data", data);
        repo.addOne((err) => {
            if (err) {
                console.info("err", err);
                cb();
                return;
            }
            repo.count((err,data) => {
                console.info("data2", data);
                cb();
                return;
            });
        });
        });
  }

    listDocuments(options, cb) {
        this._assumeAvailable();
        var filter = {};
        if (options.nom) {
            filter.nom = options.nom ;
        }
        console.debug("listDocuments", filter);
        // cb(null,"ee");
        this.JardiDoc.find(filter, cb);
    }

    deleteDocumentsAddOne(options, cb) {
        this._assumeAvailable();
        if (!options.nom) {
            cb(null, 0);
            return;
        }
        console.debug("deleteDocuments");
        this.JardiDoc.deleteMany({"nom": { $regex: options.nom } }, (err, data) => {
            if (err) {
              cb(err);
              return;
            }
            cb(null, data.deletedCount);
        });
    }


    count(cb) {
        this._assumeAvailable();
        this.JardiDoc.countDocuments(cb);
    }

    add(entry, cb) {
      var doc  = new this.JardiDoc();
      doc.nom = entry.nom;
      doc.type = entry.type;
      doc.semi = entry.semi;
      doc.plantation = entry.plantation;
      doc.floraison = entry.floraison;
      doc.sources = entry.sources;
      doc.save(cb);
    }

    addOne(cb) {
      var entry  = new this.JardiDoc();
      entry.nom = "addOne";
      entry.save(cb);
    }

    close() {
      mongoose.connection.close();
    }

    _initSchema() {
        var periodSchema = mongoose.Schema({
            txt: String,
            m : [Number]
        });
        var sourceSchema = mongoose.Schema({
            a: String,
            href : String
        });
        var jardiDoc = mongoose.Schema({
            nom: String,
            description: String,
            type: [String],
            semi: periodSchema,
            plantation: periodSchema,
            floraison: periodSchema,
            sources: [sourceSchema]
        });

        this.JardiDoc = mongoose.model('jardiDoc', jardiDoc);
    }
    _assumeDatabaseUri(uri) {
        if (uri == undefined || uri == "") {
          throw "database configuration is missing";
        }
    }
    _assumeAvailable() {
        if (!this.available) {
          throw "database is not available";
        }
    }

}

module.exports = JardiDocs;
