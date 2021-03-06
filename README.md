# jardiLib - ALPHA

Librairie de mise à disposition de données sur le jardin

[![License](https://img.shields.io/github/license/boly38/jardiLib.svg)](https://github.com/boly38/jardiLib)
[![Downloads](https://img.shields.io/npm/dm/jardi-lib.svg)](https://www.npmjs.com/package/jardi-lib)
[![Version](https://img.shields.io/npm/v/jardi-lib.svg)](https://www.npmjs.com/package/jardi-lib)

## Présentation

L'objectif est de mettre à disposition un ensemble de données sur le jardin : semi, plantation, récolte, floraison. 

- Une librairie et des classes permettent d'interroger les données.
- Les données sont maintenues sous la forme de documents json qui doivent rester simples à faire évoluer :
  1 document == 1 élément du jardin (légume, fleur, arbre, ou autre).
- Les données sont stockées dans une base NoSQL MongoDB.
- Un exemple existe avec une base de fichiers plats json

## ALPHA notice

ALPHA - pour le moment, la librairie est en "alpha".

 Cette librairie est en cours de construction et va évoluer sans préavis et sans garantie de retro-compatibilité.

- Gérer des données fichier json : voir [JardiFichiers](docs/JardiFichiers.md)
- Gérer des données jardi-lib MongoDB : voir [JardiDocs](docs/JardiDocs.md)


## Contributions

Merci d'utiliser les tickets, et pull-requests.

### Robot activés

| badge  | nom   | description  |
|--------|-------|:--------|
| [![Build Status](https://travis-ci.com/boly38/jardiLib.svg?branch=master)](https://travis-ci.com/boly38/jardiLib) |[Travis-ci](https://travis-ci.com/github/boly38/jardiLib)|Tests continus et publications sur npmjs.
|  |[Houndci](https://houndci.com/)|Relecture de code JavaScript |
| [![Automated Release Notes by gren](https://img.shields.io/badge/%F0%9F%A4%96-release%20notes-00B2EE.svg)](https://github-tools.github.io/github-release-notes/)|[gren](https://github.com/github-tools/github-release-notes)|Création automatisée de [release notes](https://github.com/boly38/jardiLib/releases)|