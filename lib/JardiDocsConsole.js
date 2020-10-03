const readline = require('readline');
const fs = require('fs');
const path = require('path');
const JardiDocs = require('./JardiDocs.js');
const JardiFichiers = require('./JardiFichiers.js');
const databasePath = path.join(__dirname, '../database');
const async = require("async");

class JardiDocsConsole {
  constructor() {
	this.toastMessage = "";
    this.JardiDocs = new JardiDocs(process.env.JARDI_MONGO_URI);
    this.JardiFichiers = new JardiFichiers(databasePath);

	var jardiConsole = this;
	jardiConsole.JardiDocs.init(() => {
	    jardiConsole.JardiFichiers.init(() => {
	    	jardiConsole.menu();
    		jardiConsole.command();
	    });
	});
  }
  
  menu() {
    this._clearScreen();
    console.info("|---------- ");
    console.info("|- l - lister les éléments");
    console.info("|- a - lister les éléments dont le nom commence par a ou c");
    console.info("|- + - ajouter un élément");
    console.info("|- f - ajouter les fichiers json locaux");
    console.info("|- s - supprimer les éléments ajoutés");
    console.info("|- q - quitter");
    console.info("|---------- ");
    console.info(this.toastMessage);
  }

  command() {
    // Key input
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => { this.onKeyPressed(str, key) });
  }

  onKeyPressed(str, key) {
      var jardiConsole = this;
      if ((key.name == 'q') || (key && key.ctrl && key.name == 'c')) {
        jardiConsole.quit();
      }
	  var keyCode = str + "/" + key.ctrl + "/" + key.name;
	  if (key.name && key.name.localeCompare("return") == 0) {
		  return;
	  }
	  this.toastMessage = "";
      switch (keyCode) { // input menu key dispatcher
        case 'l/false/l': jardiConsole.list(); break;
        case 'a/false/a': jardiConsole.listA(); break;
        case '+/false/undefined': jardiConsole.add(); break;
        case 'f/false/f': jardiConsole.addFiles(); break;
        case 's/false/s': jardiConsole.del(); break;
		default:
	        console.log('commande inconnue "' + keyCode + "'");
      }
  }

  quit() {
	 console.info("Au revoir!");
	 this.JardiDocs.close();
     process.exit();
  }

  list() {
     var jardiConsole = this;
     this.JardiDocs.listDocuments({}, (err,docs) => {
         if (err) {
           jardiConsole.toastMessage = "list erreur:" + err;
         } else if (Array.isArray(docs) && docs.length < 1) {
           jardiConsole.toastMessage = "Aucune entrée";
         } else {
           jardiConsole.toastMessage = docs.length + " entrée trouvées : "+
                docs.map(e => e.nom).join(" - ");
         }
         jardiConsole.menu();
       });
  }

  listA() {
     var jardiConsole = this;
     this.JardiDocs.listDocuments({ "nom" : /^[ac]/ }, (err,docs) => {
         if (err) {
           jardiConsole.toastMessage = "list erreur:" + err;
         } else if (Array.isArray(docs) && docs.length < 1) {
           jardiConsole.toastMessage = "Aucune entrée";
         } else {
           jardiConsole.toastMessage = docs.length + " entrée trouvées : "+
                docs.map(e => e.nom).join(" - ");
         }
         jardiConsole.menu();
       });
  }

  add() {
     var jardiConsole = this;
     this.JardiDocs.example((err,docs) => {
         if (err) {
           jardiConsole.toastMessage = "ajout error:" + err;
         } else {
           jardiConsole.toastMessage = "Entrée ajoutée ";
         }
         jardiConsole.menu();
       });
  }

  addFiles() {
      var jardiConsole = this;
      var asyncCalls = [];
      jardiConsole.JardiFichiers.get({},(err, entries) => {
         entries.forEach((entry) => {
             asyncCalls.push((cb) => {
                console.log('ajout de l\'entrée', entry);
                jardiConsole.JardiDocs.add(entry, cb);
             });
         });
      });
      async.series(asyncCalls, (err, results) => {
          console.log(results.length + ' fichier(s) ajouté(s)');
          jardiConsole.menu();
      });
  }

  del() {
     var jardiConsole = this;
     this.JardiDocs.deleteDocumentsAddOne({"nom":/(addOne|tomate|cosmos)/},  (err, deletedCount) => {
      if (err) {
        jardiConsole.toastMessage = "suppr. error:" + err;
      } else {
        jardiConsole.toastMessage = deletedCount + " Entrée(s) supprimée(s) ";
      }
      jardiConsole.menu();
    });
  }

  //~ private

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
    
  _clearScreen() {
    var lines = process.stdout.getWindowSize()[1];
    for(var i = 0; i < lines; i++) {
        console.log('\r\n');
    }
  }

}

module.exports = JardiDocsConsole;
