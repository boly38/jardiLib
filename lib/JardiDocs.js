const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const async = require('async')
const path = require('path');
const pjson = require('../package.json');
const databasePath = path.join(__dirname, '../database');
const { Validator } = require('node-input-validator');

const JardiFichiers = require('./JardiFichiers');
const Document = require('./schema/Document');
const Contribution = require('./schema/Contribution');
const { ConfigurationIsMissingError, InputValidationError } = require('./error/DomainError')

const FIELD_NAME = '^[a-zA-Z0-9\\s\\$\\^\\*\\.]*$';
const FIELD_MAX_LENGTH = '255';
const RULE_SIMPLE_FIELD = ["string", ["maxLength", FIELD_MAX_LENGTH],  ['regex', FIELD_NAME]];

const FIELD_ID = '^[a-f0-9]{24}$';
const RULE_ID = ["string", ['regex', FIELD_ID]];

class JardiDocs {
  constructor(jardiMongoUri, jardiAdminDbName = null) {
    this._assumeDatabaseUri(jardiMongoUri);
    this.databaseURI = jardiMongoUri;
    this.adminDatabaseName = jardiAdminDbName;
    this.databaseOptions = { useUnifiedTopology: true, useNewUrlParser: true, poolSize: 15 };
    this.available = false;
    this.adminAvailable = false;
    this.isMaintainer = false;
  }

  init() {
    var repo = this;
    return new Promise((resolve, reject) => {
      mongoose.connect(repo.databaseURI, repo.databaseOptions)
      .then(() => {
          repo._initSchema();
          repo.available = true;
          repo.userDb = mongoose.connection;
          // DEBUG // console.log("init. [" + repo.userDb.name + "] - OK");
          if (repo._hasAdminDatabaseName()) {
              repo.initAdmin()
              .then(()=>resolve())
              .catch((err)=>reject(err));
              return;
          }
          resolve();
      })
      .catch(err => {
          repo.available = false;
          console.error(err);
          reject('Erreur lors de la connexion: '+ err.message);
      });
    });
  }

  initAdmin() {
    var repo = this;
    return new Promise((resolve, reject) => {
      repo.adminDb = mongoose.connection.useDb(this.adminDatabaseName);
      repo._initAdminSchema();
      repo.adminAvailable = true;
      this._canWriteDoc()
      .then((result) => {
        this.isMaintainer = true;
        resolve();
      })
      .catch((err) => {
        this.isMaintainer = false;
        resolve();
      });
    });
  }

  getConfiguration() {
    var repo = this;
    var configuration = {roles:[], version: pjson.version};
    if (repo.hasAdminRole()) {
      configuration.roles.push("admin");
    }
    if (repo.hasOwnerRole()) {
      configuration.roles.push("owner");
    }
    if (repo.userDb) {
        configuration.db = { name: repo.userDb.name };
    }
    if (repo.adminDb) {
        configuration.adminDb = { name: repo.adminDb.name };
    }
    return configuration;
  }

