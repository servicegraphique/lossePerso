# OpenFreeMap API — analyse et référence technique

## Périmètre et provenance

- Dépôt demandé : https://github.com/althetinkerer/openfreemap-api
- Branche examinée : `main`.
- Commit : `f8f46a37ef9b8a2c19c1361843051e81bd544594`, daté du **29 septembre 2024**.
- Date de l'analyse : **2 novembre 2026**.
- Ce dépôt est un **fork de `hyperknot/openfreemap`**. Les métadonnées GitHub indiquent une création du fork le 4 octobre 2024 ; son HEAD examiné reste celui de septembre 2024. Le projet amont a continué à évoluer depuis.
- Malgré le nom `openfreemap-api`, il ne s'agit pas principalement d'un SDK ou d'une API REST de recherche d'adresses. Le dépôt contient l'**infrastructure de génération, de diffusion et de mise à jour de tuiles vectorielles OpenFreeMap**, ainsi que son site de présentation.
- Méthode : lecture du README, des guides, des scripts de déploiement, des modules HTTP/génération/DNS, des templates nginx, des tâches cron, du site Astro et des licences ; vérifications statiques et tests locaux sur des données synthétiques.
- Aucun déploiement, montage de système de fichiers, commande sudo, appel aux services de production ou test de charge n'a été effectué. Le clone externe n'a pas été modifié.
- Cette fiche est enregistrée dans le dépôt de travail `lossePerso`, sur la branche de session `arena/e557f8dd-losseperso`.

## 1. Objectif final du projet

**OpenFreeMap vise à fournir un hébergement de fonds de carte vectoriels, ouvert et utilisable en production, à partir des données OpenStreetMap, sans facturation à la vue ni clé API pour son instance publique.**

Le projet poursuit deux objectifs complémentaires :

1. **Pour les développeurs :** permettre d'afficher des cartes personnalisées dans des sites et applications via des styles compatibles avec MapLibre.
2. **Pour les opérateurs :** publier toute la chaîne technique nécessaire pour générer, distribuer, mettre à jour et auto-héberger ces cartes.

Le README présente l'instance publique comme gratuite, sans inscription, sans limite annoncée de vues ou de requêtes et financée par des dons. Il s'agit des engagements documentés du projet, **pas d'une disponibilité, d'une capacité ou d'un SLA vérifiés pendant cette analyse**. L'auto-hébergement a bien sûr ses propres coûts de serveur, stockage, bande passante et exploitation.

Le choix central est de servir des fichiers de tuiles pré-générées avec **nginx + Btrfs**, plutôt que d'exécuter un serveur applicatif de tuiles à chaque requête.

## 2. Ce que le projet fait — et ne fait pas

### Inclus

- Génération de tuiles vectorielles mondiales ou Monaco avec Planetiler.
- Extraction de fichiers MBTiles et déduplication par liens physiques.
- Création et compression d'images Btrfs distribuables.
- Publication de ces images et de fichiers MBTiles dans un stockage objet compatible R2.
- Téléchargement, montage en lecture seule et diffusion HTTP des tuiles.
- Diffusion des styles, polices, sprites et ressources Natural Earth.
- Génération de TileJSON et gestion de versions des données.
- Mise à jour automatisée des hôtes et supervision de la disponibilité.
- Gestion facultative d'enregistrements DNS round-robin via Cloudflare.
- Site de démonstration et guide d'intégration MapLibre.

### Explicitement exclus

- Recherche d'adresses et géocodage.
- Calcul d'itinéraires, navigation et instructions de conduite.
- Génération d'images statiques.
- Service de tuiles raster et imagerie satellite.
- Altimétrie.
- Hébergement de jeux de données ou de tuiles personnalisés appartenant aux utilisateurs.

OpenFreeMap fournit donc surtout le **fond de carte**. Une application qui a besoin d'un itinéraire ou d'une recherche d'adresses doit ajouter un géocodeur, un moteur de routage ou d'autres services.

## 3. Architecture générale

