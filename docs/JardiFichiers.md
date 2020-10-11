[JardiLib - retour](../README.md)

# Données fichier json en exemple

Des fichiers de données exemple sont présents sous le dossier [`database/`](../database)
 et voici le format d'un fichier :

``` 
{
  "nom": "Cosmos",
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
- `nom` : nom de l'élément,
- `type` : type d'élément, avec comme valeurs autorisées : `fleur`, `fruit`, `légume`, `arbre`. C'est un tableau car certaines entrées peuvent correspondre à plusieurs types.
- `semi` : information sur la période de semi,
- `plantation` : information sur la période de plantation en pleine terre, ou repiquage,
- `floraison` : information sur la période de floraison,
- `sources` : tableau des sources utilisées pour le fichier concerné.

Les périodes (`<semi|plantation|floraison>`) sont décrites comme suit :
- `m` : le(s) mois concerné(s) (de `1`: janvier à `12`: décembre)
- `txt` : texte libre, information complémentaire sur la période ou sur l'action.

# Utilisation des exemples en mode console

Exécutez les commandes suivantes :
``` 
# j'installe la librairie
npm i jardi-lib

# c'est parti !
node -e "const JardiConsole =  require('jardi-lib/lib/JardiConsole.js'); new JardiConsole();"
```