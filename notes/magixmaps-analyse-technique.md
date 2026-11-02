# MagixMaps — analyse et référence technique

## Périmètre de l'analyse

- Dépôt : https://github.com/gtraxx/magixmaps
- Branche distante examinée : `main`.
- Commit examiné : `ec450bd53044f1f5316554b46a115bb33d461cc5` du 24 octobre 2026.
- Version du code principal : **3.0** ; dernière release publiée observée : **3.0**, le 13 septembre 2026.
- Date de l'analyse : 2 novembre 2026.
- Méthode : lecture du README, de la licence, des deux versions JavaScript, de la feuille LESS, des distributions et des pages HTML ; comparaison v2.3/v3.0 ; vérification syntaxique et simulations avec des doublures de l'API Google.
- Limite : aucun appel réel à Google Maps, aucun test de clé et aucun essai navigateur complet. Les conclusions sur le rendu réel, les quotas et la facturation restent à valider dans un projet Google Cloud configuré.
- Cette fiche est une référence conservée dans l'espace de travail, pas une modification du dépôt MagixMaps. Le code source de MagixMaps n'a pas été modifié.

## 1. Objectif du projet

**MagixMaps cherche à simplifier l'intégration de Google Maps dans un site web grâce à une petite classe JavaScript réutilisable, sans jQuery ni framework obligatoire.**

La bibliothèque répond principalement à deux besoins :

1. **Côté visiteur :** afficher une ou plusieurs adresses sur une carte, présenter leurs informations et calculer un itinéraire routier vers l'établissement principal.
2. **Côté administration :** convertir une adresse saisie dans un formulaire en latitude/longitude et remplir automatiquement les champs GPS.

Initialement liée à **Magix CMS**, elle est désormais présentée comme un composant autonome utilisable dans un site statique, une application PHP ou une application JavaScript.

Ce n'est ni un moteur cartographique autonome, ni un fournisseur de fonds de carte, ni une application complète de gestion de magasins. C'est une **couche d'intégration et d'interface au-dessus des services Google Maps**. Elle ne comprend pas de backend métier, de base de données ou système de persistance : l'application hôte fournit les données et sauvegarde les coordonnées si nécessaire.

## 2. Stack et organisation

| Élément | Rôle constaté |
| --- | --- |
| JavaScript Vanilla, classe ES6 | Noyau unique `MagixMaps`, exposé globalement par un script classique |
| Google Maps JavaScript API | Chargement de la carte et des bibliothèques Google ; canal `weekly` |
| Advanced Marker Element / PinElement | Marqueurs numérotés et repères A/B |
| Routes API, `Route.computeRoutes` | Calcul du trajet routier en v3.0 |
| Polyline | Tracé du trajet sur la carte |
| Geocoding API | Conversion adresse → coordonnées en mode administration |
| LESS puis CSS | Interface, panneau d'adresse et d'itinéraire, responsive, variables CSS |
| HTML | Conteneurs et exemples d'intégration |

Arborescence utile :

```text
README.md                     Documentation et contrats d'utilisation annoncés
LICENSE                       Double licence MIT ou GPLv3
index.html                    Page de présentation
src/MagixMaps.js               Source principale annotée v3.0, environ 389 lignes
src/MagixMaps-2.3.js           Ancienne version conservée dans le dépôt
src/MagixMaps.less            Source des styles
dist/magixmaps.js             Distribution JavaScript non minifiée, version 3.0
dist/magixmaps.min.js         Distribution JavaScript minifiée, version 3.0
dist/magixmaps*.css           CSS compilés et leurs source maps
examples/interactive-map.html Carte avec adresse et formulaire de départ
examples/multi-points-itinerary.html Affichage multi-points malgré son nom
examples/admin-geocoding.html Formulaire de géocodage
```

Absences constatées à ce commit : `package.json`, export ESM/CommonJS, configuration de build, tests automatisés et CI. Les fichiers de `dist/` sont fournis, mais leur procédure de génération n'est pas décrite par un outillage versionné.

