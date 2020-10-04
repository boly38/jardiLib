//requiring path and fs modules
const path = require('path');
const fs = require('fs');


class JardiFichiers {
  constructor(databaseDirectory) {
    this.databaseDirectory = databaseDirectory;
    this.dbFiles = [];
    this.dbEntries = [];
  };

  init(cb) {
	var service = this;
	service._loadDbFiles((err) => {
	  if (err != null) {
	    cb(err);
	    return;
	  }
	  cb(null);
	});
  };

  get(options, cb) {
    let result = this.dbEntries;
    if (options !== null && options.hasOwnProperty('m')) {
       result = result.filter(entry => this._entryFilterByMonths(entry, options['m']));
    }
    if (options !== null && options.hasOwnProperty('field')) {
       result = result.map(entry => entry[options.field])
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

  _loadDbFiles(cb) {
      var service = this;
      fs.readdir(service.databaseDirectory, function (err, files) {
          if (err) {
              console.log('Impossible de lire le dossier: ' + err);
              cb(err);
              return;
          }

          files.forEach(function (file) {
              fs.readFile(service.databaseDirectory + '/' + file, (err, data) => {
                  if (err) {
                    console.log("Erreur de lecture de " + file + " : " + err + ", fichier ignoré");
                    return
                  }
                  let entry = JSON.parse(data);
                  // DEBUG // console.log(file, "=>", entry);
                  if (entry.name == undefined) {
                    entry.name = file.replace(/\.[^/.]+$/, ""); // get file name without extension as name
                  }
                  service.dbFiles.push(file);
                  service.dbEntries.push(entry);
              });
          });
          console.log(service.dbFiles.length + ' entrée(s)');
          cb(null);
      });
  }
}

module.exports = JardiFichiers;