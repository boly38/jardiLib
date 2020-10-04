const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Document = require('./schema/Document');
const Contribution = require('./schema/Contribution');

class JardiDocs {
  constructor(jardiMongoUri, jardiAdminDbName = null) {
    this._assumeDatabaseUri(jardiMongoUri);
    this.databaseURI = jardiMongoUri;
    this.adminDatabaseName = jardiAdminDbName;
    this.databaseOptions = { useUnifiedTopology: true, useNewUrlParser: true, poolSize: 15 };
    this.available = false;
    this.adminAvailable = false;
    this.isMaintainer = null;
  }

  init(cb) {
    var repo = this;
    mongoose.connect(repo.databaseURI, repo.databaseOptions)
    .then(() => {
        repo._initSchema();
        repo.available = true;
        console.log("init. OK ", repo.userDb.name);
        if (repo._hasAdminDatabaseName()) {
            repo.initAdmin(cb);
            return;
        }
        cb();
    })
    .catch(err => {
        repo.available = false;
        console.error(err);
        cb('Erreur lors de la connexion: '+ err.message);
    });
    repo.userDb = mongoose.connection;
  }

  initAdmin(cb) {
    var repo = this;
    repo.adminDb = mongoose.connection.useDb(this.adminDatabaseName);
    repo._initAdminSchema();
    repo.adminAvailable = true;
    let nbContribs = repo.contribsCount((err, nb) => {
        console.log("init admin OK base:", repo.userDb.name, " contribution(s):", nb);
        cb();
    });

  }

  listDocuments(options, cb) {
      this._assumeAvailable();
      var filter = {};
      if (options.nom) {
          filter.nom = options.nom ;
      }
      console.debug("listDocuments", filter);
      this.JardiDoc.find(filter, cb);
  }

  listContribs(options, cb) {
      this._assumeAdminAvailable();
      var filter = {};
      if (options.nom) {
          filter.nom = options.nom ;
      }
      console.debug("listContribs", filter);
      this.JardiContrib.find(filter, cb);
  }

  contribsCount(cb) {
    this._assumeAdminAvailable();
    this.JardiContrib.countDocuments(cb);
  }

  deleteDocuments(options, cb) {
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
    var contrib  = new this.JardiContrib();
    contrib.doc = {
      "nom": entry.nom,
      "type": entry.type,
      "semi": entry.semi,
      "plantation": entry.plantation,
      "floraison": entry.floraison,
      "sources": entry.sources,
      "dddd": entry.sources
    };
    contrib.save(cb);
  }

  close() {
    mongoose.connection.close();
  }

  hasAdminRole() {
    return this.adminAvailable;
  }

  async hasOwnerRole() {
    if (this.isMaintainer != null) {
      return this.isMaintainer;
    }
    // owner can update jardi docs
    const res = await this.JardiDoc.updateOne({ name: 'tomate' }, { name: 'tomate' });
    this.isMaintainer = (res.nModified == 1);
    return this.isMaintainer;
  }

  //~ private
  _initSchema() {
      this.JardiDoc = mongoose.model('jardiDoc', Document);
      this.dbname = this.JardiDoc.db.name;
  }
  _initAdminSchema() {
      this.JardiContrib = this.adminDb.model('jardiContrib', Contribution);
  }
  _assumeDatabaseUri(uri) {
      if (uri == undefined || uri == "") {
        throw "la configuration de la base de données est absente.";
      }
  }
  _assumeAvailable() {
      if (!this.available) {
        throw "la base de données n'est pas disponible.";
      }
  }
  _assumeAdminAvailable() {
      if (!this.hasAdminRole()) {
        throw "les fonctions d'admin ne sont pas disponibles";
      }
  }
  _hasAdminDatabaseName() {
      return !(this.adminDatabaseName == undefined || this.adminDatabaseName == "");
  }

}

module.exports = JardiDocs;
