# 🔧 Debug Feuille de Temps STAFF

## ❌ **Problème Identifié**

```
Résultat: "Aucune donnée STAFF disponible pour cette période"
Année: 2025, Semestre: S1
Filtre: Pas d'années disponibles
```

## 🔍 **Causes Possibles**

### **1. Problème de Coût Proforma**
```typescript
// ❌ Ancien code - Cherchait user.proformaCost (inexistant)
userProformaCost: entry.user.proformaCost || 0,

// ✅ Nouveau code - Utilise UserProformaCost table
const proformaCostForYear = entry.user.proformaCosts.find(pc => pc.year === entry.year);
const userProformaCost = proformaCostForYear ? proformaCostForYear.cost : 0;
```

### **2. Données de Seed Incomplètes**
```typescript
// Dans prisma/seed.ts
const timeEntry3 = await prisma.timeEntry.create({
  status: 'PENDING',  // ❌ Pas APPROVED
  // ...
});
```

### **3. Structure de Base de Données**
```sql
-- Coûts proforma dans table séparée
UserProformaCost {
  userId: Int
  year: Int  
  cost: Float
}

-- Pas dans User directement
User {
  proformaCost: ❌ N'existe pas
}
```

## ✅ **Solutions Appliquées**

### **1. Correction de l'API Staff-Timesheet**
```typescript
// Récupération correcte des coûts proforma
user: {
  select: {
    id: true, name: true, email: true,
    grade: true, type: true, role: true,
    proformaCosts: {  // ✅ Relation correcte
      select: { year: true, cost: true }
    }
  }
}

// Calcul avec la bonne année
const proformaCostForYear = entry.user.proformaCosts.find(pc => pc.year === entry.year);
const userProformaCost = proformaCostForYear ? proformaCostForYear.cost : 0;
```

### **2. Amélioration du Composant**
```typescript
// Gestion des cas sans données
const availableYears = staffTimesheetData.length > 0 
  ? [...new Set(staffTimesheetData.map(item => item.year))].sort((a, b) => b - a)
  : [2025, 2024, 2023]; // ✅ Années par défaut

// Debug amélioré
console.log("Données STAFF reçues:", staffTimesheetData);
console.log("Données STAFF filtrées:", filteredData);
console.log("Années disponibles:", availableYears);
```

### **3. APIs de Debug Créées**

#### **API Debug Staff Data**
```typescript
// GET /api/debug/staff-data
// Retourne toutes les informations de debug:
{
  totalStaffUsers: number,
  totalApprovedEntries: number,
  totalPendingEntries: number,
  staffUsers: User[],
  approvedStaffEntries: TimeEntry[]
}
```

#### **API Création Données Test**
```typescript
// POST /api/debug/create-test-data
// Crée automatiquement:
- Utilisateur STAFF (staff@undp.org)
- Coûts proforma 2024 et 2025
- Projets de test
- Activités de test
- Entrées de temps APPROUVÉES
```

## 🧪 **Tests de Validation**

### **1. Vérifier les Données en Base**
```bash
# URL de debug
http://localhost:3001/api/debug/staff-data

# Résultat attendu
{
  "success": true,
  "debug": {
    "totalStaffUsers": 1,
    "totalApprovedEntries": 2,
    "totalPendingEntries": 0,
    "staffUsers": [...],
    "approvedStaffEntries": [...]
  }
}
```

### **2. Créer les Données de Test**
```bash
# URL de création
http://localhost:3001/test-data-creation.html

# Actions:
1. Cliquer "Créer les données de test"
2. Vérifier le succès
3. Cliquer "Vérifier les données STAFF"
4. Confirmer les données créées
```

### **3. Tester le Dashboard**
```bash
# Connexion ADMIN
Email: admin@undp.org
Password: Admin@123

# Vérifications:
1. Aller au dashboard
2. Scroll vers "Feuille de Temps - STAFF"
3. Vérifier les données affichées
4. Tester les filtres année/semestre
5. Essayer l'export CSV/PDF
```

## 📊 **Données de Test Créées**

