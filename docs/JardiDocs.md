[JardiLib - retour](../README.md)

# JardiDocs - WiP -  ALPHA

Cas d'utilisation

| role  | fonctionnalité   | commentaire  |
|--------|-------|:--------|
| utilisateur|lister les documents (option)
| admin |créer une contribution|proposer un nouveau document ou mise à jour d'un document existant
| admin |lister les contributions
| propriétaire |refuser les contributions
| propriétaire |accepter les contributions


## Gestion de la base de données
Une base de donnée `jardi-lib` existe, mais cette librairie permet de gérer sa propre instance.

L'accès à la base se fait en fonction de l'environnement: cf. §"Accès à la base de données"

## Fonctions de la classe JardiDocs

### lister les documents
`listDocuments(options) : Promise((list<document>),(err))`

`options` attributs :
- `nom`- nom exact ou regex,
- `mois` - liste de mois (1 : janvier, 12 : décembre), au moins un mois de cette liste doit apparaître dans les périodes du document,
- `champs` - liste de clés. Si absent, le document entier est retourné, sinon uniquement les champs concernés sont retournés.
- `bookmark` - `_id` du dernier document de la page précédente (exclu) pour la pagination.
- `limit` - nombre maximum d'élément à retourner (maximum : `1000`, défaut : `10`).

### créer une contribution 

`contribution(meta, <document>, cb) : <contribution>`

- `document`, `contribution` : cf. [modèle](Modèle.md)



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