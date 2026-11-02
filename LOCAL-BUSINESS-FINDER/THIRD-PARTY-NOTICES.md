# Notices de tiers

## Bibliothèques embarquées

- **Leaflet 1.9.4** — BSD-2-Clause, © Vladimir Agafonkin et contributeurs. Texte intégral : `assets/vendor/leaflet/LICENSE`.
- **Leaflet.markercluster 1.5.3** — MIT, © Dave Leaver. Texte intégral : `assets/vendor/markercluster/LICENSE`.

Les fichiers distribués ne sont pas modifiés. Ils ont été obtenus depuis les paquets npm officiels et sont servis localement.

## Données et services

- **OpenStreetMap** : © les contributeurs OpenStreetMap, base de données sous [Open Database License (ODbL)](https://www.openstreetmap.org/copyright). Attribution visible dans l’application, les fiches et la documentation. Les données exportées conservent leur source ; la redistribution doit respecter l’ODbL.
- **Nominatim / Overpass** : services publics soumis à leurs politiques d’usage. Aucun accord commercial ni disponibilité garantie.
- **Wikimedia Commons** : chaque média a sa propre licence et ses propres exigences d’attribution. La licence et l’auteur fournis par l’API sont affichés ; vérifier la page source avant réutilisation.
- **Photos personnelles** : droits détenus ou autorisés par l’utilisateur. Elles restent locales et ne sont pas incluses dans les exports.

## Icônes et illustration

Les pictogrammes SVG et l’illustration cartographique décorative sont dessinés pour ce projet. Ils ne représentent aucun établissement réel. Aucun paquet de polices externe n’est embarqué : la pile de polices système est utilisée.

## Outils de développement

`playwright-core` (Apache-2.0) est une dépendance de test uniquement, jamais chargée par l’application. Les serveurs locaux utilisent la bibliothèque standard Python ou PowerShell.
