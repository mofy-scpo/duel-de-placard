# Passage de relais à l’agent Claude

## Objectif utilisateur

Mettre le code joint dans un dépôt GitHub et publier Duel de Placard sur GitHub Pages, en conservant les fonctionnalités et le design de cette version. Le site a été développé et testé en recette sur ChatGPT Sites ; il est autonome et entièrement statique.

## Marche à suivre

1. Lire `README.md` et conserver la structure `dist/`, `tests/` et `.github/workflows/pages.yml`.
2. Utiliser le compte et le dépôt GitHub choisis par l’utilisateur. Si cette cible n’est pas connue, demander le compte, le nom du dépôt et sa visibilité ; ne pas inventer une destination.
3. Vérifier les fichiers et exécuter les commandes de test décrites dans le README. Aucune installation npm n’est nécessaire.
4. Faire une recette navigateur sur ordinateur et sur mobile. Vérifier : recherche par Entrée et bouton, sélection d’un produit externe, code-barres, partage et réouverture du lien, inversion, égalité avec le même produit, lexique, onglets, détails du calcul et masquage des tracés du radar.
5. Créer ou utiliser le dépôt cible selon les instructions de l’utilisateur, y déposer ce dossier et conserver la branche `main` ou adapter le workflow.
6. Activer GitHub Pages avec la source **GitHub Actions**. Le workflow joint publie uniquement `dist/` et ne nécessite aucun secret personnalisé.
7. Déclencher le déploiement, examiner son résultat et tester l’URL GitHub Pages finale, notamment avec le sous-chemin du dépôt et les paramètres `p1` et `p2`.
8. Fournir à l’utilisateur les liens du dépôt et du site publié, ainsi que les éventuelles limites réellement observées.

## Points à préserver

- Zéro backend, zéro base de données serveur et zéro authentification dans l’application.
- Aucun SDK ChatGPT, aucune clé d’API, aucune dépendance à l’hébergement précédent.
- Recherche sur action explicite : ne pas réintroduire un appel API à chaque frappe.
- Appels directs à Open Food Facts, cache persistant daté et messages explicites si le service échoue.
- Distinction entre données manquantes et valeurs nulles au sens numérique : `N/A` ne doit pas devenir `0`.
- Barème original et normalisation sur les critères disponibles. Le sel et les protéines ne reçoivent pas de poids séparé.
- Radar sur cinq axes fixes de 0 à 100 ; ne pas le transformer en classement relatif aux seuls deux produits du duel.
- Attribution ODbL et CC BY-SA pour les données et les images d’Open Food Facts.

## État à la livraison

Tous les modules, les images locales, l’instantané des produits et les tests sont joints. Les tests automatiques du score, du client API et du radar passent. La recherche réelle « noisette » a déjà renvoyé six résultats au cours de la recette, mais l’API a aussi connu des erreurs 503. Cela reste un service externe : une panne ne doit pas être présentée comme corrigée définitivement par le cache.

La vérification visuelle complète du site reste à faire. Le workflow GitHub Pages est fourni pour la migration ; aucun dépôt GitHub n’a été créé et aucun déploiement GitHub Pages n’a été lancé depuis cette archive.