Les démonstrations utilisent aussi Pico CSS, Font Awesome et Prism via CDN. Ces ressources habillent les exemples ; elles ne sont pas nécessaires au noyau JavaScript. En revanche, **Google Maps reste une dépendance externe incontournable**. « Sans dépendances » doit donc se comprendre comme « sans framework JavaScript tiers obligatoire », pas comme « fonctionne hors ligne sans service externe ».

## 3. Architecture et cycle de vie

```text
new MagixMaps(config)
  ├─ Fusion avec les options par défaut
  ├─ sanitizeData() : coordonnées et filtrage des marqueurs invalides
  ├─ bootstrap() : installation du chargeur Google et injection du script
  └─ init() asynchrone
       ├─ importLibrary("maps")
       ├─ importLibrary("marker")
       ├─ importLibrary("routes")
       ├─ importLibrary("geocoding")
       ├─ importLibrary("core")
       ├─ Si le conteneur existe : setupMap()
       │    ├─ renderMarkers()
       │    └─ setupUIEvents()
       └─ Si adminFields existe : setupAdminWatcher()
```

Les deux modes peuvent coexister dans une même instance. Le mode administration seul ne nécessite pas de conteneur de carte.

Nuance importante : les cinq bibliothèques sont importées séquentiellement à l'initialisation, même lorsqu'un seul mode est utilisé. Le chargement est asynchrone, mais il n'est pas strictement limité aux services nécessaires au mode choisi.

Le constructeur lance l'initialisation asynchrone sans exposer de promesse publique `ready`. `init()` intercepte ses erreurs et les écrit dans la console ; l'appelant ne reçoit pas directement une promesse d'initialisation à attendre.

### Méthodes à retenir

| Méthode | Responsabilité |
| --- | --- |
| `constructor(config)` | Configuration, état interne, nettoyage initial et démarrage |
| `sanitizeData()` | Conversion numérique des coordonnées, remplacement de la virgule décimale, suppression des valeurs NaN |
| `bootstrap()` | Chargeur dynamique Google Maps, clé, langue et canal `weekly` |
| `init()` | Import des bibliothèques et choix des modes |
| `setupMap()` | Création de la carte, centrage, zoom et Map ID |
| `renderMarkers()` | Marqueurs, InfoWindows, sélection du premier point, ajustement `fitBounds` |
| `createMarkerIcon(label, color)` | PinElement numéroté ou A/B |
| `calculateRoute(origin)` | Appel Routes, polyline, repères A/B, recadrage et instructions |
| `setupUIEvents()` | Ouverture/fermeture du panneau et soumission du départ |
| `updateAddressPanel(m)` | Mise à jour textuelle de l'adresse affichée |
| `setupAdminWatcher()` | Écoute des champs d'adresse |
| `debounceGeocode()` | Géocodage différé de 1 000 ms et remplissage GPS |
| `destroy()` | Nettoyage des éléments visibles, du minuteur principal et des écouteurs DOM enregistrés |

## 4. Configuration et contrat DOM

### Options principales

| Option | Défaut / forme | Sens |
| --- | --- | --- |
| `api_key` | À fournir | Clé Google Maps du projet hôte |
| `mapId` | `main-map` | **Identifiant HTML** du conteneur de carte |
| `googleMapId` | `DEMO_MAP_ID` | **Identifiant Google Cloud** du style/Map ID |
| `lang` | `fr` | Langue demandée à Google Maps |
| `zoom` | `15` | Zoom initial ou zoom pour un marqueur unique |
| `markers` | `[]` | Tableau des points à afficher |
| `adminFields` | `null` | Références aux éléments HTML du formulaire administratif |

Ne pas confondre `mapId` et `googleMapId`. L'attribut HTML `data-map-id` du conteneur est prioritaire sur `googleMapId` pour configurer le Map ID Google.

Sans marqueur, le centre de secours est approximativement Paris : `{ lat: 48.85, lng: 2.35 }`.

### Données des marqueurs

