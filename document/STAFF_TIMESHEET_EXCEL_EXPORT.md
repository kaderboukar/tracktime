# 📊 Export Excel - Feuille de Temps STAFF

## ✅ **Fonctionnalité Mise à Jour**

L'export de la feuille de temps STAFF a été **transformé** d'un export CSV vers un **export Excel** avec le format spécifique demandé : **Staff | Projet | Activité & sous-activité | Année | Semestre | Heures | Coût Proforma | Coût Calculé**.

## 🔄 **Modifications Apportées**

### **❌ Ancien Format (CSV groupé)**
```csv
Staff,Grade,Coût Proforma (USD),Total Heures,Coût Semestriel (USD),Coût Horaire (USD),Coût Calculé (USD),Année,Semestre
John Doe,G5,75000,43.5,37500,78.13,3398,2025,S1
Marie Martin,P3,60000,32,30000,62.5,2000,2025,S1
```

### **✅ Nouveau Format (Excel détaillé)**
```
| N° | Staff      | Projet              | Activité & sous-activité    | Année | Semestre | Heures | Coût Proforma | Coût Calculé |
|----|------------|---------------------|----------------------------|-------|----------|--------|---------------|--------------|
| 1  | John Doe   | Développement Durable| Recherche > Analyse        | 2025  | S1       | 8      | 75000         | 625          |
| 2  | John Doe   | Initiative Climat   | Formation > Sensibilisation | 2025  | S1       | 6      | 75000         | 469          |
| 3  | Marie Martin| Support Technique   | Support > Maintenance      | 2025  | S1       | 4      | 60000         | 250          |
```

## 🆕 **Nouvelle API Créée**

