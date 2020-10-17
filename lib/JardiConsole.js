const term = require( 'terminal-kit' ).terminal ;
const path = require('path');
const databasePath = path.join(__dirname, '../database');
const JardiFichiers = require('./JardiFichiers.js');


class JardiConsole {
  constructor() {
	this.month = 1;
	this.toastMessage = "";
    this.jardiFichier = new JardiFichiers(databasePath);
	
	var jardiConsole = this;
	this.jardiFichier.init(() => {
		jardiConsole.menu();
		jardiConsole.command();
	});
  }
  
  menu() {
    term.clear();
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
    var jardiConsole = this;
    term.on( 'key' , function( name , matches , data ) {
        jardiConsole.onKey(name);
    } ) ;
    term.grabInput( true ) ;
  }

  onKey(keyName) {
    var jardiConsole = this;
    switch (keyName) { // input menu key dispatcher
        case 'q': case 'CTRL_C': jardiConsole.quit(); return;
        case 'l': jardiConsole.list(); break;
        case 'm': jardiConsole.listMonth(); break;
        case 'RIGHT': jardiConsole.nextMonth(); jardiConsole.menu(); break;
        case 'LEFT': jardiConsole.previousMonth(); jardiConsole.menu(); break;
        default : console.log('JC commande inconnue', keyName);
    }
  }

  quit() {
	 console.info("JardiConsole - Au revoir!");
	 term.grabInput( false ) ;
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
     this.jardiFichier.get({"champ":"nom"}, (err, names) => {
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
     this.jardiFichier.get({"m":[jardiConsole.month]}, (err, entries) => {
        if (entries === null || entries.length === 0) {
            jardiConsole.toastMessage = "aucun entrée ne correspond";
        } else {
            jardiConsole.toastMessage = "Entrée trouvées (mois:" + jardiConsole.month + ") : ";
            entries.forEach( e => {
                jardiConsole.toastMessage = jardiConsole.toastMessage + e.nom + " (" + e.matchKeys + ") ";
            })
        }
        jardiConsole.menu();
     });
  }

  //~ private

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

module.exports = JardiConsole;
