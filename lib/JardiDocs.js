const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const async = require('async')
const path = require('path');
const pjson = require('../package.json');
const databasePath = path.join(__dirname, '../database');
const JardiFichiers = require('./JardiFichiers');
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
        // DEBUG // console.log("init. [" + repo.userDb.name + "] - OK");
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
        // DEBUG // console.log("init. [" + repo.adminDb.name + ", " + nb + " contribution(s)] - OK");
        cb();
    });
  }

  getConfiguration() {
    var repo = this;
    var rolesArray = [];
    if (repo.hasAdminRole()) {
      rolesArray.push("admin");
    }
    if (repo.hasOwnerRole()) {
      rolesArray.push("owner");
    }
    return {
        db: {
            name: repo.userDb.name
        },
        adminDb: {
            name: repo.adminDb.name
        },
        roles: rolesArray,
        version: pjson.version
    };
  }

  listDocuments(options, cb) {
      this._assumeAvailable();
      var andConditions = [];
      if (options.nom) {
          andConditions.push({"nom":options.nom});
      }
      if (Array.isArray(options.mois)) {
          var filterMonth = options.mois;
          andConditions.push( { $or: [
                { "floraison.m": { $in: filterMonth}},
                { "semi.m": { $in: filterMonth}},
                { "plantation.m": { $in: filterMonth}},
                { "recolte.m": { $in: filterMonth}}
          ] } );
      }
      if (options.bookmark) {
        andConditions.push( {_id: {$lt: options.bookmark}} );
      }

      var filter = andConditions.length == 0 ? {} :
                     andConditions.length == 1 ? andConditions[0] :
                       { $and: andConditions };
      var fields = (Array.isArray(options.champs))  ? options.champs.join(' ') : null;
      var maxResult = Number.isInteger(options.limit) && options.limit > 0 && options.limit < 1000 ?options.limit:10;
      // DEBUG // console.log("find",filter,fields,maxResult);
      this.JardiDoc.find(filter, fields, cb)
                   .sort({ _id: -1 }).limit(maxResult);
  }

  listContribs(options, cb) {
      this._assumeAdminAvailable();
      var filter = {};
      if (options.nom) {
          filter.nom = options.nom ;
      }
      this.JardiContrib.find(filter, cb);
  }

  acceptContribution(scName, cb) {
    var repo = this;
    var nameFilter = { nom_scientifique: scName };
    var contribScNameFilter = { "doc.nom_scientifique": scName };
    repo._assumeAdminAvailable();
    repo._assumeOwnerRole();
    repo.JardiContrib.findOne(contribScNameFilter, (err, contrib) => {
      if (err) {
          cb(err);
          return;
      }
      if (contrib == null) {
          cb("contribution introuvable");
          return;
      }
      repo._upsertDocuments(nameFilter, contrib.doc, (err, updatedDoc) => {
        if (err) {
          cb(err);
          return;
        }
        repo.JardiContrib.deleteMany(contribScNameFilter, (err, data) => {
            if (err) {
              cb(err);
              return;
            }
            cb(null, data.deletedCount);
        });
      });
    });
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

  contribute(entry, cb) {
    var contrib = new this.JardiContrib();
    contrib.doc = {
      "nom": entry.nom,
      "nom_scientifique": entry.nom_scientifique,
      "type": entry.type,
      "familles": entry.familles,
      "semi": entry.semi,
      "plantation": entry.plantation,
      "floraison": entry.floraison,
      "recolte": entry.recolte
    };
    contrib.save(cb);
  }

  addLocalDatabase(cb) {
    var repo = this;
    repo._assumeAdminAvailable();
    repo._assumeOwnerRole();
    var jf = new JardiFichiers(databasePath);
    jf.init((err, files) => {
      if (err) {
        cb(err);
        return;
      }
      jf.get({}, (err, fileEntries) => {
        if (err) {
          cb(err);
          return;
        }
        var upserts = [];
        fileEntries.forEach( e => {
          upserts.push(function(cb){
            repo._upsertDocuments({ nom_scientifique: e.nom_scientifique}, e, cb);
          })
        });
        async.series(upserts, cb);
      });
    });
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
    const res = await this.JardiDoc.updateOne({ nom: 'tomate' }, { nom: 'tomate' });
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
  _assumeOwnerRole() {
      if (!this.hasOwnerRole()) {
        throw "les fonctions de propriétaire ne sont pas disponibles";
      }
  }
  _hasAdminDatabaseName() {
      return !(this.adminDatabaseName == undefined || this.adminDatabaseName == "");
  }

  _upsertDocuments(filter, updatedEntry, cb) {
    this.JardiDoc.updateOne(filter, updatedEntry, { "upsert": true}, cb);
  }
}

module.exports = JardiDocs;