```javascript
{
  company: "Nom de l'établissement",
  address: "Adresse textuelle",
  postcode: "Code postal",
  city: "Ville",
  lat: 50.52,
  lng: 5.24
}
```

`lat` et `lng` sont nécessaires pour conserver un marqueur. Les chaînes numériques et les virgules décimales sont acceptées et converties avec `parseFloat`. Le code ne vérifie pas les plages géographiques valides et n'utilise pas `Number.isFinite` : la validation reste limitée.

`postcode` est utilisé par le code mais absent du tableau récapitulatif du README. Les autres champs servent surtout à l'affichage ; une donnée absente peut apparaître comme vide ou `undefined` dans une InfoWindow.

### DOM nécessaire à l'interface complète

La bibliothèque ne génère pas tous ces éléments : l'intégrateur doit les fournir.

```html
<div id="magix-maps-container">
  <div id="main-map" data-map-id="VOTRE_MAP_ID_GOOGLE"></div>
  <div id="gmap-address" class="open">
    <button type="button" class="hidepanel open" aria-label="Afficher ou masquer le panneau"></button>
    <form class="form-search">
      <input id="getadress" type="text" placeholder="Adresse de départ">
      <button type="submit">Calculer</button>
    </form>
    <div id="address">
      <span class="address"></span>
      <span class="city"></span>
    </div>
    <div id="r-directions"></div>
  </div>
</div>
```

Le conteneur et `#main-map` suffisent pour une carte simple. Le formulaire, `#getadress` et `#r-directions` sont nécessaires au parcours d'itinéraire complet. Les sélecteurs sont recherchés globalement dans `document`, et non à l'intérieur d'une instance isolée.

### Initialisation front-office

```html
<link rel="stylesheet" href="dist/magixmaps.min.css">
<script src="dist/magixmaps.min.js"></script>
```

```javascript
const map = new MagixMaps({
  api_key: 'VOTRE_CLE_GOOGLE_RESTREINTE',
  googleMapId: 'VOTRE_MAP_ID',
  lang: 'fr',
  zoom: 15,
  markers: [
    { company: 'Agence', address: 'Rue de la Station',
      postcode: '4500', city: 'Huy', lat: 50.52, lng: 5.24 }
  ]
});
```

Choisir une seule variante CSS. Le README montre les CSS normal et minifié ensemble, mais ce doublon n'est pas nécessaire. Ne pas charger simultanément `MagixMaps.js` et `MagixMaps-2.3.js` : les deux déclarent la même classe globale.

## 5. Fonctionnement détaillé

### Affichage des points

- Un AdvancedMarkerElement et un PinElement sont créés pour chaque point valide.
- Les points sont numérotés à partir de 1.
- Un clic ferme l'InfoWindow précédente, ouvre celle du point choisi et met à jour le panneau d'adresse.
- Plusieurs points : `fitBounds(bounds)` ajuste la vue.
- Un point : centrage et zoom configuré.
- Le premier point est automatiquement sélectionné au démarrage.

### Itinéraire v3.0

- Départ : texte récupéré dans `#getadress`.
- Destination : **toujours `this.markers[0].position`**, même si l'utilisateur a cliqué sur un autre marqueur.
- Mode : `DRIVING`, fixe.
- Appel : `Route.computeRoutes({ origin, destination, travelMode: 'DRIVING', fields: ['*'] })`.
- Rendu : `Polyline` à partir de `route.path`, puis marqueurs A et B aux extrémités.
- Recadrage sur les extrémités du trajet.
- Première route et premier leg utilisés.
- Instructions construites manuellement dans `#r-directions`, avec recherche de `navigationInstruction.instructions`, `instructions` ou `htmlInstructions`.
- Erreurs : message console et `alert` générique.

La présence de plusieurs marqueurs ne signifie donc pas qu'un trajet vers le point sélectionné ou une tournée multi-étapes est pris en charge.

### Géocodage administratif