```text
OpenStreetMap + Natural Earth + Wikidata
                  │
                  ▼
          Planetiler / Java
                  │
                  ▼
         planet ou monaco.mbtiles
                  │
                  ▼
      extract_mbtiles.py + shrink_btrfs.py
       fichiers .pbf dédupliqués dans Btrfs
                  │
                  ▼
       tiles.btrfs.gz + tiles.mbtiles + SHA256SUMS
                  │
                  ▼
        rclone → stockage Cloudflare R2
       marqueur « done » après publication
                  │
                  ▼
             http_host.py sync
       téléchargement + décompression + montage
                  │
                  ▼
      nginx → tuiles, TileJSON, styles et assets
                  │
                  ▼
           MapLibre dans le navigateur
```

Trois rôles peuvent être déployés séparément :

- **HTTP host :** télécharge et sert les données ; c'est le rôle utile à la plupart des auto-hébergeurs.
- **Tile generator :** produit de nouvelles données ; rôle lourd et facultatif puisque des exports sont publiés.
- **Load balancer :** contrôle les hôtes et, en mode correction, ajuste les enregistrements DNS.

Le dépôt contient également un proxy Cloudflare Worker de diagnostic. Ce proxy traite des chemins de styles ; il ne constitue pas le serveur principal de tuiles.

## 4. Stack et organisation du code

| Couche | Technologies / fichiers |
| --- | --- |
| Déploiement | Python ≥ 3.10, Click, Fabric, SSH, `init-server.py`, `ssh_lib/` |
| Génération | Java 21, Planetiler, SQLite/MBTiles, Python, Btrfs, rsync, pigz |
| Publication | rclone, Cloudflare R2, index de fichiers et marqueurs de fin |
| Diffusion | Ubuntu, nginx, fichiers statiques, images Btrfs montées en boucle et en lecture seule |
| Mise à jour | cron, flock, scripts Python, versions `latest` et `deployed` |
| Disponibilité | Round-robin DNS, API Cloudflare, contrôles avec pycurl, alertes Telegram |
| Site public | Astro 4, CSS, MapLibre GL JS chargé via CDN |
| Qualité | Ruff, Biome, Prettier, nginxfmt ; workflow GitHub Pages pour le site |

### Répertoires principaux

```text
init-server.py                  Commandes de déploiement SSH
ssh_lib/                        Préparation serveur, nginx, certificats, Planetiler
config/                         Modèles de configuration locale
modules/http_host/              Téléchargement, montage, versions et configuration nginx
modules/tile_gen/               Génération, extraction, compression et publication
modules/loadbalancer/           Contrôles de santé et gestion DNS
modules/ledns/                  Publication de certificats DNS dans le stockage privé
modules/debug_proxy/            Worker Cloudflare de diagnostic
website/                        Site Astro et démonstration MapLibre
docs/                           Auto-hébergement, développement et notes techniques
```

Les fonctions partagées de contrôle de version et de santé se trouvent dans `modules/tile_gen/tile_gen_lib/shared.py`. Les modules HTTP et load balancer y accèdent par des **liens symboliques** nommés `shared.py`. Ces liens sont bien présents dans le clone : il ne faut pas les confondre avec des imports manquants.

Les styles eux-mêmes sont développés dans un dépôt séparé, référencé par le README : `hyperknot/openfreemap-styles`.

## 5. Déploiement et exploitation

### Principe

Le dépôt n'est pas une application à installer sur un poste de travail ordinaire. Les scripts préparent des **serveurs Ubuntu dédiés et propres**, via SSH et avec des privilèvements administrateur.

Le guide indique, pour cet état du code :

- HTTP host : environ **300 Go de SSD et 4 Go de RAM** pour une génération de données hébergée.
- Générateur : environ **500 Go de SSD et au moins 64 Go de RAM**.
- Ubuntu 22 ou supérieur.

Ces valeurs sont des indications documentées, pas un dimensionnement garanti. Le téléchargement, la décompression, la conservation de deux versions et la génération demandent de la marge disque supplémentaire. Le code vérifie notamment un espace libre équivalent à trois fois la taille de l'archive Btrfs avant téléchargement.

### Commandes documentées

Après préparation de `config/.env` et installation du paquet Python local :

