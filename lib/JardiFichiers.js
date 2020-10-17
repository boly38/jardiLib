const async = require('async')
const flatten = require('flatten')
const path = require('path')
const fs = require('fs')

class JardiFichiers {
  constructor(databaseDirectory) {
    this.databaseDirectory = databaseDirectory;
    this.dbFiles = [];
    this.dbEntries = [];
  };

  init(cb) {
	var service = this;
	service._loadDbFiles(cb);
  };

  get(options, cb) {
    // DEBUG // console.info("get", options);
    let result = this.dbEntries;
    if (options !== null && options.hasOwnProperty('m')) {
       result = result.filter(entry => this._entryFilterByMonths(entry, options['m']));
    }
    if (options !== null && options.hasOwnProperty('champ')) {
       result = result.map(entry => entry[options.champ])
    }
    cb(null, result);
  }

  //~ private
  _entryFilterByMonths(entry, months) {
    if (entry === null || months === null) {
        return false;
    }
    entry.matchKeys = [];
    Object.keys(entry).forEach( (k) => {
        if (entry[k].hasOwnProperty('m')
            && entry[k]['m'].filter( m => months.indexOf(m) !== -1).length > 0) {
          entry.matchKeys.push(k);
        }
    })
    return entry.matchKeys.length > 0;
  }

  _isDirectory(f, callback) {
  	fs.stat(f, function (err, stat) {
  		if (err) return callback(err)
  		callback(null, stat.isDirectory())
  	})
  }

  _readdir(filePath, cb) {
    var service = this;
	const allFiles = []
	async.waterfall([
		done => fs.readdir(filePath, done),
		(files, done) =>
			async.map(files, function recurseOnFile(file, done) {
				const fullPath = path.join(filePath, file)
				service._isDirectory(fullPath, (e, isDir) => {
					if (e) return done(e)
					isDir ? readdir(fullPath, done) : done(null, fullPath)
				})
			}, done),
		(allFiles, done) => done(null, flatten(allFiles)),
	], function (err, files) {
		cb(err, files)
	})
  }

  async _loadDbFiles(cb) {
      var service = this;
      service._readdir(service.databaseDirectory, (err, files) => {
            // DEBUG // console.info("files:", files);
            var fileReadSerie = [];
            files.forEach(file => {
               fileReadSerie.push( function(cb){service._loadDbFile(file, cb); })
            });
            async.series(fileReadSerie, cb);
      });
  }

  async _loadDbFile(file, cb) {
     var service = this;
     fs.readFile(file, (err, fileContent) => {
            if (err) {
              console.log("Erreur de lecture de " + file + " : " + err + ", fichier ignoré");
              cb(err);
            }
            var fileJson = JSON.parse(fileContent);
            // DEBUG // console.log(file, "=json=>", fileJson);
            if (fileJson.nom == undefined) {
              fileJson.nom = file.replace(/\.[^/.]+$/, ""); // get file name without extension as name
            }
            service.dbFiles.push(file);
            service.dbEntries.push(fileJson);
            cb(null, file);
       });
  }
}

module.exports = JardiFichiers;