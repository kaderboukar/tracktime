# 📊 Export Excel - Statistiques par Projet

## ✅ **Fonctionnalité Ajoutée**

Un bouton "Exporter" a été ajouté au tableau des statistiques par projet sur la page d'accueil pour permettre l'export des données en format Excel.

## 🎨 **Interface Utilisateur**

### **Bouton d'Export**
```typescript
// Bouton ajouté à côté des filtres
<button
  onClick={exportToExcel}
  disabled={filteredProjectStats.length === 0}
  className="flex items-center px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg"
>
  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
  Exporter
</button>
```

### **Position du Bouton**
```
┌─ Statistiques par projet ──────────────────────────────────┐
│ 📊 Statistiques par projet    [Filtres] [📥 Exporter]     │
├─────────────────────────────────────────────────────────────┤
│ Projet          │ Heures │ % │ Coût Proforma │ Coût Calculé │
│ Dev Durable     │ 100h   │21%│ 135,000 USD   │ 14,063 USD   │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 **Fonctionnalité d'Export**

### **Fonction exportToExcel**
```typescript
const exportToExcel = async () => {
  try {
    // 1. Import dynamique de XLSX
    const XLSX = await import('xlsx');
    
    // 2. Préparer les données
    const exportData = filteredProjectStats.map((stat, index) => ({
      'N°': index + 1,
      'Projet': stat.projectName,
      'Numéro': stat.projectNumber,
      'Année': stat.year,
      'Semestre': stat.semester,
      'Heures': stat.totalHours,
      '% du Semestre': Math.round(stat.totalPercentage * 100) / 100,
      'Entrées': stat.entriesCount,
      'Utilisateurs': stat.usersCount,
      'Activités': stat.activitiesCount,
      'Coût Proforma Utilisateurs (USD)': Math.round(stat.totalProformaCost),
      'Coût Calculé Projet (USD)': Math.round(stat.totalCost)
    }));

    // 3. Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // 4. Ajuster les colonnes
    ws['!cols'] = colWidths;

    // 5. Télécharger le fichier
    const fileName = `Statistiques_Projets_${filter.year}_${filter.semester}_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    alert('Erreur lors de l\'export Excel');
  }
};
```

## 📋 **Structure du Fichier Excel**

### **Colonnes Exportées**
| Colonne | Description | Exemple |
|---------|-------------|---------|
| N° | Numéro de ligne | 1, 2, 3... |
| Projet | Nom du projet | "Développement Durable" |
| Numéro | Numéro du projet | "PROJ-001" |
| Année | Année de la période | 2025 |
| Semestre | Semestre (S1/S2) | "S1" |
| Heures | Total des heures | 100 |
| % du Semestre | Pourcentage du semestre | 21.25 |
| Entrées | Nombre d'entrées | 15 |
| Utilisateurs | Nombre d'utilisateurs | 3 |
| Activités | Nombre d'activités | 5 |
| Coût Proforma Utilisateurs (USD) | Somme des coûts proforma | 135000 |
| Coût Calculé Projet (USD) | Coût calculé selon la formule | 14063 |

### **Exemple de Fichier Excel**
```
| N° | Projet              | Numéro   | Année | Semestre | Heures | % du Semestre | Entrées | Utilisateurs | Activités | Coût Proforma (USD) | Coût Calculé (USD) |
|----|---------------------|----------|-------|----------|--------|---------------|---------|--------------|-----------|---------------------|-------------------|
| 1  | Développement Durable| PROJ-001 | 2025  | S1       | 100    | 21.25         | 15      | 3            | 5         | 135000              | 14063             |
| 2  | Initiative Climat   | PROJ-002 | 2025  | S1       | 75     | 15.63         | 12      | 2            | 4         | 90000               | 7031              |
| 3  | Support Technique   | PROJ-003 | 2025  | S1       | 50     | 10.42         | 8       | 2            | 3         | 60000               | 4688              |
```

## 🎯 **Fonctionnalités Avancées**

### **Nom de Fichier Dynamique**
```typescript
// Format: Statistiques_Projets_ANNÉE_SEMESTRE_DATE.xlsx
const fileName = `Statistiques_Projets_${filter.year}_${filter.semester}_${new Date().toISOString().split('T')[0]}.xlsx`;

// Exemples:
// Statistiques_Projets_2025_S1_2025-01-15.xlsx
// Statistiques_Projets_2024_S2_2025-01-15.xlsx
```

### **Largeurs de Colonnes Optimisées**
```typescript
const colWidths = [
  { wch: 5 },   // N° - Petite colonne
  { wch: 25 },  // Projet - Large pour les noms longs
  { wch: 12 },  // Numéro - Taille moyenne
  { wch: 8 },   // Année - Petite
  { wch: 10 },  // Semestre - Petite
  { wch: 8 },   // Heures - Petite
  { wch: 12 },  // % du Semestre - Moyenne
  { wch: 8 },   // Entrées - Petite
  { wch: 12 },  // Utilisateurs - Moyenne
  { wch: 10 },  // Activités - Petite
  { wch: 20 },  // Coût Proforma - Large pour les montants
  { wch: 18 }   // Coût Calculé - Large pour les montants
];
```

### **Formatage des Données**
```typescript
// Arrondissement des pourcentages
'% du Semestre': Math.round(stat.totalPercentage * 100) / 100

// Arrondissement des coûts
'Coût Proforma Utilisateurs (USD)': Math.round(stat.totalProformaCost)
'Coût Calculé Projet (USD)': Math.round(stat.totalCost)
```

## 🔍 **Filtrage et Export**

### **Export Basé sur les Filtres**
```typescript
// L'export utilise les données filtrées actuellement affichées
const exportData = filteredProjectStats.map((stat, index) => ({...}));

// Si l'utilisateur filtre par:
// - Année: 2025
// - Semestre: S1
// → Seuls les projets de 2025-S1 sont exportés
```

### **État du Bouton**
```typescript
// Bouton désactivé si aucune donnée
disabled={filteredProjectStats.length === 0}

// États possibles:
// ✅ Actif: Données disponibles pour la période sélectionnée
// ❌ Désactivé: Aucune donnée pour la période sélectionnée
```

## 🛡️ **Gestion des Erreurs**

### **Try-Catch Robuste**
```typescript
try {
  // Logique d'export
  XLSX.writeFile(wb, fileName);
} catch (error) {
  console.error('Erreur lors de l\'export Excel:', error);
  alert('Erreur lors de l\'export Excel');
}
```

### **Cas d'Erreur Possibles**
1. **Import XLSX échoue** : Problème de réseau ou de module
2. **Données invalides** : Structure de données corrompue
3. **Écriture fichier échoue** : Permissions ou espace disque
4. **Navigateur incompatible** : Fonctionnalités non supportées

## 🧪 **Tests de Validation**

### **Test d'Export**
1. **Aller sur** : http://localhost:3001
2. **Se connecter** : `admin@undp.org` / `Admin@123`
3. **Vérifier** : Section "Statistiques par projet"
4. **Sélectionner** : Année et semestre avec des données
5. **Cliquer** : Bouton "Exporter" (vert)
6. **Vérifier** : Fichier Excel téléchargé

### **Test de Filtrage**
1. **Changer** les filtres (année/semestre)
2. **Observer** : Tableau mis à jour
3. **Cliquer** : "Exporter"
4. **Vérifier** : Fichier contient seulement les données filtrées

### **Test d'État Désactivé**
1. **Sélectionner** : Période sans données
2. **Observer** : Bouton "Exporter" grisé
3. **Vérifier** : Impossible de cliquer

## 🎨 **Design et UX**

### **Style du Bouton**
```css
/* Bouton vert avec effet hover */
bg-gradient-to-r from-green-600 to-emerald-600
hover:from-green-700 hover:to-emerald-700

/* Animation et ombres */
transition-all duration-200 shadow-md hover:shadow-lg
transform hover:-translate-y-0.5

/* État désactivé */
disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
```

### **Icône et Texte**
```typescript
<ArrowDownTrayIcon className="w-4 h-4 mr-2" />
Exporter
```

### **Tooltip**
```typescript
title="Exporter les statistiques en Excel"
```

## 🎯 **Avantages de la Fonctionnalité**

### **Facilité d'Utilisation**
- ✅ **Un clic** : Export immédiat des données affichées
- ✅ **Filtrage intégré** : Export seulement des données pertinentes
- ✅ **Nom automatique** : Fichier nommé selon la période

### **Format Professionnel**
- ✅ **Colonnes optimisées** : Largeurs adaptées au contenu
- ✅ **Données formatées** : Nombres arrondis et lisibles
- ✅ **Structure claire** : En-têtes explicites

### **Intégration Parfaite**
- ✅ **Design cohérent** : Style uniforme avec l'application
- ✅ **Performance** : Import dynamique de XLSX
- ✅ **Responsive** : Fonctionne sur tous les écrans

## 🚀 **Application Disponible**

### **URL de Test**
- **Dashboard** : http://localhost:3001

### **Fonctionnalités Finales**
- ✅ **Bouton Export** : Visible dans les statistiques par projet
- ✅ **Export Excel** : Fichier .xlsx avec toutes les données
- ✅ **Filtrage intégré** : Export basé sur les filtres actifs
- ✅ **Design professionnel** : Interface cohérente et intuitive

---

## 🎉 **Export Excel des Statistiques Complété !**

Le tableau des statistiques par projet dispose maintenant d'une **fonctionnalité d'export Excel complète** avec :
- **Bouton d'export intégré** à côté des filtres
- **Export intelligent** basé sur les données filtrées
- **Format Excel professionnel** avec colonnes optimisées
- **Gestion d'erreurs robuste** et interface intuitive ! ✨
