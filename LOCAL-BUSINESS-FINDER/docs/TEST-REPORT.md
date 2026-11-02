# Rapport de vérification — 2 novembre 2026

## Périmètre réellement exécuté

Version 1.0.0, testée sous Linux avec Node.js 22.22.3, Python 3.11.2 et Chromium 133 piloté par Playwright. Le serveur Python local a été lancé et les parcours ont été exécutés dans un vrai navigateur, pas seulement par analyse statique.

**Important : les réponses Nominatim, Overpass, Commons et les tuiles OSM ont été interceptées pendant les tests.** Aucun appel de recherche réel n’a été effectué depuis cet environnement, dont l’accès réseau sortant est limité. Les fixtures de test sont explicitement fictives et confinées au dossier `tests/` ; elles ne sont jamais chargées par l’application. `data/sample-companies.json` reste vide.

## Résultats

| Vérification | Résultat |
|---|---|
| `npm test` | **18 tests réussis, 0 échec** |
| `npm run check` | Tous les modules JavaScript analysés sans erreur de syntaxe |
| `node --check sw.js` | Réussi |
| `python3 -m py_compile server.py` | Réussi |
| `node tests/browser.mjs` | Parcours navigateur réussi, **0 erreur JavaScript non capturée** |
| Démarrage initial | Interface prête, IndexedDB disponible, compteurs à zéro |
| Recherche combinée | Validation, adaptateurs Nominatim/Overpass, résultats, cartes et marqueurs |
| Recherche par nom seul | Adaptateur Nominatim et filtrage des lieux non commerciaux |
| Résultat vide | Message explicite, aucun établissement inventé |
| Erreur HTTP 429 | Message de quota, aucune relance automatique |
| Réponse malformée | Erreur explicite, pas de résultats de substitution |
| Liste | Pagination, tri alphabétique, filtre avec contact, filtre texte |
| Carte | Marqueurs/clusters, centrage, popup et synchronisation depuis la liste |
| Fiche | Contacts, source, GPS et échappement des contenus hostiles |
| Sécurité | Nom contenant du HTML affiché comme texte ; URL `javascript:` rejetée ; aucun événement injecté exécuté |
| Exports | Téléchargements CSV et JSON réellement lus et vérifiés |
| Favoris | Enregistrement, compteur, retrait/suppression et persistance après rechargement |
| Photos | Import PNG réel, décodage, stockage Blob, libellé « Saisie manuelle », relecture après rechargement |
| Historique | Recherche conservée, relance depuis le cache sans nouvel appel réseau |
| Paramètres | Purge du cache sans perte des favoris ; suppression globale après confirmation |
| Impression | Dialogue déclenché, PDF A4 de 2 pages généré par Chromium ; texte extrait vérifié : fiche et traçabilité présentes, navigation absente (`/tmp/lbf-print-test.pdf`, hors livraison) |
| Responsive | Navigation mobile à 390 × 844, menu fonctionnel, aucun débordement horizontal mesuré |
| Hors connexion | Rechargement via service worker, favoris et photo personnelle consultables réseau coupé |
| Bureau | Captures à 1440 × 1050 inspectées visuellement |

Les tests navigateur interceptent les services publics pour être reproductibles et ne pas consommer leurs quotas. Ils ne prouvent ni leur disponibilité actuelle, ni la couverture OSM d’une ville, ni la qualité commerciale des données.

## Couverture unitaire

Validation et normalisation des critères ; coordonnées invalides ; échappement HTML ; protocoles URL ; champs manquants ; précision des centres OSM ; attribution Nominatim distincte d’Overpass ; échappement des noms dans Overpass ; rayon limité autour d’un point ; déduplication ; tri/filtre sans mutation ; distance ; neutralisation des formules CSV ; sérialisation HTTP ; quota sans retry ; cache et orchestration des providers.

## Corrections effectuées pendant la vérification

- Nettoyage correct de la file d’attente HTTP après chaque requête.
- Attribution et précision spécifiques aux résultats Nominatim.
- Préservation des marqueurs pendant les mises à jour d’état sans changement de résultats.
- Protection contre les réponses photo asynchrones qui pouvaient écraser un import plus récent.
- Validation de la catégorie restaurée depuis l’historique.
- Effacement des résultats lors d’une nouvelle recherche en erreur pour ne pas présenter d’anciens résultats comme nouveaux.
- Test de requête géographique corrigé après détection d’une fixture utilisant `lon` au lieu de `lng`.

## Non vérifié / limites explicites

1. **Windows natif** : `start.bat` et le fallback `start.ps1` ont été relus, mais aucune machine Windows ni PowerShell n’était disponible. Ne pas assimiler cette revue à un test d’exécution Windows.
2. **Services publics en direct** : endpoints et formats sont implémentés selon leurs interfaces documentées ; pas de validation live dans cet environnement. Tester quelques recherches manuelles avant usage régulier.
3. **Autres navigateurs** : Firefox, Safari et Edge n’ont pas été exécutés. Chromium seul est couvert.
4. **Données réelles** : aucune garantie d’exhaustivité, d’exactitude sur place, de licence de photo vérifiée indépendamment ou de disponibilité durable des providers.
5. **Charge et sécurité** : pas de test de montée en charge, d’audit de sécurité indépendant ni de déploiement public. Le serveur est destiné à un usage local individuel.
6. **PowerShell et port variable** : le fallback peut changer de port ; le stockage du navigateur étant propre à l’origine, utiliser un port stable est recommandé.

## Reproduire

```bash
# Terminal 1 : serveur local
python3 server.py --port 8765 --no-browser

# Terminal 2 : tests sans dépendance au navigateur
npm test
npm run check

# Tests navigateur (dépendances de développement uniquement)
npm ci
npx playwright-core install chromium
# Linux : installer les bibliothèques système du navigateur si nécessaire.
npm run test:browser

# Si Chromium est déjà installé :
CHROMIUM_PATH=/chemin/vers/chromium TEST_URL=http://127.0.0.1:8765 npm run test:browser
```

Le test navigateur crée un contexte temporaire isolé et n’efface pas les données de votre navigateur personnel. Il génère un PDF temporaire pour vérifier l’impression. Les appels externes sont tous interceptés.
