# 🧪 Guide de Test - Dashboard Amélioré

## 🎯 Objectif
Vérifier que toutes les nouvelles fonctionnalités pour les utilisateurs STAFF fonctionnent correctement.

## 🚀 Démarrage
```bash
npm run dev
```
L'application sera disponible sur : http://localhost:3003

## 📋 Tests à Effectuer

### 1. **Test de Connexion STAFF**
- [ ] Se connecter avec un compte ayant le rôle `STAFF`
- [ ] Vérifier l'accès au dashboard principal (`/`)
- [ ] Confirmer que la navbar s'affiche correctement

### 2. **Test des Statistiques Personnelles**
- [ ] Vérifier l'affichage des 3 cartes en haut :
  - [ ] **Mon Grade** : Affiche le grade de l'utilisateur
  - [ ] **Projets Actifs** : Nombre de projets assignés
  - [ ] **Coût Proforma** : Coût annuel formaté en USD
- [ ] Vérifier que les cartes ont les bonnes couleurs et animations

### 3. **Test du Composant PersonalStats**
- [ ] Vérifier l'affichage des 6 métriques :
  - [ ] **Heures ce semestre** : Total des heures du semestre actuel
  - [ ] **Entrées créées** : Nombre d'entrées de temps
  - [ ] **Coût généré** : Calcul basé sur les heures × coût horaire
  - [ ] **Objectif atteint** : Pourcentage sur 480h/semestre
  - [ ] **Moyenne/entrée** : Heures moyennes par entrée
  - [ ] **Projet principal** : Projet avec le plus d'heures
- [ ] Vérifier les couleurs dynamiques selon les seuils
- [ ] Tester les effets hover sur les cartes

### 4. **Test de la Feuille de Temps Personnelle**
- [ ] Vérifier l'affichage du composant PersonalTimeSheet
- [ ] Tester les filtres année/semestre :
  - [ ] Changer l'année → données mises à jour
  - [ ] Changer le semestre → données mises à jour
- [ ] Vérifier le résumé (3 cartes) :
  - [ ] **Total Heures** : Somme correcte
  - [ ] **Projets** : Nombre de projets uniques
  - [ ] **Coût Total** : Calcul correct
- [ ] Tester l'export PDF :
  - [ ] Cliquer sur "Exporter PDF"
  - [ ] Vérifier que le PDF se télécharge
  - [ ] Ouvrir le PDF et vérifier le contenu
- [ ] Vérifier le tableau détaillé :
  - [ ] Groupement par projet/activité
  - [ ] Calculs des coûts corrects
  - [ ] Formatage des montants en français

### 5. **Test du Graphique de Progression**
- [ ] Vérifier l'affichage du composant PersonalProgress
- [ ] Contrôler les 3 statistiques rapides :
  - [ ] **Total ce semestre** : Heures totales
  - [ ] **Moyenne/mois** : Calcul correct
  - [ ] **Tendance** : Différence avec le mois précédent
- [ ] Vérifier le graphique en barres :
  - [ ] 6 mois affichés
  - [ ] Barres proportionnelles aux heures
  - [ ] Effets hover fonctionnels
- [ ] Contrôler les recommandations :
  - [ ] Messages adaptatifs selon la performance
  - [ ] Objectifs et conseils pertinents

### 6. **Test du Modal d'Ajout d'Entrée**
- [ ] Cliquer sur "Ajouter une entrée"
- [ ] Vérifier l'ouverture du modal complet
- [ ] Tester tous les champs :
  - [ ] **Projet** : Liste des projets assignés
  - [ ] **Activité principale** : Sélection d'activité parente
  - [ ] **Sous-activité** : Apparition après sélection parente
  - [ ] **Heures** : Validation des heures restantes
  - [ ] **Semestre/Année** : Valeurs par défaut correctes
  - [ ] **Commentaire** : Champ optionnel
- [ ] Tester la soumission :
  - [ ] Créer une entrée valide
  - [ ] Vérifier la fermeture du modal
  - [ ] Confirmer la mise à jour des données
- [ ] Tester l'annulation :
  - [ ] Fermer sans sauvegarder
  - [ ] Vérifier la réinitialisation du formulaire

### 7. **Test des Composants Existants**
- [ ] **Projets Assignés** : Toujours visible et fonctionnel
- [ ] **Heures Travaillées** : Calculs et barre de progression corrects
- [ ] **Entrées Récentes** : Liste des dernières entrées

### 8. **Test de Responsivité**
- [ ] **Desktop** : Grille 3 colonnes pour les stats
- [ ] **Tablet** : Grille 2 colonnes
- [ ] **Mobile** : Grille 1 colonne
- [ ] Vérifier que tous les composants s'adaptent

### 9. **Test de Performance**
- [ ] Temps de chargement initial < 3 secondes
- [ ] Transitions fluides entre les vues
- [ ] Pas de lag lors des interactions
- [ ] Mémoire stable (pas de fuites)

### 10. **Test de Comparaison ADMIN vs STAFF**
- [ ] Se connecter avec un compte ADMIN
- [ ] Vérifier que les composants ADMIN sont visibles :
  - [ ] ProjectsStats (statistiques globales)
  - [ ] TimeSheet (feuille de temps globale)
- [ ] Se reconnecter avec STAFF
- [ ] Confirmer que seuls les composants STAFF sont visibles

## 🐛 Problèmes Potentiels à Surveiller

### Erreurs Communes
- [ ] **Icônes manquantes** : Vérifier que toutes les icônes Heroicons existent
- [ ] **Calculs incorrects** : Contrôler les formules de coût et pourcentages
- [ ] **Données vides** : Tester avec un utilisateur sans entrées de temps
- [ ] **Filtres** : Vérifier que les changements de période fonctionnent
- [ ] **Export PDF** : S'assurer que jsPDF génère correctement les fichiers

### Points d'Attention
- [ ] **Permissions** : STAFF ne doit pas voir les données des autres
- [ ] **Sécurité** : Validation côté serveur des données
- [ ] **UX** : Messages d'erreur clairs et informatifs
- [ ] **Performance** : Pas de requêtes inutiles à l'API

## ✅ Critères de Validation

### Fonctionnel
- [ ] Toutes les fonctionnalités STAFF sont opérationnelles
- [ ] Les calculs sont précis et cohérents
- [ ] L'export PDF fonctionne sans erreur
- [ ] Le modal d'ajout d'entrée est complet

### Visuel
- [ ] Design cohérent avec le style existant
- [ ] Animations fluides et agréables
- [ ] Responsive design fonctionnel
- [ ] Couleurs et contrastes appropriés

### Technique
- [ ] Pas d'erreurs dans la console
- [ ] Performance acceptable
- [ ] Code propre et maintenable
- [ ] Gestion d'erreur robuste

## 📊 Métriques de Succès

- **Temps de chargement** : < 3 secondes
- **Taux d'erreur** : 0%
- **Couverture fonctionnelle** : 100% des nouvelles features
- **Satisfaction utilisateur** : Interface intuitive et complète

## 🎉 Validation Finale

Une fois tous les tests passés :
- [ ] L'expérience STAFF est complète et enrichie
- [ ] Les utilisateurs ont accès à leurs données personnelles
- [ ] Les outils d'analyse et de suivi sont fonctionnels
- [ ] L'interface est professionnelle et moderne

---

**Note** : Ce guide doit être suivi dans l'ordre pour une validation complète du dashboard amélioré.
