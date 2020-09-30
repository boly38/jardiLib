var mongoose = require('mongoose');

class JardiDocs {
  constructor(jardiMongoUri) {
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
        console.debug("listDocuments");
        // cb(null,"ee");
        this.JardiDoc.find({}, cb);
    }

    deleteDocumentsAddOne(options, cb) {
        this._assumeAvailable();
        console.debug("deleteDocuments");
        this.JardiDoc.deleteMany({"nom":"addOne"}, (err, data) => {
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


    addOne(cb) {
      var entry  = new this.JardiDoc();
      entry.nom = "addOne";
      entry.save(cb);
    }

    close() {
      mongoose.connection.close();
    }

    _initSchema() {
        var jardiDoc = mongoose.Schema({
            nom: String,
            description: String
        });

        this.JardiDoc = mongoose.model('jardiDoc', jardiDoc);
    }

    _assumeAvailable() {
        if (!this.available) {
          throw "database is not available";
        }
    }

}

module.exports = JardiDocs;