```text
./init-server.py http-host-static HOSTNAME
./init-server.py http-host-autoupdate HOSTNAME
./init-server.py tile-gen HOSTNAME [--cron]
./init-server.py loadbalancer HOSTNAME
```

Ces commandes sont consignées pour compréhension ; **elles ne doivent pas être lancées sur une machine non dédiée**.

### Modifications système importantes

Le déploiement peut notamment :

- mettre à jour les paquets Ubuntu ;
- créer un utilisateur `ofm` avec sudo sans mot de passe ;
- installer et remplacer la configuration nginx ;
- installer Certbot et demander des certificats ;
- modifier `/etc/fstab` et monter/démonter des images ;
- modifier des paramètres kernel et limites de fichiers ;
- remplacer des répertoires de code et supprimer d'anciens logs ;
- installer des tâches cron ;
- compiler une version déterminée de Planetiler.

Il n'y a pas de Docker dans cette architecture. L'isolation recommandée par le projet est une machine virtuelle ou un serveur dédié.

### Configuration

Le modèle `.env.sample` prévoit notamment :

- `SSH_PASSWD`, facultatif si l'authentification SSH par clé est utilisée ;
- `DOMAIN_LE` et `LE_EMAIL` pour un certificat Let's Encrypt HTTP ;
- `SKIP_PLANET` pour éviter le téléchargement mondial pendant un essai ;
- `DOMAIN_LEDNS`, `HTTP_HOST_LIST` et les paramètres Telegram pour l'infrastructure distribuée.

Le déploiement transforme ces valeurs en `config.json` sur le serveur. Des fichiers `cloudflare.ini` et `rclone.conf` sont nécessaires pour certaines fonctions. Dans ce snapshot, `upload_config_json()` exige aussi la présence de `cloudflare.ini`, même si le guide d'auto-hébergement simple insiste surtout sur `.env` : c'est un écart à connaître avant déploiement.

## 6. Génération et stockage des tuiles

### Planetiler

`run_planetiler(area)` accepte les zones configurées `planet` et `monaco`. Planetiler télécharge les données nécessaires, utilise les données Wikidata et produit un MBTiles. Le générateur utilise un heap Java de 30 Go pour le monde et de 1 Go pour Monaco dans ce snapshot.

La version de Planetiler est fixée par un commit dans `ssh_lib/planetiler.py`, mais l'installation compile ce projet et ses sous-modules au déploiement. Les dépendances Python ne sont généralement pas verrouillées à une version exacte : la réutilisation à long terme demanderait une politique de verrouillage plus stricte.

### Extraction MBTiles et déduplication

`extract_mbtiles.py` exploite les tables normalisées produites par Planetiler :

- `tiles_data` contient les contenus de tuiles ;
- `tiles_shallow` associe les coordonnées à un identifiant de contenu.

Le script :

1. écrit les contenus dans une arborescence de déduplication ;
2. inverse l'axe Y de la convention TMS vers la convention XYZ utilisée dans les URL ;
3. crée des liens physiques vers `tiles/z/x/y.pbf` ;
4. traite la limite de liens physiques Btrfs en créant des copies de relais lorsque nécessaire ;
5. extrait les métadonnées et complète l'attribution.

**Deux coordonnées différentes qui représentent la même image peuvent ainsi partager un seul contenu sur disque.** C'est un élément essentiel de la réduction du volume de stockage.

### Image Btrfs

La génération crée deux grandes images, extrait les données dans la première, puis les synchronise vers la seconde avec préservation des liens physiques. L'image finale est rééquilibrée, rétrécie, tronquée, compressée avec pigz et accompagnée d'empreintes SHA-256.

Le README décrit l'ordre de grandeur de la production comme environ 300 millions de petits fichiers. Ce chiffre n'a pas été mesuré pendant l'analyse.

## 7. Diffusion HTTP sans serveur de tuiles applicatif

### Téléchargement et montage

Les images sont téléchargées avec aria2, décompressées avec unpigz, puis enregistrées dans :

```text
/data/ofm/http_host/runs/{area}/{version}/tiles.btrfs
```

