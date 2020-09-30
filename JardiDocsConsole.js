const readline = require('readline');
const path = require('path');
const JardiDocs = require('./lib/JardiDocs.js');


class JardiDocsConsole {
  constructor() {
	this.toastMessage = "";
    this.JardiDocs = new JardiDocs(process.env.JARDI_MONGO_URI);
	
	var jardiConsole = this;
	this.JardiDocs.init(() => {
		jardiConsole.menu();
		jardiConsole.command();
	});
  }
  
  menu() {
    this._clearScreen();
    console.info("|---------- ");
    console.info("|- l - lister les éléments");
    console.info("|- a - ajouter un élément");
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
        case 'a/false/a': jardiConsole.add(); break;
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
           jardiConsole.toastMessage = "Entrée trouvées : \n" + docs.join("\n");
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

  del() {
     var jardiConsole = this;
     this.JardiDocs.deleteDocumentsAddOne({},  (err, deletedCount) => {
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