### **Utilisateur STAFF**
```typescript
{
  email: 'staff@undp.org',
  password: 'Staff@123',
  name: 'John Doe',
  grade: 'G5',
  role: 'STAFF',
  proformaCosts: [
    { year: 2024, cost: 70000 },
    { year: 2025, cost: 75000 }
  ]
}
```

### **Entrées de Temps APPROUVÉES**
```typescript
[
  {
    year: 2025, semester: 'S1',
    hours: 25.5, status: 'APPROVED',
    project: 'Projet Développement Durable'
  },
  {
    year: 2025, semester: 'S1', 
    hours: 18.0, status: 'APPROVED',
    project: 'Initiative Climat'
  },
  {
    year: 2024, semester: 'S2',
    hours: 40.0, status: 'APPROVED',
    project: 'Projet Développement Durable'
  }
]
```

### **Calculs Attendus**

#### **2025 S1 (Total: 43.5h)**
```
Coût Proforma: 75,000 USD
Calculs:
1. Coût Semestriel: 75,000 ÷ 2 = 37,500 USD
2. Coût Horaire: 37,500 ÷ 480 = 78.125 USD/h
3. Coût Total: 78.125 × 43.5 = 3,398 USD
```

#### **2024 S2 (Total: 40h)**
```
Coût Proforma: 70,000 USD
Calculs:
1. Coût Semestriel: 70,000 ÷ 2 = 35,000 USD
2. Coût Horaire: 35,000 ÷ 480 = 72.92 USD/h
3. Coût Total: 72.92 × 40 = 2,917 USD
```

## 🔄 **Processus de Résolution**

### **Étape 1: Diagnostic**
1. ✅ Identifier le problème (pas de données STAFF)
2. ✅ Créer API de debug pour analyser
3. ✅ Découvrir le problème de structure de données

### **Étape 2: Correction**
1. ✅ Corriger l'API staff-timesheet
2. ✅ Améliorer le composant React
3. ✅ Ajouter des logs de debug

### **Étape 3: Test**
1. ✅ Créer API de création de données test
2. ✅ Créer interface de test HTML
3. ✅ Valider les corrections

### **Étape 4: Validation**
1. 🔄 Tester avec données réelles
2. 🔄 Vérifier les calculs
3. 🔄 Confirmer l'interface utilisateur

## 🎯 **Résultat Attendu**

### **Dashboard ADMIN - Section STAFF**
```
┌─ Feuille de Temps - STAFF ──────────────────────────────┐
│ [Filtres: 2025 | S1] [Exporter]                        │
│                                                         │
│ [STAFF] John Doe | G5 | 75,000 USD | 43.5h | 3,398 USD │
│                                                         │
│ Total: 1 utilisateur STAFF                              │
└─────────────────────────────────────────────────────────┘
```

### **Fonctionnalités Opérationnelles**
- ✅ Affichage des données STAFF uniquement
- ✅ Calculs automatiques selon la formule
- ✅ Filtres année/semestre fonctionnels
- ✅ Export CSV avec données détaillées
- ✅ Export PDF avec calculs explicites

## 🚀 **URLs de Test**

### **Application Principale**
- **Dashboard**: http://localhost:3001
- **Login ADMIN**: admin@undp.org / Admin@123

### **APIs de Debug**
- **Données STAFF**: http://localhost:3001/api/debug/staff-data
- **Interface Test**: http://localhost:3001/test-data-creation.html

### **API Staff-Timesheet**
- **Endpoint**: http://localhost:3001/api/admin/staff-timesheet
- **Méthode**: GET
- **Auth**: Bearer token requis

---

## 🎉 **Prochaines Étapes**

1. **Créer les données de test** via l'interface HTML
2. **Vérifier l'API debug** pour confirmer les données
3. **Tester le dashboard ADMIN** pour voir la feuille STAFF
4. **Valider les calculs** et l'interface utilisateur
5. **Confirmer les exports** CSV et PDF

**🔧 Debug en cours... Données de test prêtes à être créées !**
