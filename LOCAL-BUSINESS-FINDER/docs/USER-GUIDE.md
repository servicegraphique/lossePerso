# Guide utilisateur

## 1. Trouver une entreprise

Dans **Rechercher**, combinez les champs utiles :

- **Nom seul** : recherche mondiale dans Nominatim. Les lieux administratifs qui ne sont pas des établissements sont écartés.
- **Ville ou code postal** : recherche des établissements référencés dans la zone trouvée.
- **Activité + localisation** : boulangerie, restaurant, pharmacie, hôtel, banque, bureau, commerce ou santé.
- **Nom + localisation** : recherche du nom dans les établissements de cette zone.
- **Adresse** : point de référence pour une recherche de proximité. Ce point n’est jamais présenté comme l’adresse d’une entreprise trouvée.
- **Pays** : réduit l’ambiguïté ; ne suffit pas comme critère unique.

Cliquez sur **Rechercher**. Il n’y a pas de recherche à chaque frappe. Vous pouvez annuler. **Réinitialiser** vide les critères, pas vos favoris. Les exemples du tableau de bord lancent de vraies recherches, pas des listes de démonstration.

La recherche géographique est limitée à 100 établissements. Si le point géocodé n’est pas une surface administrative, elle couvre un rayon de 5 km, signalé à l’écran. Les résultats ne constituent jamais un recensement exhaustif.

## 2. Lire les résultats

Chaque carte affiche le nom, l’activité, l’adresse disponible et la source. Une distance est une **distance à vol d’oiseau depuis le point de référence de la recherche**, pas un itinéraire ni une distance routière.

Vous pouvez filtrer les résultats chargés par texte, présence d’un contact ou présence d’une adresse, puis les trier par pertinence, nom, ville ou distance. La pagination change la liste ; la carte conserve l’ensemble des résultats filtrés. Les exports portent sur tous les résultats filtrés, pas seulement la page affichée.

Un champ absent signifie **non disponible dans la source**, pas « l’entreprise n’a pas de téléphone » ou « elle est fermée ».

## 3. Explorer la carte

- Cliquez sur **Voir sur la carte** pour centrer une entreprise et ouvrir son aperçu.
- Cliquez sur un marqueur pour sélectionner la fiche.
- Les groupes bleus regroupent les marqueurs proches ; cliquez pour les séparer.
- Le bouton de ciblage recentre tous les résultats.
- Le bouton souris active/désactive le zoom à la molette. Les boutons `+` et `−` restent disponibles.
- **Carte interactive** agrandit la carte. **Agrandir** depuis la recherche fait de même.

Sans Internet, le fond cartographique peut être absent. Les coordonnées GPS des fiches enregistrées restent lisibles.

## 4. Consulter et enregistrer une fiche

**Voir la fiche** ouvre le panneau détaillé : adresse, activité, téléphone, site, horaires, GPS, précision, source et date de récupération. Les données sont déclaratives et n’ont pas été vérifiées sur place par l’application.

Le bouton marque-page ou **Enregistrer la fiche** ajoute l’entreprise aux favoris. Cliquez à nouveau pour la retirer. Les favoris et les 20 dernières fiches consultées restent disponibles hors connexion.

**Ouvrir dans OpenStreetMap** permet de consulter la fiche source et, si vous avez un compte OSM, de corriger une information à la source. L’application ne modifie pas OSM.

## 5. Comprendre les photographies

Une photo n’est affichée que si la fiche OSM contient un lien image explicite ou une référence Wikimedia Commons. L’auteur, la licence et la source sont affichés lorsqu’ils sont disponibles. Une image liée n’est pas une certification indépendante de l’identité de l’établissement : vérifiez la source avant réutilisation.

L’application ne choisit pas une photo simplement parce qu’elle est proche géographiquement ou porte un nom similaire. Sans image fiable, elle affiche **Aucune photographie disponible**.

**Importer ma photo** accepte JPEG, PNG ou WebP, jusqu’à 5 Mo par fichier et 5 photos par fiche. Importez uniquement une image dont vous avez les droits. Elle reste sur votre ordinateur, porte la mention **Saisie manuelle** et peut être supprimée avec la corbeille. Les photos personnelles ne sont pas incluses dans les exports JSON/CSV.

## 6. Imprimer et exporter

- **CSV** : fichier UTF-8 avec BOM, séparateur point-virgule, adapté à Excel/LibreOffice. Les cellules susceptibles d’être interprétées comme des formules sont neutralisées.
- **JSON** : données structurées avec provenance, précision et date de récupération.
- **Exporter les favoris** : export JSON du carnet filtré.
- **Imprimer** dans une fiche : mise en page dédiée, sans barre de navigation. Choisissez « Enregistrer au PDF » dans le dialogue d’impression pour obtenir un PDF.

Respectez la licence ODbL et les obligations applicables lors d’une redistribution des données. Une photo garde sa propre licence.

## 7. Historique et confidentialité

L’historique conserve les 50 dernières recherches réussies, y compris celles sans résultat. Une recherche peut être relancée ou supprimée individuellement. Une relance peut utiliser le cache de moins de 24 h.

**Paramètres → Vider le cache** force de futures recherches à interroger à nouveau les services, sans supprimer les favoris. **Supprimer toutes mes données** efface favoris, historique, fiches récentes, photos et cache après confirmation.

Les recherches sont nécessairement envoyées à Nominatim/Overpass ; les photos liées le sont à leur fournisseur. Les données personnelles enregistrées ne quittent pas le navigateur. Il n’y a ni compte ni synchronisation cloud. Le mode privé, l’effacement des données du navigateur ou un changement de port peut faire disparaître le carnet : exportez-le régulièrement.
