# 📊 Documentation des Calculs de Coûts Standardisés

## 🎯 **Vue d'Ensemble**

Ce document décrit la **logique métier standardisée** pour le calcul des coûts dans l'application TrackTime. Tous les calculs financiers suivent désormais la même formule pour assurer la **cohérence** et la **fiabilité** des données.

## 🧮 **Formule Standardisée**

### **Calcul du Coût Horaire**
```
Coût Horaire = (Coût Proforma Annuel / 2) / 480
```

**Où :**
- **Coût Proforma Annuel** : Salaire/coût annuel de l'utilisateur en USD
- **Division par 2** : Pour obtenir le coût semestriel
- **480** : Nombre d'heures standard par semestre (8h × 5j × 12 semaines)

### **Calcul du Coût d'une Entrée de Temps**
```
Coût Entrée = Heures Travaillées × Coût Horaire
```

### **Calcul du Coût Total d'un Projet**
```
Coût Projet = Σ(Coût de chaque entrée de temps)
```

## 📅 **Constantes de Temps**

| Constante | Valeur | Description |
|-----------|---------|-------------|
| `HOURS_PER_SEMESTER` | 480 | Heures par semestre (8h × 5j × 12 semaines) |
| `HOURS_PER_YEAR` | 960 | Heures par année (480 × 2) |
| `SEMESTERS_PER_YEAR` | 2 | Nombre de semestres par année |

## 🔧 **Fonctions Utilitaires**

### **`calculateHourlyCost(annualProformaCost: number): number`**
Calcule le coût horaire basé sur le coût proforma annuel.

**Paramètres :**
- `annualProformaCost` : Coût proforma annuel en USD

**Retour :**
- Coût horaire en USD (arrondi à 2 décimales)

**Exemple :**
```typescript
const hourlyCost = calculateHourlyCost(96000); // Retourne 100.00 USD
```

### **`calculateEntryCost(hours: number, annualProformaCost: number): number`**
Calcule le coût total d'une entrée de temps.

**Paramètres :**
- `hours` : Nombre d'heures travaillées
- `annualProformaCost` : Coût proforma annuel en USD

**Retour :**
- Coût total de l'entrée en USD (arrondi à 2 décimales)

**Exemple :**
```typescript
const entryCost = calculateEntryCost(8, 96000); // Retourne 800.00 USD
```

### **`calculateProjectTotalCost(timeEntries: TimeEntry[]): number`**
Calcule le coût total d'un projet basé sur toutes ses entrées de temps.

**Paramètres :**
- `timeEntries` : Tableau des entrées de temps du projet

**Retour :**
- Coût total du projet en USD (arrondi à 2 décimales)

## 📊 **Exemples de Calculs**

### **Exemple 1 : Utilisateur avec Coût Annuel de 96,000 USD**

**Calcul du coût horaire :**
```
Coût Horaire = (96,000 / 2) / 480
Coût Horaire = 48,000 / 480
Coût Horaire = 100 USD/heure
```

**Calcul pour 8 heures de travail :**
```
Coût Entrée = 8 × 100 = 800 USD
```

### **Exemple 2 : Projet avec Plusieurs Utilisateurs**

**Données :**
- Utilisateur A : 96,000 USD/an, 40 heures
- Utilisateur B : 72,000 USD/an, 30 heures
- Utilisateur C : 48,000 USD/an, 20 heures

**Calculs :**
```
Coût A = 40 × ((96,000 / 2) / 480) = 40 × 100 = 4,000 USD
Coût B = 30 × ((72,000 / 2) / 480) = 30 × 75 = 2,250 USD
Coût C = 20 × ((48,000 / 2) / 480) = 20 × 50 = 1,000 USD

Total Projet = 4,000 + 2,250 + 1,000 = 7,250 USD
```

## 🔄 **Mise à Jour des APIs**

### **APIs Mises à Jour :**
1. **`/api/analytics/project-statistics`** - Total Récupéré
2. **`/api/admin/project-stats`** - Statistiques par Projet
3. **`/api/admin/timesheet`** - Feuilles de Temps
4. **`/api/admin/staff-timesheet`** - Feuilles de Temps du Personnel

### **Composants Misés à Jour :**
1. **`PersonalTimeSheet`** - Feuille de Temps Personnelle
2. **`PersonalStats`** - Statistiques Personnelles

## ✅ **Validation et Tests**

### **Tests Unitaires :**
- Validation des formules de calcul
- Gestion des cas limites (coûts nuls, heures nulles)
- Cohérence des constantes de temps
- Arrondis corrects à 2 décimales

### **Tests d'Intégration :**
- Cohérence entre toutes les APIs
- Validation des calculs croisés
- Vérification des exports (PDF, Excel)

## 🚨 **Points d'Attention**

### **Avant la Mise à Jour :**
- Le "Total Récupéré" affichait des montants **2x plus élevés**
- Les comparaisons entre projets étaient **faussées**
- Les rapports financiers étaient **inexacts**

### **Après la Mise à Jour :**
- ✅ Tous les calculs sont **cohérents**
- ✅ Les montants sont **précis** et **fiables**
- ✅ Les comparaisons sont **valides**

## 📈 **Impact sur l'Organisation**

### **Bénéfices :**
1. **Fiabilité des données** financières
2. **Cohérence** entre tous les rapports
3. **Confiance** des utilisateurs dans les métriques
4. **Précision** des décisions stratégiques

### **Utilisation :**
1. **Reporting mensuel/trimestriel** pour la direction
2. **Planification budgétaire** des projets
3. **Analyse de rentabilité** par projet
4. **Allocation des ressources** basée sur la valeur générée

## 🔍 **Maintenance et Évolution**

### **Modifications Futures :**
- Toute modification de la logique de calcul doit être faite dans `src/lib/workHours.ts`
- Les tests unitaires doivent être mis à jour en conséquence
- La documentation doit être maintenue à jour

### **Monitoring :**
- Surveillance des calculs en production
- Validation des résultats avec les données réelles
- Feedback des utilisateurs sur la précision des métriques

---

**Version :** 1.0  
**Date de Création :** Janvier 2025  
**Responsable :** Équipe de Développement TrackTime  
**Statut :** ✅ Implémenté et Testé
