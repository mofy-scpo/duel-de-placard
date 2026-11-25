# Duel de Placard

Code complet de la version 3 développée et publiée sur ChatGPT Sites, prêt à être repris dans un dépôt GitHub et déployé sur GitHub Pages.

**Commencer par `INSTRUCTIONS_CLAUDE.md`** pour le passage de relais à votre agent.

## Architecture

Application web statique en HTML, CSS et JavaScript moderne. Aucun backend, aucune compilation, aucune dépendance npm, aucun compte utilisateur dans l’application et aucune clé API. Les appels à Open Food Facts se font directement dans le navigateur.

- `dist/index.html` : page, lexique, onglets et explications des barèmes.
- `dist/style.css` : présentation responsive.
- `dist/app.mjs` : recherche, sélection, comparaison, verdict et partage.
- `dist/food-api.mjs` : client Open Food Facts, cache, quotas et reprises limitées.
- `dist/logic.mjs` : calcul du score et normalisation du radar.
- `dist/insights.mjs` : vues radar, détail du calcul et lexique.
- `dist/radar.mjs` : tracé SVG du radar.
- `dist/products.json` : instantané daté des huit produits de départ et URLs sources des images.
- `dist/assets/` : les huit photos intégrées.
- `tests/` : tests du score, du radar et du client API.
- `.github/workflows/pages.yml` : publication GitHub Pages du dossier `dist/`.

Tous les chemins internes sont relatifs. Le site est conçu pour fonctionner aussi dans un sous-dossier de projet GitHub Pages. Le partage utilise les paramètres `?p1=…&p2=…` sur l’URL courante, sans route serveur.

## Démarrer localement

Depuis la racine de ce dossier, avec Python 3 :

```sh
python3 -m http.server 8000 --directory dist
```

Ouvrir `http://localhost:8000`. Utiliser un serveur HTTP local : ouvrir seulement `index.html` avec `file://` ne suffit pas pour les modules JavaScript et les lectures JSON.

## Tester

Avec une version récente de Node.js, sans installation de dépendances :

```sh
node --check dist/app.mjs
node --check dist/food-api.mjs
node --check dist/insights.mjs
node --check dist/radar.mjs
node tests/logic.test.mjs
node tests/food-api.test.mjs
node tests/radar.test.mjs
```

Les tests simulent les réponses API. Ils vérifient le calcul, les seuils, les données manquantes, le cache persistant, les quotas, les reprises, les codes-barres et les géométries du radar. Ils ne garantissent pas la disponibilité du service externe.

## Publier sur GitHub Pages

1. Placer le contenu de ce dossier à la racine du dépôt, en conservant `.github/workflows/pages.yml` et `dist/`.
2. Utiliser une branche `main`, ou adapter `branches` dans le workflow.
3. Dans le dépôt : **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Envoyer le code sur `main`, ou lancer manuellement le workflow depuis l’onglet Actions.
5. Vérifier le résultat et ouvrir l’URL renvoyée par le déploiement.

Le workflow publie `dist/` uniquement. Il ne lance ni compilation ni Jekyll. Aucun secret personnel n’est à créer pour ce workflow ; ses permissions GitHub Actions sont déclarées dans le fichier. La possibilité d’activer Pages dépend du compte, de l’offre et des règles du dépôt.

Documentation de référence : https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Fonctionnalités incluses

Quatre duels rapides, deux recherches indépendantes par nom ou code-barres, choix de produits, comparatif de cinq critères, badges Nutri-Score et NOVA, verdict sur 100, liens partageables, inversion et duel aléatoire. Le lexique explique les termes ; les badges et critères y renvoient. Les vues éducatives proposent le radar interactif, ses valeurs numériques et le détail des points de chaque produit.

## Score et radar

Le score applique les pondérations prévues : Nutri-Score 40 points, NOVA 25, additifs 15, sucres 10, gras saturés 10. En cas de donnée absente, son poids est exclu puis le total est ramené sur 100 et arrondi. Le sel et les protéines sont comparés mais ne reçoivent aucun poids séparé. Les seuils exacts sont exposés dans le site et dans `dist/logic.mjs`.

Le radar utilise les mêmes cinq composantes, chacune divisée par son poids maximal puis multipliée par 100. La surface du radar n’est pas le score global. Les valeurs manquantes ne sont pas transformées en zéro ; leurs points et segments adjacents sont omis. Les produits peuvent être masqués séparément, et un tableau numérique est disponible.

Ce barème est propre à Duel de Placard : ce n’est pas le Nutri-Score officiel ni une note clinique validée. Certains nutriments sont déjà pris en compte dans le Nutri-Score et sont pondérés à nouveau par notre méthode.

## API et limites connues

La recherche part uniquement avec Entrée ou « Rechercher ». Les codes-barres utilisent directement la fiche produit. Les fiches fraîches sont réutilisées pendant 24 heures, les recherches pendant 1 heure ; des données conservées peuvent servir de repli pendant 30 jours. Le stockage local conserve au plus 120 produits et 40 recherches.

Les deux sélecteurs partagent un client. Les appels identiques en cours sont regroupés ; les budgets conservateurs du navigateur sont de 8 recherches et 12 lectures de fiches par minute. Un appel a un délai maximal de 8 secondes et au plus une nouvelle tentative pour une erreur temporaire. Les réponses 429 et les réponses 503 avec `Retry-After` déclenchent une pause. Une panne persistante après reprise déclenche une pause de 30 secondes.

L’application dépend encore de la disponibilité d’Open Food Facts pour les produits jamais enregistrés. Les appels venant d’autres applications sur une même IP ne sont pas connus du navigateur. Les photos externes hors des huit références intégrées nécessitent une connexion. Les polices proviennent de Google Fonts, avec une pile de polices de remplacement si ce service n’est pas accessible.

La vérification visuelle complète sur navigateur était encore à effectuer lors du passage de relais. Les tests automatiques ont été exécutés avec succès sur cette version.

## Provenance

Voir `SOURCE_VERSION.txt` et `THIRD_PARTY_NOTICES.md`. Cette archive n’inclut aucun historique Git, jeton, identifiant d’hébergement ChatGPT ou configuration spécifique à ChatGPT Sites.
