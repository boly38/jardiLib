# jardiLib - BETA

Librairie de mise à disposition de données sur le jardin


## Présentation

L'objectif est de mettre à disposition un ensemble de données sur le jardin : semi, repicage, récolte, floraison. 

- Une librairie et une classe `JardiService` permet d'interroger les données.
- Les données sont maintenues sous la forme de fichiers plats json qui doivent rester simples à faire évoluer: 
1 fichier == 1 élément du jardin (légume, fleur, arbre, ou autre)
- aucun service de gestion de base de données n'est requis.

## Beta notice

BETA - pour le moment, la librairie est en "beta".
 Cette librairie est susceptible d'évoluer sans préavis et sans garantie de retro-compatibilité.

# Données

Les données sont présentes sous le dossier `database/` et voici le format d'un fichier

``` 
{
  "type": ["fleur"],
  "semi": { "m": [3,4]},
  "plantation": { "m": [4,5,6], "txt": "Les repiquages et les mises en place des plants s'effectuent à la mi-mai lorsque les risques de gelées sont passés."},
  "floraison": { "m": [5, 6,7,8,9,10], "txt": "Abondantes fleurs simples, semi-doubles ou doubles du mois de mai jusqu'aux gelées."},
  "sources": [
    { "a": "Homejardin - Cosmos",
      "href":"http://www.homejardin.com/cosmos/cosmos.html"}
  ]
}
```
les clés de premier niveau sont : 
- `type` : type d'élément, avec comme valeur autorisée: `fleur`, `fruit`, `légume`, `arbre`. C'est un tableau car certaines entrées peuvent correspondre à plusieurs types.
- `semi` : information sur la période de semi
- `plantation` : information sur la période de plantation en pleine terre, ou repiquage
- `floraison` : information sur la période de floraison
- `sources` : tableau des sources utilisées pour le fichier concerné.

Les périodes (`<semi|plantation|floraison>`) sont décrites comme suit:
- `m` : le(s) mois concerné(s) (de `1`: janvier à `12`:décembre)
- `txt` : texte libre, information complémentaire sur la période ou sur l'action.

# Utilisation en mode console

Exécutez les commandes suivantes :
``` 
# j'installe la librairie
npm i jardi-lib

# je créer un usage console
cat <<EOF > jc.js
const JardiConsole =  require('jardi-lib/JardiConsole.js');

try {
    new JardiConsole();
} catch (exception) {
    console.info("JardiConsole Exception", exception);
}
EOF

# c'est parti !
node jc
```