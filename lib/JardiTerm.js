const term = require( 'terminal-kit' ).terminal ;
const async = require("async");
const path = require('path');
const JardiDocs = require('./JardiDocs.js');
const JardiFichiers = require('./JardiFichiers.js');
const databasePath = path.join(__dirname, '../database');

class JardiTerm {
  constructor() {
     let jt = this;
     jt.filtre = null;
     jt.content = "";
     jt.history = ["lister"];
     jt.commands = ["fichier","lister","filtre","supprimer","quitter"];
     jt.commandsLabels = ["fichier","^gl^:ister","filtre","^gs^:upprimer","^gq^:uitter"];
     jt.showWelcome();
     jt.JardiDocs = new JardiDocs(process.env.JARDI_MONGO_URI);
     jt.JardiFichiers = new JardiFichiers(databasePath);

	 jt.JardiDocs.init((err) => {
	    if (err) {
	        jt.onError(err);
	        return;
	    }
	    jt.JardiFichiers.init((err) => {
            if (err) {
                jt.onError(err);
                return;
            }
	    	jt.showDashboard();
	    });
	 });
  }


  showWelcome() {
      term.clear();
      term.moveTo( 10 , 2 ) ;
      term( "Bienvenue sur JardiTerm !" ) ;
      term.moveTo( 10 , 5 ) ;
  }

  async showDashboard() {
      let jt = this;
      term.clear();
      term.moveTo( 1 , 1 ) ;
      term( "Commandes: " + jt.commandsLabels.join(' - ') ) ;
      term.moveTo( 1 , 2 ) ;
      term( "Filtre | ")
      term.moveTo( 10 , 2 ) ;
      term(jt.filtre == null ? "<aucun>" : jt.filtre.replace(/\^/g, "^^"));
      term.moveTo( 1 , 5 ) ;
      term( jt.content ) ;
      term.moveTo( 1 , 3 ) ;
      term( 'Votre commande: ' ) ;
      var cmd = await term.inputField(
      	{ history: jt.history , autoComplete: jt.commands , autoCompleteMenu: true }
      ).promise.catch((err) => jt.onError(err));
      jt.content = "";
      switch(cmd) {
        case "q":
        case "quitter":
            jt.bye();
            break;
        case "fichier":
            jt.fichier();
            break;
        case "l":
        case "ls":
        case "ll":
        case "lister":
            jt.lister();
            break;
        case "filtre":
            jt.filtrer();
            break;
        case "s":
        case "supprimer":
            jt.del();
            break;
        default:
            jt.content = "commande inconnue ?";
            jt.showDashboard();
      }
  }

  async filtrer() {
      let jt = this;
      term.moveTo( 1 , 5 ) ;
      term('Entrez un filtre sur le nom : ').eraseLineAfter();
      let nouveauFiltre = await term.inputField({}).promise.catch((err) => jt.onError(err));
      jt.filtre = (nouveauFiltre == "") ? null : nouveauFiltre;
      jt.showDashboard();
  }

  fichier() {
      let jt = this;
      var asyncCalls = [];
      jt.JardiFichiers.get({},(err, entries) => {
         entries.forEach((entry) => {
             asyncCalls.push((cb) => {
                jt.content += "\najout de l'entrée " + entry.nom;
                jt.JardiDocs.add(entry, cb);
             });
         });
         async.series(asyncCalls, (err, results) => {
             jt.content += "\n" + results.length + ' fichier(s) ajouté(s)';
             jt.showDashboard();
         });
      });
  }

  lister() {
      let jt = this;
      let options = {};
      if (jt.filtre != null) {
        options.nom = new RegExp(jt.filtre);
      }
      jt.JardiDocs.listDocuments(options, (err,docs) => {
         if (err) {
           jt.onError(err);
           return;
         }
         jt.content = (Array.isArray(docs) && docs.length > 1) ?
              docs.length + " entrée(s) trouvée(s) : " + docs.map(e => e.nom).join(" - ") :
              "Aucune entrée";
         jt.showDashboard();
       });
  }

  del() {
     let jt = this;
     jt.JardiDocs.deleteDocumentsAddOne({"nom":/(addOne|tomate|cosmos)/},  (err, deletedCount) => {
      if (err) {
        jt.onError(err);
        return;
      }
      jt.content = deletedCount + " Entrée(s) supprimée(s) ";
      jt.showDashboard();
    });
  }

  onError(errMessage) {
    console.error(errMessage);
    term.processExit(1);
  }

  bye() {
    term.clear();
    console.log("Au revoir!");
    term.processExit(0);
  }

  //~ private

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

module.exports = JardiTerm;