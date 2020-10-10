[JardiLib - retour](../README.md)
# JardiDocs - WiP -  ALPHA

Cas d'utilisation
- lister les documents (option)
- créer une contribution (proposer un nouveau document ou mise à jour d'un document existant)
- lister les contributions
- (admin) - accepter une contribution
- (admin) - refuser une contribution

## Gestion de la base de données
Une base de donnée `jardi-lib` publique existera, 
mais cette librairie permet de gérer sa propre instance.

(A compléter)

## Fonctions de la classe JardiDocs

### lister les documents
`listDocuments(options, cb) : list<document>`

`options` attributs :
- `nom`- nom exact ou regex,
- `mois` - liste de mois (1 : janvier, 12 : décembre), au moins un mois de cette liste doit apparaître dans les périodes du document,
- `champs` - liste de clés. Si absent, le document entier est retourné, sinon uniquement les champs concernés sont retournés.
- `bookmark` - `_id` du dernier document de la page précédente (exclu) pour la pagination.
- `limit` - nombre maximum d'élément à retourner (maximum : `1000`, défaut : `10`).

### créer une contribution 

`contribution(meta, <document>, cb) : <contribution>`

`document` :
``` 
{
  "nom": "cosmos",
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
- `type` : type d'élément, avec comme valeurs autorisées : `fleur`, `fruit`, `légume`, `arbre`. C'est un tableau car certaines entrées peuvent correspondre à plusieurs types.
- `semi` : information sur la période de semi
- `plantation` : information sur la période de plantation en pleine terre, ou repiquage
- `floraison` : information sur la période de floraison
- `sources` : tableau des sources utilisées pour le fichier concerné.

pour une période les clés de premier niveau sont : 
- `m` : liste des mois concernés(1 : janvier, 12 :décembre),
- `txt` : texte libre.

pour une source les clés de premier niveau sont : 
- `a` : label,
- `href` : lien web.

`meta` : ensemble de meta-data stockées avec la contribution (libre / ex. username/IP..).
Le timestamp de création de la contribution sera automatiquement ajoutée aux metas sous le clé `creationTs`.

### lister les contributions

`listContributions(meta, cb) : list<contribution>`

(A Compléter)


# Accès à la base de données en mode console

- Clonez le dépôt
```
git clone https://github.com/boly38/jardiCal.git
```

- Vous pouvez créer une base mongo via certains services en ligne (ex. [cloud.mongodb.com](https://cloud.mongodb.com/)).
Ou bien via docker.

- Personnalisez votre environnement (cf. [`initEnv.example.sh`](../env/initEnv.example.sh)) :
```
cp ./env/initEnv.example.sh ./env/initEnv.dontpush.sh
# vi ./env/initEnv.dontpush.sh
. ./env/initEnv.dontpush.sh
```

- Lancez l'exemple en mode console (+[terminal-kit](https://github.com/cronvel/terminal-kit#readme)) :

``` 
node jt
```