  /**
   * listDocuments - List documents
   * @param {options} list filters *validated*
   * return Promise((docs, error));
   */
  listDocuments(options) {
    this._assumeAvailable();
    return new Promise((resolve, reject) => {
      var v = new Validator(options, {
                      'id': RULE_ID,
                      'nom': RULE_SIMPLE_FIELD,
                      'mois': 'array|between:1,12',
                      'mois.*': 'integer|between:1,12',
                      'limit': 'integer|max:1000',
                      'bookmark': RULE_SIMPLE_FIELD,
                    });
      v.check().then((matched) => {
        if (!matched) {
          reject(new InputValidationError('options', options, JSON.stringify(v.errors)));
          return;
        }
        var andConditions = [];
        if (options.nom) {
          andConditions.push( this._nomMatch(options.nom, ['nom', 'nom_scientifique']));
        }
        if (options.id) {
          andConditions.push( {"_id":options.id} );
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
        // DEBUG // console.log("find",JSON.stringify(filter),fields,maxResult);
        this.JardiDoc.find(filter, fields).sort({ _id: -1 }).limit(maxResult)
          .then(resolve).catch(reject);
      });
    });
  }

  /**
   * listContribs - List contributions
   * @param {options} list filters *validated*
   * return Promise((contribs, error));
   */
  listContribs(options) {
    this._assumeAdminAvailable();
    this._assumeAvailable();
    return new Promise((resolve, reject) => {
      var v = new Validator(options, {
                      'id': RULE_ID,
                      'nom': RULE_SIMPLE_FIELD
                    });
      v.check().then((matched) => {
        if (!matched) {
          reject(new InputValidationError('options', options, JSON.stringify(v.errors)));
          return;
        }
        var andConditions = [];
        if (options.nom) {
          andConditions.push( this._nomMatch(options.nom, ['doc.nom', 'doc.nom_scientifique']));
        }
        if (options.id) {
          andConditions.push( {"_id":options.id} );
        }
        var filter = andConditions.length == 0 ? {} :
                       andConditions.length == 1 ? andConditions[0] :
                         { $and: andConditions };
        // DEBUG // console.log("find",JSON.stringify(filter));
        this.JardiContrib.find(filter).then(resolve).catch(reject);
      });
    });
  }

  /**
   * acceptContribution - Accept a contribution
   * @param contributionId contribution unique identifier
   * return Promise((nbExecuted, error));
   */
  acceptContribution(contributionId) {
    this._assumeAdminAvailable();
    this._assumeOwnerRole();
    var repo = this;
    return new Promise((resolve, reject) => {
      var contribFilterById = { _id: contributionId };
      repo.JardiContrib.findOne(contribFilterById)
      .catch(reject)
      .then((contrib) => {
        if (contrib == null) {
            reject("contribution introuvable");
            return;
        }
        var contribScNameFilter = { "nom_scientifique": contrib.doc.nom_scientifique };
        repo._upsertDocuments(contribScNameFilter, contrib.doc)
        .catch(reject)
        .then((updatedDoc) => {
          repo.JardiContrib.deleteOne(contribFilterById)
          .catch(reject)
          .then((data) => { resolve(data.deletedCount); });
        });
      });
    });
  }

  /**
   * rejectContribution - Reject a contribution
   * @param contributionId contribution unique identifier
   * return Promise((nbExecuted, error));
   */
  rejectContribution(contributionId) {
    this._assumeAdminAvailable();
    this._assumeOwnerRole();
    var repo = this;
    var contribFilterById = { _id: contributionId };
    return new Promise((resolve, reject) => {
      repo.JardiContrib.findOne(contribFilterById)
      .catch(reject)
      .then((contrib) => {
        if (contrib == null) {
            reject("contribution introuvable");
            return;
        }
        repo.JardiContrib.deleteOne(contribFilterById)
        .catch(reject)
        .then((data) => resolve(data.deletedCount));
      });
    });
  }

  /**
   * count - Count documents
   * return Promise((nb, error));
   */
  count() {
    this._assumeAvailable();
    return this.JardiDoc.countDocuments();
  }

  /**
   * contribsCount - Count contributions
   * return Promise((nb, error));
   */
  contribsCount() {
    this._assumeAdminAvailable();
    return this.JardiContrib.countDocuments();
  }

  /**
   * deleteAllDocuments - Delete all documents
   * return Promise((nb, error));
   */
  deleteAllDocuments() {
    this._assumeAvailable();
    this._assumeOwnerRole();
    return new Promise((resolve, reject) => {
      this.JardiDoc.deleteMany({})
      .catch(reject)
      .then((data) => {
        resolve(data.deletedCount);
      });
    });
  }

  /**
   * deleteAllContribs - Delete all contributions
   * return Promise((nb, error));
   */
  deleteAllContribs(cb) {
    this._assumeAvailable();
    this._assumeAdminAvailable();
    return new Promise((resolve, reject) => {
      this.JardiContrib.deleteMany({})
      .catch(reject)
      .then((data) => {
        resolve(data.deletedCount);
      });
    });
  }

  /**
   * deleteDocuments - Delete some documents
   * @param {options} delete filters // TODO / *NOT validated*
   * return Promise((nb, error));
   */
  deleteDocuments(options) {
    this._assumeAvailable();
    this._assumeOwnerRole();
    return new Promise((resolve, reject) => {
      if (options.nom) {
        this.JardiDoc.deleteMany({"nom": { $regex: options.nom } })
        .catch(reject)
        .then((data) => {
            resolve(data.deletedCount);
        });
      } else if (options.id) {
        this.JardiDoc.deleteMany({"_id": options.id })
        .catch(reject)
        .then((data) => {
            resolve(data.deletedCount);
        });
      } else {
          return;
      }
    });
  }

  /**
   * contribute - Add a contribution
   * @param {entry} contribution // TODO / *NOT validated*
   * return Promise((savedContribution, error));
   */
  contribute(entry) {
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
    return contrib.save();
  }

  /**
   * addLocalDatabase - Add json files as document
   * return Promise((nbAdded, error));
   */
  addLocalDatabase() {
    this._assumeAdminAvailable();
    this._assumeOwnerRole();
    var repo = this;
    return new Promise((resolve, reject) => {
      var jf = new JardiFichiers(databasePath);
      jf.init()
      .catch(reject)
      .then((files) => {
        jf.get({})
        .catch(reject)
        .then((fileEntries) => {
          var upserts = [];
          fileEntries.forEach( e => {
            upserts.push(function(cb){
              // TODO use contribute(..) and acceptContribution(...)
              repo._upsertDocuments({ nom_scientifique: e.nom_scientifique}, e)
              .catch((err) => { cb(err); })
              .then((upsertResult) => { cb(null, upsertResult); });
            })
          });
          async.series(upserts, function(err, upsertsResults) {
            if (err) {
               reject(err);
            } else {
               resolve(upsertsResults ? upsertsResults.map(u => u.n).reduce((acc,val)=>{return acc+val;}):undefined);
            }
          });
        });
      });
    });
  }

  /**
   * listTypes - List documents distinct types
   * return Promise((docs, error));
   */
  listTypes() {
    this._assumeAvailable();
    return new Promise((resolve, reject) => {
      var filter = {};
      this.JardiDoc.distinct('type', filter)
        .then(resolve).catch(reject);
    });
  }

  /**
   * listFamilies - List documents distinct families
   * return Promise((docs, error));
   */
  listFamilies() {
    this._assumeAvailable();
    return new Promise((resolve, reject) => {
      var filter = {};
      this.JardiDoc.distinct('familles', filter)
        .then(resolve).catch(reject);
    });
  }

  /**
   * close - close database connection
   */
  close() {
    mongoose.connection.close();
  }

  hasAdminRole() {
    return this.adminAvailable;
  }

  hasOwnerRole() {
    return this.isMaintainer;
  }

  //~ private
  _nomMatch(nomValue, nomFieldsArray) {
    var nomMatch = nomValue;
    if (typeof nomMatch == 'string' && !nomMatch.includes('*')) {
      nomMatch = '.*'+nomMatch+'.*';
    }
    var orArray = [];
    nomFieldsArray.forEach( field => {
      var fieldMatch = {};
      fieldMatch[field] = {$regex: nomMatch};
      orArray.push(fieldMatch)
    });
    return { $or: orArray };
  }

  _canWriteDoc() {
    return this.JardiDoc.updateOne({ nom: 'unknown' }, { nom: 'unknown' })
  }

  _initSchema() {
      this.JardiDoc = mongoose.model('jardiDoc', Document);
      this.dbname = this.JardiDoc.db.name;
  }
  _initAdminSchema() {
      this.JardiContrib = this.adminDb.model('jardiContrib', Contribution);
  }
  _assumeDatabaseUri(uri) {
      if (uri == undefined || uri == "") {
        throw new ConfigurationIsMissingError("URI de la base de données");;
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

  _upsertDocuments(filter, updatedEntry) {
    return this.JardiDoc.updateOne(filter, updatedEntry, { "upsert": true});
  }
}

module.exports = JardiDocs;