```javascript
new MagixMaps({
  api_key: 'VOTRE_CLE_GOOGLE_RESTREINTE',
  adminFields: {
    street: document.querySelector('.input-rue'),
    postcode: document.querySelector('.input-cp'),
    city: document.querySelector('.input-ville'),
    lat: document.querySelector('.input-lat'),
    lng: document.querySelector('.input-lng')
    // country est aussi lu par le code, mais n'est pas documenté dans le README.
  }
});
```

- Écoute de `keyup`, `change`, `focusout` sur rue, code postal, ville et pays éventuel.
- Debounce de 1 000 ms.
- Adresse assemblée à partir des valeurs des champs ; longueur minimale de 10 caractères, ponctuation comprise.
- Premier résultat Google utilisé.
- Latitude/longitude écrites dans les champs ; flash vert du champ latitude pendant 500 ms.
- Pas de sauvegarde serveur : le formulaire hôte doit assurer la persistance.

Le contrat réel suppose des éléments DOM valides pour rue, code postal, ville, latitude et longitude. Le filtre des champs n'écarte que `undefined`, pas `null` : un sélecteur sans résultat peut donc provoquer une erreur.

### Style

Variables principales : `--mm-main-color`, `--mm-text-on-main`, `--mm-bg-panel`, `--mm-text-color`, `--mm-border-color`, `--mm-map-height`, `--mm-panel-width`, `--mm-form-height`, `--mm-alert-height`, `--mm-transition`.

Le panneau se replie latéralement ; une règle responsive modifie son comportement à 480 px. Les couleurs des pins et de la polyline sont toutefois codées en JavaScript : changer `--mm-main-color` ne suffit pas à personnaliser toute la carte. Les dimensions CSS ciblent aussi explicitement `#main-map` ou `.gmap3` ; un `mapId` HTML différent peut nécessiter des styles supplémentaires.

## 6. Nettoyage et utilisation en SPA

`destroy()` existe et effectue un nettoyage de base : arrêt du debounce principal, retrait des marqueurs et de la polyline, fermeture de l'InfoWindow, suppression des écouteurs DOM enregistrés et vidage du conteneur.

Il ne faut cependant pas le considérer comme une garantie de suppression absolue de toute activité :

- les références du tableau `eventListeners` ne sont pas vidées ;
- les écouteurs Google des marqueurs ne sont pas explicitement supprimés ;
- le minuteur visuel de 500 ms n'est pas suivi ;
- les calculs/géocodages déjà partis ne sont pas annulés et aucune generation d'instance n'empêche une réponse tardive de modifier l'état ;
- le chargeur Google global et le script déjà injecté restent dans la page.

Le chargeur Google est partagé par toutes les instances. Une deuxième initialisation avec une autre clé ou langue peut être ignorée par le chargeur déjà installé. Les sélecteurs DOM globaux et les identifiants fixes compliquent aussi la cohabitation de plusieurs cartes. Pour un usage SPA exigeant, prévoir une couche d'isolation et tester soigneusement montage/démontage et réponses asynchrones.

## 7. Évolution v2.3 → v3.0

La différence fonctionnelle principale est le moteur d'itinéraires :

- v2.3 : `DirectionsService`, `overview_path`, positions de début/fin du leg ; panneau détaillé non implémenté dans cette méthode.
- v3.0 : `Route.computeRoutes`, `route.path`, étapes de navigation rendues manuellement et meilleur nettoyage des objets de trajet.

Les deux fichiers partagent la même architecture générale. La v3.0 ne constitue pas une réécriture complète en modules indépendants.

## 8. Points de vigilance avant réutilisation

### Priorité haute

1. **Google Cloud et coût :** configurer Maps JavaScript API et, selon les fonctions, Geocoding API et Routes API ; vérifier activation, quotas, facturation et restrictions de la clé. Le code demande `fields: ['*']` pour les routes : réduire le masque aux champs utiles après vérification de la documentation Google.
2. **Clés des démonstrations :** les trois pages d'exemples contiennent une valeur de clé Google codée en dur, alors que le README avertit qu'aucune clé n'est fournie pour la démo. Validité et restrictions non vérifiées. Ne pas réutiliser cette valeur ; utiliser sa propre clé correctement restreinte.
3. **Données non fiables et HTML :** company/address/city sont interpolées dans le HTML des InfoWindows ; les instructions sont injectées avec `innerHTML`. Échapper les données utilisateur et maîtriser toute source externe avant intégration.
4. **Nettoyage asynchrone :** compléter et tester `destroy()` si l'application monte/démonte fréquemment la carte.