Elles sont montées en lecture seule dans :

```text
/mnt/ofm/{area}-{version}
```

Le script génère les entrées `/etc/fstab` correspondantes et exécute `mount -a`. nginx accède ensuite directement aux fichiers. Les performances reposent notamment sur le cache du kernel, `sendfile` et le cache de fichiers ouverts de nginx.

### Contrats HTTP principaux

| Chemin | Réponse |
| --- | --- |
| `/{area}` | TileJSON de la version actuellement déployée |
| `/{area}/{version}` | TileJSON d'une version déterminée, avec mécanismes de compatibilité décrits ci-dessous |
| `/{area}/{version}/{z}/{x}/{y}.pbf` | Tuile vectorielle protobuf gzip |
| `/styles/{nom}` | Style JSON |
| `/fonts/...` | Polices nécessaires au rendu |
| `/sprites/...` | Sprites des styles |
| `/natural_earth/...` | Ressources Natural Earth utilisées par les styles |

Les URL de tuiles versionnées sont servies avec un cache long, jusqu'à dix ans. Le TileJSON de la version courante a un cache plus court, d'un jour. Les styles ont également un cache d'un jour dans les templates examinés. Les réponses ajoutent `Access-Control-Allow-Origin: *`.

Une tuile absente peut retourner une réponse vide avec le statut 200, afin de représenter une zone sans données. Les templates nginx utilisent aussi des emplacements génériques pour les URL de version : une version inconnue peut être résolue vers la version déployée plutôt que provoquer systématiquement une 404. Il ne faut donc pas assimiler toutes les URL versionnées à un stockage strictement immuable.

### TileJSON

`metadata_to_tilejson.py` transforme les métadonnées MBTiles en TileJSON 3.0.0 : URL de tuiles, couches vectorielles, limites, centre, zooms, nom, version et attribution.

## 8. Versions et mises à jour

La synchronisation HTTP est prévue chaque minute, avec `flock` pour éviter les exécutions simultanées.

Elle :

1. récupère les identifiants de versions déployées ;
2. met à jour les assets ;
3. télécharge les versions `latest` et `deployed` de Monaco, puis du monde si activé ;
4. conserve au maximum deux versions locales par zone ;
5. régénère les montages et la configuration nginx si nécessaire ;
6. nettoie les anciens montages après la bascule.

Le maintien temporaire de l'ancienne version permet de renouveler les données sans interrompre brutalement les requêtes en cours. Le code peut supprimer le fichier image encore monté, mettre nginx à jour, puis démonter l'ancien point de montage.

Le marqueur distant `done` indique qu'une publication est terminée. Avant de modifier la version officiellement déployée, le générateur vérifie que la nouvelle version répond sur les hôtes configurés.

Planification présente dans ce snapshot :

- Monaco : génération quotidienne ; contrôle de publication chaque minute.
- Monde : génération le mercredi ; contrôle de publication le samedi.
- Hôtes HTTP : synchronisation chaque minute.

Ces horaires décrivent le code examiné, pas nécessairement l'infrastructure publique actuelle.

## 9. Disponibilité et répartition de charge

Le projet décrit un **round-robin DNS**, et non un reverse proxy applicatif central. Le module Cloudflare peut vérifier chaque hôte et gérer ses enregistrements A non proxifiés avec un TTL de 300 secondes.

Les contrôles portent sur le TileJSON, une tuile réelle et, hors période de transition, le style et la version courante. Une fenêtre assouplie de trois minutes accompagne les changements de version. Les erreurs peuvent être notifiées sur Telegram.

Dans la tâche cron fournie :

- `check` est actif ;
- `fix`, qui modifie réellement les DNS, est commenté.

Le mode correction supprime puis recrée les enregistrements nécessaires : cette opération n'est pas atomique. Si aucun hôte ne paraît valide, il réintroduit toute la liste par sécurité. Une liste d'hôtes vide mérite aussi une vigilance particulière : la boucle de vérification côté générateur peut ne tester aucun serveur et considérer la vérification comme réussie.

## 10. Intégration dans une application

Le client de référence est MapLibre GL JS, ou MapLibre Native sur mobile. Exemple adapté du guide et centré sur Antananarivo :

