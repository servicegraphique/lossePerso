# Local Business Finder

Application locale gratuite de recherche et de prospection géographique d’entreprises. HTML5, CSS3 et JavaScript Vanilla, sans compte, sans publicité, sans clé API et sans backend payant.

## Démarrer sous Windows

1. Décompressez **tout** le dossier, pas seulement `start.bat`.
2. Double-cliquez sur **`start.bat`**.
3. L’application s’ouvre dans votre navigateur. Gardez la fenêtre du serveur ouverte.
4. Cliquez sur **Rechercher**, saisissez par exemple une activité et une ville, puis lancez la recherche.

Python 3 est utilisé s’il est présent. Sinon, le lanceur emploie PowerShell et le serveur HTTP intégré à Windows. Aucun téléchargement de dépendances n’est nécessaire. Le serveur n’écoute que sur `localhost` ; il ne publie pas l’application sur Internet. Les détails et limites figurent dans [INSTALLATION.md](docs/INSTALLATION.md).

## Fonctionnalités

- Tableau de bord avec compteurs réels, recherches récentes et carnet d’adresses.
- Recherche par nom, ville, code postal, pays, adresse et activité combinables.
- Résultats OpenStreetMap, déduplication par identifiant OSM, tri, filtres et pagination.
- Carte Leaflet locale, regroupement de marqueurs, popups et synchronisation liste/carte.
- Fiche détaillée : adresse disponible, GPS et précision, contacts, horaires, source et date.
- Photos explicitement liées à la fiche OSM, avec attribution ; import de photos personnelles.
- Favoris, historique des recherches, fiches récemment consultées et suppression des données.
- Exports CSV/JSON des résultats filtrés, export JSON des favoris et impression d’une fiche.
- IndexedDB et cache limité dans le temps ; coquille hors connexion après un premier chargement réussi.
- Interface française responsive, navigation clavier et respect de la réduction des animations.

## Ce que « gratuit » implique

Les données sont **déclaratives, collaboratives et incomplètes**. Un résultat absent n’implique pas une entreprise inexistante. Aucun champ manquant n’est inventé. Les coordonnées d’un bâtiment peuvent désigner son centre, pas son entrée. Une recherche par nom seul utilise Nominatim ; une recherche géographique utilise Overpass dans une zone limitée.

**Internet est nécessaire** pour interroger les services publics et charger les tuiles OpenStreetMap. Les fiches enregistrées, leurs champs et les photos importées restent accessibles hors connexion. Le fond de carte n’est pas téléchargé en masse.

Les services publics peuvent refuser une requête, être indisponibles ou appliquer leurs quotas. L’application n’effectue ni autocomplétion, ni recherche en arrière-plan, ni relance automatique après une erreur 429. Elle ne convient pas à un usage massif, à un scraping national ou à une API de production.

## Documentation

- [Installation et dépannage](docs/INSTALLATION.md)
- [Guide utilisateur](docs/USER-GUIDE.md)
- [Architecture, providers, sécurité et limites](docs/TECHNICAL-DOCUMENTATION.md)
- [Rapport de vérification](docs/TEST-REPORT.md)

## Développement facultatif

Le logiciel fonctionne sans Node.js. Node 20+ sert uniquement aux tests.

```bash
python3 server.py --host 127.0.0.1 --port 8765 --no-browser
npm test
npm run check
```

Les bibliothèques Leaflet 1.9.4 et Leaflet.markercluster 1.5.3 sont déjà incluses dans `assets/vendor/`, avec leurs licences. Aucun CDN n’est nécessaire pour le code de l’application.

## Confidentialité et licences

Les critères de recherche sont transmis aux fournisseurs publics nécessaires. Favoris, historique et photos personnelles restent dans IndexedDB, dans ce navigateur et à cette origine. Ils ne sont pas synchronisés entre appareils. Les exports peuvent contenir des données publiques d’entreprises : vérifiez vos obligations avant de les partager.

Données © les contributeurs [OpenStreetMap](https://www.openstreetmap.org/copyright), sous ODbL. Chaque photo possède sa propre licence, indiquée lorsque la source la fournit. Les bibliothèques tierces conservent leurs licences MIT. Voir [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
