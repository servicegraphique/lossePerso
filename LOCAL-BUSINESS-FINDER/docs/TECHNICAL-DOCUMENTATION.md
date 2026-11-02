# Documentation technique — Local Business Finder 1.0.0

## 1. Architecture et choix

Application statique modulaire, sans framework ni backend métier. Le petit serveur HTTP sert les fichiers ; les providers publics sont interrogés directement par le navigateur. Aucun secret ne doit être placé dans le code client.

```text
Interface HTML / CSS responsive
  └─ app.js : composition, événements, actions utilisateur
      ├─ core : état observable, routeur hash, persistance applicative
      ├─ modules : dashboard, recherche, résultats, carte, fiche,
      │            favoris, historique, paramètres, exports
      ├─ services : orchestration recherche, HTTP, cache,
      │             Nominatim, Overpass, normalisation OSM, Commons
      ├─ utils : validation, échappement, formats, déduplication
      └─ database : transactions IndexedDB
          └─ favoris / historique / récents / cache / photos / paramètres
```

Les adaptateurs de services isolent les formats externes. Le modèle interne `Company` ne dépend pas de Leaflet. Un autre fournisseur doit produire ce même modèle, conserver une source exploitable et appliquer ses propres quotas ; aucune clé payante n’est prévue.

### Arborescence

```text
LOCAL-BUSINESS-FINDER/
├── index.html
├── start.bat / start.ps1 / server.py
├── sw.js
├── assets/{icons,images,fonts,vendor}/
├── css/{main,layout,components,dashboard,search,map,responsive}.css
├── js/
│   ├── app.js
│   ├── config/settings.js
│   ├── core/{router,state,events,storage}.js
│   ├── services/{nominatim,overpass,osm,commons}.service.js
│   ├── services/{http,cache,search-service}.js
│   ├── modules/{dashboard,search,results,map,company-details,favorites,history,export,settings,ui}.js
│   ├── utils/{validators,formatters,deduplication,helpers}.js
│   └── database/indexeddb.js
├── data/sample-companies.json (volontairement vide)
├── docs/{INSTALLATION,USER-GUIDE,TECHNICAL-DOCUMENTATION,TEST-REPORT}.md
├── tests/{core.test.js,services.test.js,browser.mjs}
└── README.md / THIRD-PARTY-NOTICES.md
```

## 2. Recherche et providers

### Nominatim

Endpoint : `https://nominatim.openstreetmap.org/search`.

- Géocodage d’une ville, d’un code postal ou d’une adresse avec `format=jsonv2`, `addressdetails=1`, `extratags=1`, `limit=1`.
- Recherche par nom sans localisation avec `limit=30` ; filtrage des classes correspondant à des établissements.
- Pas d’autocomplétion, pas de géocodage en masse, pas de requête à la frappe.
- File d’attente par origine et intervalle minimal de 1,1 seconde entre requêtes. Le navigateur ne permet pas de définir librement `User-Agent` : l’application ne le falsifie pas. Le Referer est limité à l’origine et les requêtes n’incluent pas de cookies.
- Cache de géocodage : 7 jours. Cache de recherche : 24 h.

Le centre géocodé sert uniquement de **référence de recherche**. Il n’est jamais injecté dans l’adresse d’une entreprise.

### Overpass

Endpoint : `https://overpass-api.de/api/interpreter`, méthode POST, corps `data=<Overpass QL>`.

- Si Nominatim retourne une relation ou une surface OSM : requête dans `area(3600000000+id)` ou `area(2400000000+id)` selon le type.
- Si le résultat est un point : `around:5000,lat,lon`, avec avertissement visible.
- Filtres `nwr` sur `shop`, `office`, `craft`, `healthcare`, certains `amenity` et `tourism`, ou catégorie choisie.
- Nom échappé pour la chaîne Overpass et la regex ; pas de concaténation de syntaxe utilisateur non échappée.
- `timeout:25`, `out center 100`, timeout client 35 secondes.
- Aucune relance automatique, notamment après 429. Les remarques de timeout/quota d’Overpass produisent un avertissement de résultats potentiellement incomplets.

Ces garde-fous réduisent la charge mais ne garantissent pas qu’une très grande zone aboutisse. Une recherche nationale ou un usage industriel nécessitent une infrastructure adaptée et l’accord du fournisseur, pas un contournement des quotas.

### Wikimedia Commons

Endpoint : `https://commons.wikimedia.org/w/api.php`, API `action=query`, `prop=imageinfo`, `iiprop=url|extmetadata`.

Seuls les tags OSM `wikimedia_commons=File:...` ou `image=https://...` sont exploités. Pas de recherche géographique approximative d’images. Les métadonnées HTML sont converties en texte avec `DOMParser`, jamais injectées comme HTML. Une image distante qui ne charge pas est retirée. Les photos personnelles sont des Blobs IndexedDB, affichés via des URL temporaires révoquées.

### Tuiles

