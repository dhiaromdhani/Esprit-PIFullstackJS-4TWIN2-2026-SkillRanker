# Correctifs appliqués

## Design
- Design system global amélioré dans `src/styles/design-system.css`.
- Sidebar, header, cards, tableaux, boutons, formulaires, modals et mode responsive harmonisés.
- Correction du mode clair/sombre: `ThemeService` utilise maintenant `theme-light` / `theme-dark` sans supprimer les autres classes du body.
- Sidebar employé (`navemp`) refaite avec le même style professionnel que la sidebar RH.
- Suppression de l'affichage du mot `Navigation` dans les sidebars.

## Traduction
- Correction des fichiers JSON invalides `en.json`, `fr.json`, `ar.json`.
- Ajout des fichiers i18n aussi dans `public/assets/i18n` pour que `./assets/i18n/*.json` se charge correctement avec Angular.
- Ajout d'un bouton langue global visible sur toutes les pages.
- Ajout d'un traducteur DOM dans `LanguageService` pour traduire aussi les textes encore hardcodés dans les templates.
- Support RTL automatique pour l'arabe.

## Routes
- Ajout de la route `/login`.
- Ajout de la route `/history` utilisée par la sidebar.
