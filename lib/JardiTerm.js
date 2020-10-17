const term = require( 'terminal-kit' ).terminal ;
const async = require("async");
const path = require('path');
const JardiDocs = require('./JardiDocs.js');
const JardiFichiers = require('./JardiFichiers.js');
const databasePath = path.join(__dirname, '../database');

class JardiTerm {
  constructor() {
     var jt = this;
     jt.month = 1;
     jt.filtre = null;
     jt.content = "";
     jt.history = ["lister"];
     jt.userCommands = ["+","-","voir","lister","filtre","quitter"]
     jt.userCommandsLabels = ["+","-","^gv^:oir","^gl^:ister","^gf^:iltre","^gq^:uitter"]
     jt.adminCommands = ["contribuer","modérer","examiner"]
     jt.adminCommandsLabels = ["^gc^:ontribuer","^gm^:odérer","^ge^:xaminer"]
     jt.ownerCommands = ["supprimer"]
     jt.ownerCommandsLabels = ["^gs^:upprimer"]
     jt.commands = jt.userCommands;
     jt.commandsLabels = jt.userCommandsLabels;
     jt.showWelcome();
     jt.JardiDocs = new JardiDocs(process.env.JARDI_MONGO_URI, process.env.JARDI_ADMIN_MONGO_DB_NAME);
     jt.JardiFichiers = new JardiFichiers(databasePath);
     jt.roles = [];

	 jt.JardiDocs.init((err) => {
	    if (err) {
	        jt.onError(err);
	        return;
	    }
        if (jt.JardiDocs.hasAdminRole()) {
           jt.roles.push("adm");
           jt.commands = jt.commands.concat(jt.adminCommands);
           jt.commandsLabels = jt.commandsLabels.concat(jt.adminCommandsLabels);
        }
        if (jt.JardiDocs.hasOwnerRole()) {
           jt.roles.push("own");
           jt.commands = jt.commands.concat(jt.ownerCommands);
           jt.commandsLabels = jt.commandsLabels.concat(jt.ownerCommandsLabels);
        }
	    jt.JardiFichiers.init((err) => {
            if (err) {
                jt.onError(err);
                return;
            }
	    	jt.firstDashboard();
	    });
	 });
  }


  showWelcome() {
      term.clear();
      term.moveTo( 10 , 2 ) ;
      term( "Bienvenue sur JardiTerm !" ) ;
      term.moveTo( 0 , 5 ) ;
  }

  onKey(keyName) {
      var jt = this;
      switch(keyName) {
        case 'CTRL_C': jt.bye(); break;
        default:
      }
  }

  async firstDashboard() {
    var jt = this;
    await jt._sleep(1000);
    term.on( 'key' , function( name , matches , data ) {
        jt.onKey(name);
    } ) ;
    jt._setMonth((new Date()).getMonth()+1);
  }

  async showDashboard() {
      var jt = this;
      jt.showDashboardMenu();
      var cmd = await term.inputField(
      	{ history: jt.history , autoComplete: jt.commands , autoCompleteMenu: true }
      ).promise.catch((err) => jt.onError(err));
      switch(cmd) {
        case "q": case ":q": case "quitter": jt.bye(); break;
        case "c": case "contribuer": jt.contribuer(); break;
        case "l": case "ls": case "ll": case "lister": jt.lister(); break;
        case "v": case "voir": jt.showMonth(); break;
        case "f": case "filtre": jt.filter(); break;
        case "s": case "supprimer": jt.del(); break;
        case "m": case "modérer": jt.moderate(); break;
        case "e": case "examiner": jt.examine(); break;
        case "+": case "plus": jt._changeMonth(1); break;
        case "-": case "moins": jt._changeMonth(-1); break;
        default:
            jt.content = "commande inconnue ?";
            jt.showDashboard();
      }
  }

  showDashboardMenu() {
    var jt = this;
    var dashLine = 1;
    term.clear();

    term.moveTo( 1 , dashLine ) ;
    term( "Mois | %s | Filtre : %s", jt.month.toString().padStart(2, " "), jt.filtre == null ? "<aucun>" : jt.filtre.replace(/\^/g, "^^"))

    term.moveTo( 1 , dashLine+4 ) ;
    term( jt.content ) ;

    term.moveTo( 1 , ++dashLine ) ;
    term.grey( "commandes disponibles: " + jt.commandsLabels.join(' - ') + ' (roles: ' + jt.roles.join(' - ') + ')') ;

    term.moveTo( 1 , ++dashLine ) ;
    term( 'Votre commande : ' ) ;

  }

  async filter() {
      var jt = this;
      term.moveTo( 1 , 5 ) ;
      term('Entrez un filtre sur le nom : ').eraseLineAfter();
      let nouveauFiltre = await term.inputField({}).promise.catch((err) => jt.onError(err));
      jt.filtre = (nouveauFiltre == "") ? null : nouveauFiltre;
      jt.showDashboard();
  }