```html
<link href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" rel="stylesheet">
<script src="https://unpkg.com/maplibre-gl/dist/maplibre-gl.js"></script>
<div id="map" style="width:100%;height:500px"></div>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [47.5079, -18.8792], // longitude, latitude : Antananarivo
    zoom: 12
  });
</script>
```

Les styles présentés sont Bright, Liberty et Positron ; une démonstration utilise aussi une vue 3D avec inclinaison. Un style modifié avec Maputnik doit être hébergé par l'intégrateur : cela ne signifie pas qu'OpenFreeMap héberge ses données privées.

Pour un usage en production, il est préférable de fixer les versions des bibliothèques clientes plutôt que de dépendre d'une URL CDN non versionnée. L'attribution OpenStreetMap et OpenMapTiles doit rester visible selon les conditions documentées.

## 11. Comparaison avec MagixMaps

| Sujet | MagixMaps | OpenFreeMap |
| --- | --- | --- |
| Niveau principal | Composant JavaScript d'intégration | Infrastructure cartographique complète |
| Fonction centrale | Marqueurs, adresse, itinéraire, géocodage administratif | Génération et diffusion d'un fond de carte vectoriel |
| Socle cartographique | Google Maps | MapLibre et données ouvertes |
| Recherche et itinéraires | Oui, via Google | Non, services à ajouter |
| Auto-hébergement des données | Non | Oui, avec serveurs dédiés |
| Exploitation | Simple inclusion JS, clé et quotas Google | SSH, nginx, Btrfs, stockage, certificats, mises à jour |

**Les deux projets sont complémentaires, mais ne sont pas interchangeables.** Remplacer Google Maps par OpenFreeMap ne consiste pas simplement à changer une URL dans MagixMaps : les marqueurs, fenêtres, géocodeur et moteur d'itinéraires de MagixMaps utilisent des API Google spécifiques. Une migration demanderait une adaptation vers MapLibre et des services séparés pour les fonctions absentes.

## 12. Points de vigilance et limites de maintenance

### Sécurité et intégrité

- Les scripts sont très privilégiés et destructifs pour certaines configurations existantes : utiliser exclusivement un environnement dédié et sauvegardé.
- Le déploiement affiche le JSON de configuration, qui peut contenir un jeton Telegram. Revoir la gestion des secrets et des logs avant réutilisation.
- Le téléchargement HTTP vérifie la taille et s'appuie sur HTTPS, mais ne vérifie pas systématiquement les empreintes SHA-256 publiées avec les images. L'extraction des archives suppose la confiance dans la source.
- Les appels aux API Cloudflare et Telegram doivent utiliser des droits minimaux ; plusieurs requêtes n'ont pas de timeout explicite.
- L'utilisateur technique dispose de sudo sans mot de passe : le durcissement SSH et l'isolation du serveur sont essentiels.

### Anomalie concrète relevée

La tâche `modules/http_host/cron.d/ofm_ledns_reader` contient :

```text
2 34 * * * ...
```

Le champ des heures vaut `34`, alors qu'une heure cron numérique doit être comprise entre 0 et 23. Cette planification de renouvellement/lecture des certificats DNS est donc invalide dans le snapshot et doit être corrigée avant d'utiliser ce mécanisme.

### Maintenance et reproductibilité

- Le fork demandé date de 2024. Ne pas l'utiliser comme représentation de l'état actuel du projet amont sans comparaison complémentaire.
- Les dépendances système et Python sont peu verrouillées ; le site possède un lockfile pnpm, mais le workflow GitHub Pages demande `pnpm@latest`.
- Le workflow GitHub Actions construit le site, pas une validation complète de l'infrastructure.
- Aucun test unitaire versionné n'a été trouvé ; les scripts de lint peuvent modifier les fichiers et ne doivent pas être confondus avec des tests en lecture seule.
- Les performances annoncées dans les notes sont historiques et dépendantes du matériel. Elles ne constituent pas une garantie pour un autre hébergeur.
- La configuration distingue mal certains besoins simples et avancés, notamment la présence obligatoire de `cloudflare.ini` dans le déploiement commun.

