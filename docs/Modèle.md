[JardiFichiers](JardiFichiers.md), [JardiDocs](JardiDocs.md) >

# Données JardiLib

## Document

Fichier de définition MongoDB: [Document.js](../lib/schema/Document.js)

``` 
{
  "nom": "Cosmos",
  "nom_scientifique": "Cosmos bipinnatus",
  "type": ["fleur annuelle", "vivace"],
  "familles": ["Astéracées", "Composées"],
  "semi": { "m": [3,4,5]},
  "plantation": { "m": [4,5,6] },
  "floraison": { "m": [7,8,9,10] }
}
```
les clés de premier niveau sont : 
- `nom` : nom de l'élément,
- `nom_scientifique` : nom latin,
- `type` : type d'élément,
- `familles` : familles de l'élément
- `semi` : information sur la période de semi,
- `plantation` : information sur la période de plantation en pleine terre, ou repiquage,
- `floraison` : information sur la période de floraison,
- 'recolte' : information sur la période de récolte.

Les périodes (`<semi|plantation|floraison|recolte>`) sont décrites comme suit :
- `m` : le(s) mois concerné(s) (de `1`: janvier à `12`: décembre).

## Contribution

Fichier de définition MongoDB: [Contribution.js](../lib/schema/Contribution.js)

- `document` : cf. ci-dessus.
- `meta` : ensemble de meta-data stockées avec la contribution (libre / ex. username/IP..).
Le timestamp de création de la contribution sera automatiquement ajoutée aux metas sous le clé `creationTs`.