  showMonth() {
      var jt = this;
      var options = {};
      if (jt.filtre != null) {
        options.nom = new RegExp(jt.filtre);
      }
      options.mois = [jt.month];
      jt.JardiDocs.listDocuments(options, (err,docs) => {
         if (err) {
           jt.onError(err);
           return;
         }
         var semi = jt._getPeriodNames(docs, 'semi', jt.month);
         var plantation = jt._getPeriodNames(docs, 'plantation', jt.month);
         var floraison = jt._getPeriodNames(docs, 'floraison', jt.month);
         var recolte = jt._getPeriodNames(docs, 'recolte', jt.month);
         if (docs.length < 1) {
            jt.content = "Aucune entrée";
         } else {
            jt.content = docs.length + " entrée(s) trouvée(s) :\n";
            if (semi.length > 0) { jt.content += "\n > semi: " + semi.join(" - "); }
            if (plantation.length > 0) { jt.content += "\n > plantation: " + plantation.join(" - "); }
            if (floraison.length > 0) { jt.content += "\n > floraison: " + floraison.join(" - "); }
            if (recolte.length > 0) { jt.content += "\n > récolte: " + recolte.join(" - "); }
         }
         jt.showDashboard();
       });
  }

  contribuer() {
      var jt = this;
      var asyncCalls = [];
      jt.JardiFichiers.get({},(err, entries) => {
         entries.forEach((entry) => {
             asyncCalls.push((cb) => {
                jt.content += "\najout de la contribution [" + entry.nom_scientifique + "]";
                jt.JardiDocs.contribute(entry, cb);
             });
         });
         async.series(asyncCalls, (err, results) => {
             jt.content += "\n" + results.length + ' fichier(s) ajouté(s)';
             jt.showDashboard();
         });
      });
  }

  lister() {
      var jt = this;
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
         // DEBUG // jt.content = JSON.stringify(docs, null, 2);
         jt.showDashboard();
       });
  }

  moderate() {
      var jt = this;
      let options = {};
      jt.JardiDocs.listContribs(options, (err,docs) => {
         if (err) {
           jt.onError(err);
           return;
         }
         jt.content = (Array.isArray(docs) && docs.length > 1) ?
              docs.length + " entrée(s) trouvée(s) : " + docs.map(
                e => e.doc.nom_scientifique + "(" + e.doc.nom + ")"
              ).join(" - ") :
              "Aucune entrée";
         jt.showDashboard();
       });
  }

  async examine() {
      var jt = this;
      term.moveTo( 1 , 5 ) ;
      jt.JardiDocs.listContribs({}, (err, contribs) => {
        if (err) {
            jt.onError(err);
            return;
        }
        let allContribsNames = contribs.map(c => c.doc.nom_scientifique);
        if (allContribsNames.length == 0) {
                jt.content = "il n'y a aucune contribution";
                jt.showDashboard();
                return;
        }
        term.red('contributions à examiner: '+allContribsNames+'\n').eraseLineAfter();
        term.green('Entrez le nom d\'une contribution à examiner: ').eraseLineAfter();
        term.inputField({autoComplete: allContribsNames , autoCompleteMenu: false},
            (err, cNom) => {
                if (err) {
                    jt.onError(err);
                    return;
                }
                jt._showJsonEntity(contribs.filter(c => c.doc.nom == cNom)[0]);
                if (jt.JardiDocs.hasOwnerRole()) {
                  jt.examineDecide(cNom);
                  return;
                }
                jt.showDashboard();
            });
      });
  }

  examineDecide(contribName) {
    var jt = this;
    term.green("Accepter [" + contribName + "] ? [O|n] : ") ;
	term.yesOrNo({yes:["o","O","ENTER"], no:["n","N"]}, function(error, result) {
		if (result) {
			jt.JardiDocs.acceptContribution(contribName, (err, result) => {
			    if (err) {
                    jt.onError(err);
                    jt.content = "contribution erreur:" + err
                    jt.showDashboard();
                    return;
                }
                jt.content = "contribution [" + contribName + "] acceptée"
                jt.showDashboard();
			});
		} else {
			jt.showDashboard();
		}
	});
  }

  del() {
     var jt = this;
     jt.JardiDocs.deleteDocuments({"nom":/(tomate|cosmos)/},  (err, deletedCount) => {
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
    console.log("JardiTerm - Au revoir !");
	term.processExit(0) ;
  }

  //~ private
  _showJsonEntity(jsonEntity) {
    term.grey(JSON.stringify(jsonEntity, null, 2)+"\n");
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _setMonth(newMonth) {
    var jt = this;
    jt.month = newMonth  % 14;
    if (jt.month === 13) {
      jt.month = 1;
    }
    if (jt.month < 1) {
      jt.month = 12;
    }
    jt.showMonth();
  }

  _changeMonth(delta) {
    var jt = this;
    jt._setMonth(jt.month + delta);
  }

  _getPeriodNames(docs, section, month) {
    return docs.filter((d) => d[section]
                              && Array.isArray(d[section]["m"])
                              && d[section]["m"].includes(month))
               .map(d=>d.nom);
  }

}

module.exports = JardiTerm;