## 13. Licences et attribution

Le **code du dépôt est sous licence MIT**. Cela ne place pas toutes les données et ressources sous la même licence :

- données OpenStreetMap : licence ODbL et obligation d'attribution ;
- OpenMapTiles : code BSD 3-Clause et design CC BY 4.0 selon le fichier de licences ;
- styles : licences BSD et Creative Commons variables selon leur origine ;
- polices Noto Sans : SIL Open Font License ;
- icônes Maki : CC0 ;
- Natural Earth : domaine public selon la documentation du projet.

L'attribution demandée est : **OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap**, avec les liens correspondants. Le fichier `LICENSE.md` doit accompagner toute réutilisation du code selon les conditions MIT.

## 14. Vérifications effectuées

- Syntaxe Python analysée avec `ast.parse` sur **45 fichiers** : succès.
- Imports locaux vérifiés, y compris les liens symboliques vers `shared.py` : fichiers correspondants présents.
- Six imports Markdown du guide Astro : fichiers présents.
- Syntaxe de **6 scripts shell** vérifiée avec `bash -n`, sans les exécuter : succès.
- Syntaxe JavaScript du site et du proxy vérifiée avec `node --check` : succès.
- `ruff check . --no-cache` avec Ruff 0.17.3 : succès ; avertissement indiquant que la règle configurée `PT004` a été supprimée dans cette version de Ruff.
- Test sur un MBTiles synthétique : inversion TMS/XYZ, déduplication, égalité d'inodes des liens physiques, métadonnées, attribution, génération TileJSON et refus d'extraire dans un répertoire non vide : succès.
- Contrôle numérique simple des tâches cron : détection de l'heure invalide `34` signalée ci-dessus.

Ces tests ne valident pas un déploiement Ubuntu, nginx, Btrfs, Certbot, R2, Cloudflare DNS ou le service public. Aucun benchmark de production n'a été reproduit.

## 15. Résumé à mémoriser

**OpenFreeMap est une chaîne ouverte de production et de diffusion de fonds de carte vectoriels. Son innovation d'exploitation consiste à transformer de grands MBTiles en fichiers dédupliqués dans des images Btrfs, puis à les servir directement avec nginx, avec un versionnement et des mises à jour automatisés.**

Pour afficher une carte, un développeur peut utiliser l'instance publique avec MapLibre. Pour maîtriser l'infrastructure, il peut déployer un hôte HTTP et réutiliser les exports publiés, sans avoir à régénérer lui-même la planète. Pour une application complète, la recherche, le routage et les fonctions métier restent à développer ou à intégrer séparément.

## Références

- [README du snapshot examiné](https://github.com/althetinkerer/openfreemap-api/blob/f8f46a37ef9b8a2c19c1361843051e81bd544594/README.md)
- [Guide d'auto-hébergement](https://github.com/althetinkerer/openfreemap-api/blob/f8f46a37ef9b8a2c19c1361843051e81bd544594/docs/self_hosting.md)
- [Déploiement SSH](https://github.com/althetinkerer/openfreemap-api/blob/f8f46a37ef9b8a2c19c1361843051e81bd544594/ssh_lib/tasks.py)
- [Synchronisation HTTP](https://github.com/althetinkerer/openfreemap-api/blob/f8f46a37ef9b8a2c19c1361843051e81bd544594/modules/http_host/http_host_lib/sync.py)
- [Extraction et déduplication MBTiles](https://github.com/althetinkerer/openfreemap-api/blob/f8f46a37ef9b8a2c19c1361843051e81bd544594/modules/tile_gen/scripts/extract_mbtiles.py)
- [Génération nginx](https://github.com/althetinkerer/openfreemap-api/blob/f8f46a37ef9b8a2c19c1361843051e81bd544594/modules/http_host/http_host_lib/nginx.py)
- [Licences](https://github.com/althetinkerer/openfreemap-api/blob/f8f46a37ef9b8a2c19c1361843051e81bd544594/LICENSE.md)
- [Projet amont](https://github.com/hyperknot/openfreemap)