`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, zoom maximal 19, attribution OSM permanente. Leaflet 1.9.4 et MarkerCluster 1.5.3 sont locaux. Les tuiles ne sont ni préchargées massivement ni conservées par le service worker. Respecter la [politique d’usage des tuiles OSM](https://operations.osmfoundation.org/policies/tiles/) ; un déploiement public à forte audience doit choisir un fournisseur adapté ou héberger ses tuiles.

Références : [Nominatim](https://nominatim.org/release-docs/latest/api/Search/), [politique Nominatim](https://operations.osmfoundation.org/policies/nominatim/), [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), [Leaflet](https://leafletjs.com/), [Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia).

## 3. Modèle de données

| Champ | Origine / règle |
|---|---|
| `id` | `type/osm_id`, clé de déduplication |
| `name`, `activity` | Tags OSM ou nom Nominatim |
| `address`, `postcode`, `city`, `country` | Champs `addr:*` disponibles ; pas de remplissage par le centre de recherche |
| `lat`, `lng` | Nœud OSM ou centre fourni pour way/relation ; validation des bornes |
| `precision` | Point OSM, centre d’emprise approximatif ou point Nominatim ; jamais « adresse exacte garantie » |
| `phone`, `website`, `openingHours` | Tags disponibles ; URL limitée à HTTP(S) |
| `source`, `sourceUrl`, `retrievedAt` | Provider, lien vers l’objet OSM et date de récupération |
| `image`, `commons` | Liens explicites de la fiche uniquement |
| `distanceKm` | Calcul à vol d’oiseau depuis la référence, non routier |
| `savedAt`, `viewedAt` | Dates locales d’enregistrement / consultation |

Les données OSM sont déclaratives : « sourcé » ne signifie pas « vérifié sur place ». Le pays peut être un code ISO lorsque c’est la valeur fournie. Les horaires sont affichés dans leur format source, sans prétendre calculer une ouverture en temps réel.

## 4. Persistance et hors connexion

IndexedDB `local-business-finder`, version 1 :

- `favorites` : fiches complètes, clé `id`.
- `history` : 50 critères et compteurs, clé `id`.
- `recent` : 20 dernières fiches, clé `id`.
- `cache` : réponses provider normalisées et expiration, clé `key`, maximum 100 entrées ; purge des expirés.
- `photos` : jusqu’à 5 Blobs par fiche, clé `id` de l’entreprise.
- `settings` : réservé aux paramètres persistants futurs ; aucun paramètre fictif dans l’interface.

Les enregistrements invalides sont ignorés à la lecture. Les erreurs de transaction/quota sont affichées. Si IndexedDB ne peut pas être ouvert, un repli mémoire explicite permet la consultation mais ne promet aucune persistance. Ce repli n’est pas silencieux.

Le service worker `lbf-shell-v1.0.0` précache la coquille et network-first les fichiers locaux. Il ne capture jamais les origines externes. Après modification du code, incrémenter sa version et mettre à jour la liste `SHELL`. Les chemins de la coquille supposent un lancement à la racine du serveur fourni, pas un sous-répertoire d’hébergement statique.

## 5. Sécurité et robustesse

- Échappement HTML des données tierces dans les listes, fiches et popups ; listeners DOM sur les boutons de popup.
- Validation des coordonnées et des identifiants ; rejet des réponses malformées sans résultats de remplacement.
- URL Web HTTP(S), photo distante HTTPS, téléphone nettoyé ; pas de `javascript:` ni d’attribut événement issu des données.
- CSV : BOM UTF-8, guillemets doublés, préfixe apostrophe pour `=`, `+`, `-`, `@`, tabulation ou retour chariot initial.
- Import : MIME image autorisé, décodage via `createImageBitmap`, taille max 5 Mo, nombre max 5. Ce contrôle n’est pas un antivirus.
- Pas de `eval`, pas de secret, pas de compte, pas de télémétrie applicative.
- Serveur Python : loopback par défaut, pas de listing de répertoires, chemins cachés refusés. L’option `--host 0.0.0.0` est réservée au preview de développement et ne doit pas être exposée publiquement.
- Serveur PowerShell : listener localhost, vérification du chemin racine, types MIME explicites. Il n’a pas été validé sur Windows dans cet environnement.
- Liens externes : `rel=noopener noreferrer`. Les critères de recherche restent visibles du provider ; « local » ne signifie pas « recherche hors ligne ».

## 6. Plan de réalisation et état

1. **Architecture et sources** : terminé, adaptateurs séparés et limites documentées.
2. **Recherche et résultats** : terminé, validation, cache, déduplication, filtres, tri, pagination.
3. **Carte** : terminé, Leaflet local, clusters, popups, centrage, synchronisation.
4. **Fiches et photos** : terminé, provenance, précision, import local et impression.
5. **Persistance et exports** : terminé, IndexedDB, favoris, historique, CSV/JSON, suppression.
6. **Vérification et documentation** : tests unitaires et navigateur exécutés ; détails et limites dans `TEST-REPORT.md`.

## 7. Limites assumées et évolutions

Pas de scraping de Pages Jaunes/Google, pas de recherche téléphonique inversée, pas de garantie d’exhaustivité, pas d’itinéraires, pas d’export automatique des photos personnelles, pas de synchronisation multi-appareils. Pas de bouton non implémenté.

Évolutions possibles : import JSON avec validation stricte, notes privées, sauvegarde/restauration complète, fournisseur de tuiles configurable, instance Nominatim/Overpass autorisée pour un usage plus soutenu, internationalisation. Ces évolutions ne sont pas présentées comme disponibles dans la version actuelle.
