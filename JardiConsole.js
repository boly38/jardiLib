const readline = require('readline');
const path = require('path');
const databasePath = path.join(__dirname, 'database');
const JardiService = require('./lib/JardiService.js');


class JardiConsole {
  constructor() {
	this.month = 1;
	this.toastMessage = "";
    this.jardiService = new JardiService(databasePath);
	
	var jardiConsole = this;
	this.jardiService.init(() => {
		jardiConsole.menu();
		jardiConsole.command();
	});
  }
  
  menu() {
    this._clearScreen();
    console.info("|---------- Mois " + this.month);
    console.info("|- > - mois suivant");
    console.info("|- < - mois précédent");
    console.info("|- l - lister les éléments");
    console.info("|- m - lister les éléments du mois");
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
        case 'm/false/m': jardiConsole.listMonth(); break;
        case 'undefined/false/right': jardiConsole.nextMonth(); jardiConsole.menu(); break;
        case 'undefined/false/left': jardiConsole.previousMonth(); jardiConsole.menu(); break;
		default:
	        console.log('commande inconnue "' + keyCode + "'");
      }
  }
  quit() {
	 console.info("Au revoir!");
     process.exit();
  };

  nextMonth() {
   this.month = (this.month + 1) % 13;
   if (this.month == 0) {
     this.month = 1;
   }
  }
  previousMonth() {
   this.month -= 1;
   if (this.month == 0) {
     this.month = 12;
   }
  }

  list() {
     var jardiConsole = this;
     this.jardiService.get({"field":"name"}, (err, names) => {
        if (names === null || names.length === 0) {
            jardiConsole.toastMessage = "aucun entrée ne correspond";
        } else {
            jardiConsole.toastMessage = "Entrée trouvées : " + names;
        }
        jardiConsole.menu();
     });
  }

  listMonth() {
     var jardiConsole = this;
     this.jardiService.get({"m":[jardiConsole.month]}, (err, entries) => {
        if (entries === null || entries.length === 0) {
            jardiConsole.toastMessage = "aucun entrée ne correspond";
        } else {
            jardiConsole.toastMessage = "Entrée trouvées (mois:" + jardiConsole.month + ") : ";
            entries.forEach( e => {
                jardiConsole.toastMessage = jardiConsole.toastMessage + e.name + " (" + e.matchKeys + ") ";
            })
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

module.exports = JardiConsole;