### **API `/api/admin/staff-timesheet-details`**
```typescript
// Nouvelle API pour récupérer les détails par entrée
GET /api/admin/staff-timesheet-details

// Retourne les données détaillées de chaque entrée de temps STAFF
{
  "success": true,
  "data": [
    {
      "id": 1,
      "staff": "John Doe",
      "staffGrade": "G5",
      "staffType": "INTERNATIONAL",
      "project": "Développement Durable",
      "projectNumber": "PROJ-001",
      "activity": "Recherche > Analyse",
      "year": 2025,
      "semester": "S1",
      "hours": 8,
      "userProformaCost": 75000,
      "semesterCost": 37500,
      "hourlyCost": 78.13,
      "entryCalculatedCost": 625,
      "comment": "",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### **Fonctionnalités de l'API**
- ✅ **Données détaillées** : Chaque entrée de temps individuellement
- ✅ **Activités hiérarchiques** : Parent > Enfant si applicable
- ✅ **Calculs par entrée** : Coût calculé pour chaque ligne
- ✅ **Filtrage STAFF** : Seulement les utilisateurs avec rôle STAFF
- ✅ **Statut APPROVED** : Seulement les entrées approuvées

## 🔧 **Composant StaffTimeSheet Modifié**

### **Nouveaux États**
```typescript
const [detailedData, setDetailedData] = useState<StaffTimeSheetDetail[]>([]);
const [isLoadingDetails, setIsLoadingDetails] = useState(false);
```

### **Interface des Données Détaillées**
```typescript
interface StaffTimeSheetDetail {
  id: number;
  staff: string;
  staffGrade: string;
  staffType: string;
  project: string;
  projectNumber: string;
  activity: string;
  year: number;
  semester: string;
  hours: number;
  userProformaCost: number;
  semesterCost: number;
  hourlyCost: number;
  entryCalculatedCost: number;
  comment: string;
  createdAt: string;
}
```

### **Fonction de Récupération**
```typescript
const fetchDetailedData = async () => {
  setIsLoadingDetails(true);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/staff-timesheet-details", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setDetailedData(result.data);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données détaillées:", error);
  } finally {
    setIsLoadingDetails(false);
  }
};
```

## 📊 **Nouvelle Fonction d'Export Excel**

### **Format d'Export Spécifique**
```typescript
const exportToExcel = async () => {
  // 1. Récupérer les données détaillées si nécessaire
  if (detailedData.length === 0) {
    await fetchDetailedData();
  }

  // 2. Filtrer selon la période sélectionnée
  const filteredDetailedData = detailedData.filter(
    item => item.year === selectedYear && item.semester === selectedSemester
  );

  // 3. Formater selon le format demandé
  const exportData = filteredDetailedData.map((item, index) => ({
    'N°': index + 1,
    'Staff': item.staff,
    'Projet': item.project,
    'Activité & sous-activité': item.activity,
    'Année': item.year,
    'Semestre': item.semester,
    'Heures': item.hours,
    'Coût Proforma (USD)': Math.round(item.userProformaCost),
    'Coût Calculé (USD)': Math.round(item.entryCalculatedCost)
  }));

  // 4. Créer et télécharger le fichier Excel
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, 'Feuille de temps STAFF');
  XLSX.writeFile(wb, fileName);
};
```

### **Largeurs de Colonnes Optimisées**
```typescript
const colWidths = [
  { wch: 5 },   // N°
  { wch: 20 },  // Staff
  { wch: 25 },  // Projet
  { wch: 30 },  // Activité & sous-activité (plus large)
  { wch: 8 },   // Année
  { wch: 10 },  // Semestre
  { wch: 8 },   // Heures
  { wch: 18 },  // Coût Proforma
  { wch: 15 }   // Coût Calculé
];
```

## 📋 **Structure du Fichier Excel**

### **Colonnes Exportées (9 colonnes)**
| Colonne | Description | Largeur |
|---------|-------------|---------|
| N° | Numéro de ligne | 5 |
| Staff | Nom de l'employé | 20 |
| Projet | Nom du projet | 25 |
| Activité & sous-activité | Hiérarchie complète | 30 |
| Année | Année de la période | 8 |
| Semestre | Semestre (S1/S2) | 10 |
| Heures | Heures travaillées | 8 |
| Coût Proforma (USD) | Coût proforma annuel | 18 |
| Coût Calculé (USD) | Coût calculé pour cette entrée | 15 |

### **Exemple de Fichier Excel**
```
| N° | Staff        | Projet              | Activité & sous-activité      | Année | Semestre | Heures | Coût Proforma | Coût Calculé |
|----|--------------|---------------------|------------------------------|-------|----------|--------|---------------|--------------|
| 1  | John Doe     | Développement Durable| Recherche > Analyse          | 2025  | S1       | 8      | 75000         | 625          |
| 2  | John Doe     | Développement Durable| Formation > Sensibilisation  | 2025  | S1       | 6      | 75000         | 469          |
| 3  | John Doe     | Initiative Climat   | Coordination                  | 2025  | S1       | 4      | 75000         | 313          |
| 4  | Marie Martin | Support Technique   | Support > Maintenance        | 2025  | S1       | 5      | 60000         | 313          |
| 5  | Marie Martin | Formation Staff     | Formation                     | 2025  | S1       | 3      | 60000         | 188          |
```

## 🎯 **Avantages du Nouveau Format**

### **Granularité des Données**
- ✅ **Détail par entrée** : Chaque ligne de temps visible
- ✅ **Projet spécifique** : Quel projet pour chaque activité
- ✅ **Activité complète** : Hiérarchie parent > enfant
- ✅ **Coût par entrée** : Calcul précis par ligne

### **Analyse Facilitée**
- ✅ **Suivi par projet** : Temps passé par projet et par personne
- ✅ **Analyse d'activité** : Répartition des tâches
- ✅ **Coûts détaillés** : Coût réel de chaque activité
- ✅ **Période précise** : Données filtrées par année/semestre

### **Format Professionnel**
- ✅ **Excel natif** : Plus professionnel que CSV
- ✅ **Colonnes optimisées** : Largeurs adaptées au contenu
- ✅ **Données formatées** : Montants arrondis et lisibles
- ✅ **Nom de fichier** : Format standardisé avec date

## 🧪 **Test de la Fonctionnalité**

### **Pour Tester**
1. **Aller sur** : http://localhost:3001
2. **Se connecter** : `admin@undp.org` / `Admin@123`
3. **Localiser** : Section "Feuille de temps - STAFF"
4. **Sélectionner** : Année et semestre avec des données
5. **Cliquer** : Bouton "Exporter" (vert)
6. **Vérifier** : Fichier Excel téléchargé avec format détaillé

### **Vérifications**
- ✅ **9 colonnes** : Format spécifique respecté
- ✅ **Données détaillées** : Une ligne par entrée de temps
- ✅ **Activités hiérarchiques** : Parent > Enfant si applicable
- ✅ **Calculs corrects** : Coûts par entrée calculés
- ✅ **Filtrage** : Seulement la période sélectionnée

## 🔍 **Différences Clés**

### **❌ Ancien Export (Groupé)**
```
- Données agrégées par utilisateur/période
- Total des heures par personne
- Coût total calculé par personne
- Pas de détail par projet/activité
- Format CSV simple
```

### **✅ Nouveau Export (Détaillé)**
```
- Données détaillées par entrée de temps
- Heures spécifiques par activité
- Coût calculé par entrée individuelle
- Détail complet projet/activité
- Format Excel professionnel
```

## 🎨 **Nom de Fichier Dynamique**

### **Format**
```typescript
`Feuille_temps_STAFF_${selectedYear}_${selectedSemester}_${date}.xlsx`
```

### **Exemples**
```
Feuille_temps_STAFF_2025_S1_2025-01-15.xlsx
Feuille_temps_STAFF_2024_S2_2025-01-15.xlsx
```

## 🚀 **Application Mise à Jour**

### **URL de Test**
- **Dashboard** : http://localhost:3001

### **Fonctionnalités Finales**
- ✅ **Export Excel détaillé** : Format spécifique respecté
- ✅ **API dédiée** : Données détaillées par entrée
- ✅ **Filtrage intelligent** : Période sélectionnée
- ✅ **Format professionnel** : Excel avec colonnes optimisées

---

## 🎉 **Export Excel STAFF Parfaitement Adapté !**

La feuille de temps STAFF dispose maintenant d'un **export Excel détaillé** avec :
- **Format spécifique** : Staff | Projet | Activité & sous-activité | Année | Semestre | Heures | Coût Proforma | Coût Calculé
- **Données granulaires** : Une ligne par entrée de temps
- **API dédiée** : Récupération des détails complets
- **Calculs précis** : Coût par entrée individuelle ! ✨