### Priorité fonctionnelle

- Itinéraire limité au premier marqueur et au mode voiture.
- Pas de recherche de proximité, filtrage, clustering, tournée optimisée ou persistance intégrée.
- Validation géographique incomplète et gestion d'erreurs principalement console/alerte.
- Pas de promesse publique de disponibilité ni d'événements métier exposés.
- Initialisation de tous les modules Google même pour un besoin partiel.
- Documentation partiellement en avance sur le code : personnalisation dite complète, chargement modulaire et nettoyage complet demandent les réserves décrites ci-dessus.
- Le canal Google est `weekly`, et non une version Google fixe « 2026 » : prévoir une vérification lors des évolutions de l'API.

### Licence et maintenance

- `LICENSE` et les en-têtes du code indiquent une **double licence MIT ou GPLv3**.
- Le README et son badge ne mentionnent que GPLv3. Cette incohérence documentaire mérite clarification auprès de l'auteur avant une redistribution fondée sur le choix de licence.
- Aucun test automatisé ni pipeline de build n'a été trouvé à ce commit. Les distributions sont présentes, mais leur reproduction n'est pas outillée dans le dépôt.

## 9. Vérifications effectuées

- `node --check` : syntaxe valide pour les deux sources et les deux distributions JavaScript.
- Simulations locales sans réseau de la source, du JS distribué et du JS minifié : conversion de coordonnées, filtrage NaN, rendu de deux marqueurs, `fitBounds`, sélection d'adresse, calcul vers le premier point, instructions, géocodage et nettoyage de base.
- Confirmation par simulation du partage du chargeur global, de la conservation des références d'écouteurs après `destroy()` et du minuteur visuel non suivi.
- Confirmation séparée de l'erreur provoquée par un champ administratif `null`.
- Aucun test Google Maps réel : ces vérifications ne certifient ni l'affichage navigateur ni la disponibilité des services Google.

## 10. Résumé à retenir

**MagixMaps est une bibliothèque d'intégration Google Maps pour afficher des lieux, guider un visiteur vers un point principal et faciliter la saisie GPS en administration. Son intérêt est la simplicité d'intégration dans un site existant ; sa contrepartie est une dépendance forte aux services Google et un périmètre fonctionnel encore limité.**

Pour une carte d'entreprise, un petit réseau de points de vente ou un formulaire administratif, la base est pertinente. Pour un store locator avancé, plusieurs cartes simultanées, une navigation multi-destinations ou une exploitation offline, des développements supplémentaires sont nécessaires.

## Références de code

- [README](https://github.com/gtraxx/magixmaps/blob/ec450bd53044f1f5316554b46a115bb33d461cc5/README.md)
- [Classe principale et configuration](https://github.com/gtraxx/magixmaps/blob/ec450bd53044f1f5316554b46a115bb33d461cc5/src/MagixMaps.js#L1-L120)
- [Marqueurs et itinéraires](https://github.com/gtraxx/magixmaps/blob/ec450bd53044f1f5316554b46a115bb33d461cc5/src/MagixMaps.js#L125-L287)
- [Événements, géocodage et nettoyage](https://github.com/gtraxx/magixmaps/blob/ec450bd53044f1f5316554b46a115bb33d461cc5/src/MagixMaps.js#L289-L389)
- [Styles LESS](https://github.com/gtraxx/magixmaps/blob/ec450bd53044f1f5316554b46a115bb33d461cc5/src/MagixMaps.less)
- [Licence](https://github.com/gtraxx/magixmaps/blob/ec450bd53044f1f5316554b46a115bb33d461cc5/LICENSE)
- [Release 3.0](https://github.com/gtraxx/magixmaps/releases/tag/3.0)
