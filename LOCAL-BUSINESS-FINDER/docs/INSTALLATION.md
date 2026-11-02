# Installation et lancement

## Windows : méthode la plus simple

1. Enregistrez le dossier ou l’archive sur votre ordinateur.
2. Faites un clic droit sur l’archive → **Extraire tout**.
3. Ouvrez le dossier extrait `LOCAL-BUSINESS-FINDER`.
4. Double-cliquez sur **start.bat**.
5. Votre navigateur s’ouvre sur `http://localhost:8765` (ou un port proche avec le serveur PowerShell).
6. Laissez la fenêtre noire du serveur ouverte. Fermez-la ou utilisez `Ctrl+C` pour arrêter.

Aucun compte, aucune clé API, aucune carte bancaire et aucun `npm install` ne sont nécessaires. Ne déplacez pas `start.bat` seul : il doit rester avec `server.py`, `start.ps1`, `index.html` et les autres dossiers.

### Serveur automatique

- Si Python 3 est disponible, `server.py` sert les fichiers sur le port 8765.
- Sinon, `start.bat` lance `start.ps1` avec PowerShell. Une permission d’exécution est accordée **uniquement à ce processus**, sans modifier durablement la politique de sécurité Windows.
- Le serveur PowerShell essaie les ports 8765 à 8785 si le premier est occupé.
- Les deux serveurs lisent uniquement les fichiers de l’application. Ils ne collectent pas les favoris et n’envoient pas les photos personnelles.
- Utilisez toujours le **même port** : les données du navigateur sont séparées par origine. `localhost:8765` et `localhost:8766` ont deux carnets distincts.

Votre organisation peut interdire les scripts PowerShell. Dans ce cas, ne contournez pas sa politique : demandez à votre administrateur d’autoriser le lanceur ou utilisez Python 3 avec la commande ci-dessous. Le serveur PowerShell n’a pas été exécuté sur une machine Windows pendant la vérification ; voir le rapport de tests.

## Linux, macOS ou lancement manuel

Python 3.9 ou ultérieur :

```bash
cd LOCAL-BUSINESS-FINDER
python3 server.py
```

Si `python3` n’est pas reconnu sous Windows, essayez `py -3 server.py`. Pour ne pas ouvrir automatiquement le navigateur, ajoutez `--no-browser`. Pour choisir un port libre :

```bash
python3 server.py --port 8766
```

Node.js n’est pas nécessaire au fonctionnement. Ouvrir directement `index.html` en `file://` n’est pas pris en charge : les modules JavaScript ont besoin du petit serveur HTTP.

## Navigateurs

Version récente de Chrome, Edge, Firefox ou Safari avec JavaScript, IndexedDB et modules ES activés. Leaflet et le regroupement de marqueurs sont embarqués. La coquille hors connexion utilise un service worker, disponible sur `localhost` ou HTTPS. Si le navigateur le refuse, le serveur local permet toujours de consulter les données enregistrées tant qu’il fonctionne.

## Premier lancement hors connexion

Chargez l’application une première fois avec Internet et attendez quelques secondes. Le service worker conserve alors les fichiers du logiciel, **pas les tuiles cartographiques ni les réponses API**. Vous pouvez ensuite rouvrir l’application hors connexion ; consultez les favoris et les fiches récentes. Le serveur local doit être démarré, sauf si le navigateur sert déjà la coquille depuis son cache.

## Dépannage

| Problème | Solution |
|---|---|
| La fenêtre noire se ferme | Ouvrez un terminal dans le dossier et exécutez `py -3 server.py` pour lire l’erreur. Vérifiez que tous les fichiers sont extraits. |
| Port 8765 occupé sous Python | Fermez l’autre instance ou lancez `py -3 server.py --port 8766`. Conservez ensuite ce port pour retrouver vos données. |
| Le navigateur ne s’ouvre pas | Ouvrez manuellement l’adresse affichée dans la fenêtre du serveur. |
| « Connexion impossible » | Vérifiez Internet, le pare-feu et les extensions qui bloquent les requêtes. Réessayez plus tard. |
| Erreur 429 | Attendez. L’application ne relance pas automatiquement la requête. Ne multipliez pas les recherches. |
| Aucun résultat | Vérifiez le pays et la ville, essayez une autre catégorie ou un nom seul. La couverture OSM varie. |
| Fond de carte gris | Les tuiles sont indisponibles ou bloquées. Les fiches, coordonnées et exports restent utilisables. |
| Favoris disparus | Vérifiez le navigateur, le profil, le port et le mode privé. Exportez régulièrement vos favoris. |
| Stockage indisponible | Quittez le mode privé ou autorisez le stockage du site. Un bandeau signale le fonctionnement temporaire en mémoire. |
| Recherche lente | Les services publics peuvent prendre jusqu’à 35 secondes. Préférez une ville à une région entière ; aucune interrogation massive n’est effectuée. |

## Mise à jour et désinstallation

Exportez vos favoris, puis remplacez les fichiers du logiciel par la nouvelle version. Ne supprimez pas les données du navigateur si vous souhaitez les conserver. Pour désinstaller, arrêtez le serveur, utilisez **Paramètres → Supprimer toutes mes données**, puis supprimez le dossier. Aucun service système ni tâche planifiée n’est installé.
