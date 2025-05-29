# 📊 Fonctionnalité d'Importation Excel - Projets

## ✅ **Objectifs Accomplis**

1. **Bouton d'importation** ajouté à la page `/projects`
2. **Modal d'importation** avec sélection de fichier Excel
3. **Lecture de fichiers Excel** (.xlsx/.xls) avec la librairie `xlsx`
4. **Importation en masse** avec barre de progression
5. **Gestion des erreurs** et rapport détaillé

## 🔧 **Dépendances Installées**

### **Librairie XLSX**
```bash
npm install xlsx
```

### **Types TypeScript** (optionnel)
```bash
npm install --save-dev @types/xlsx
```

## 🎨 **Interface Utilisateur**

### **Bouton d'Importation**
```typescript
// Ajouté à côté du bouton "Nouveau Projet"
<div className="flex items-center space-x-3">
  <button onClick={() => setIsImportModalOpen(true)}>
    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
    Importer
  </button>
  <button onClick={openCreateModal}>
    <PlusIcon className="w-5 h-5 mr-2" />
    Nouveau Projet
  </button>
</div>
```

### **Modal d'Importation**
```typescript
// Modal avec sélection de fichier et progression
{isImportModalOpen && (
  <div className="modal">
    <h2>Importer des projets</h2>
    <input type="file" accept=".xlsx,.xls" />
    {importProgress && (
      <div className="progress-bar">
        <div style={{ width: `${(processed/total)*100}%` }} />
      </div>
    )}
    <button onClick={handleImportExcel}>Importer</button>
  </div>
)}
```

## 📋 **Format Excel Attendu**

### **Structure du Fichier**
```
| A        | B           | C           |
|----------|-------------|-------------|
| Nom      | Numéro      | Accès Staff |
| Projet 1 | PROJ-001    | ALL         |
| Projet 2 | PROJ-002    | OPERATION   |
| Projet 3 | PROJ-003    | PROGRAMME   |
```

### **Colonnes Requises**
- **Colonne A** : Nom du projet (obligatoire)
- **Colonne B** : Numéro du projet (obligatoire)
- **Colonne C** : Accès Staff (optionnel, défaut: "ALL")

### **Valeurs Accès Staff**
- `ALL` : Tous les utilisateurs
- `OPERATION` : Équipe opération
- `PROGRAMME` : Équipe programme
- `SUPPORT` : Équipe support

## 🔄 **Processus d'Importation**

### **Étapes du Workflow**
```
1. Utilisateur clique sur "Importer"
   ↓
2. Modal s'ouvre avec sélection de fichier
   ↓
3. Utilisateur sélectionne fichier Excel
   ↓
4. Clic sur "Importer" déclenche handleImportExcel()
   ↓
5. Lecture du fichier avec XLSX.read()
   ↓
6. Conversion en JSON avec sheet_to_json()
   ↓
7. Validation et nettoyage des données
   ↓
8. Importation projet par projet via API
   ↓
9. Mise à jour de la barre de progression
   ↓
10. Affichage du rapport final
```

### **Fonction d'Importation**
```typescript
const handleImportExcel = async () => {
  // 1. Vérification du fichier
  if (!importFile) {
    setMessage("Veuillez sélectionner un fichier Excel");
    return;
  }

  try {
    // 2. Import dynamique de XLSX (évite les problèmes SSR)
    const XLSX = await import('xlsx');

    // 3. Lecture du fichier
    const data = await importFile.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 4. Traitement des données
    const rows = jsonData.slice(1) as any[][]; // Skip header
    const projectsToImport = rows
      .filter(row => row.length >= 2 && row[0] && row[1])
      .map(row => ({
        name: String(row[0]).trim(),
        projectNumber: String(row[1]).trim(),
        projectType: row[2] ? String(row[2]).trim() : "",
        staffAccess: validateStaffAccess(row[3])
      }));

    // 5. Importation en masse
    for (const project of projectsToImport) {
      await importSingleProject(project);
      updateProgress();
    }

  } catch (error) {
    handleImportError(error);
  }
};
```

## 📊 **Gestion de la Progression**

### **État de Progression**
```typescript
const [importProgress, setImportProgress] = useState<{
  total: number;        // Nombre total de projets
  processed: number;    // Nombre de projets traités
  errors: string[];     // Liste des erreurs
} | null>(null);
```

### **Barre de Progression**
```typescript
// Affichage visuel de la progression
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-green-600 h-2 rounded-full transition-all duration-300"
    style={{ width: `${(processed / total) * 100}%` }}
  />
</div>
```

### **Rapport d'Erreurs**
```typescript
// Affichage des erreurs d'importation
{importProgress.errors.length > 0 && (
  <div className="mt-2 p-2 bg-red-50 rounded-lg">
    <p className="text-xs text-red-600 font-medium">Erreurs:</p>
    <ul className="text-xs text-red-600 mt-1 space-y-1">
      {importProgress.errors.slice(0, 3).map((error, index) => (
        <li key={index}>• {error}</li>
      ))}
      {importProgress.errors.length > 3 && (
        <li>• ... et {importProgress.errors.length - 3} autres erreurs</li>
      )}
    </ul>
  </div>
)}
```

## 🛡️ **Validation des Données**

### **Validation Côté Client**
```typescript
const projectsToImport = rows
  .filter(row => row.length >= 2 && row[0] && row[1]) // Au moins nom et numéro
  .map(row => ({
    name: String(row[0]).trim(),
    projectNumber: String(row[1]).trim(),
    projectType: "", // Type vide par défaut
    staffAccess: row[2] && ["ALL", "OPERATION", "PROGRAMME", "SUPPORT"].includes(String(row[2]).trim())
      ? String(row[2]).trim() as "ALL" | "OPERATION" | "PROGRAMME" | "SUPPORT"
      : "ALL"
  }));
```

### **Validation Côté Serveur**
```typescript
// L'API /api/projects valide chaque projet avec le schema Zod
const result = projectSchema.safeParse(formData);
if (!result.success) {
  return NextResponse.json({
    success: false,
    message: "Données invalides"
  }, { status: 400 });
}
```

## 🎯 **Gestion des Erreurs**

### **Types d'Erreurs**
1. **Fichier non sélectionné** : "Veuillez sélectionner un fichier Excel"
2. **Fichier invalide** : "Erreur lors de la lecture du fichier Excel"
3. **Aucune donnée** : "Aucun projet valide trouvé dans le fichier Excel"
4. **Erreurs API** : Messages spécifiques par projet

### **Rapport Final**
```typescript
// Message de résumé après importation
const successCount = processed - errors.length;
setMessage(`Importation terminée: ${successCount} projets créés, ${errors.length} erreurs`);
```

## 🧪 **Tests de Validation**

### **Test d'Importation**
1. **Créer un fichier Excel** avec le format attendu
2. **Aller sur** `/projects`
3. **Cliquer** sur le bouton "Importer"
4. **Sélectionner** le fichier Excel
5. **Cliquer** sur "Importer"
6. **Vérifier** :
   - ✅ Barre de progression s'affiche
   - ✅ Projets créés dans la base de données
   - ✅ Liste des projets mise à jour
   - ✅ Rapport d'erreurs si applicable

### **Exemple de Fichier Excel**
```
Nom                    | Numéro    | Accès Staff
Développement Durable  | PROJ-001  | ALL
Initiative Climat     | PROJ-002  | PROGRAMME
Support Technique     | PROJ-003  | OPERATION
Formation Staff       | PROJ-004  | SUPPORT
```

## 🎨 **Interface Utilisateur**

### **Boutons d'Action**
```
📤 Importer      - Ouvre le modal d'importation (vert)
➕ Nouveau Projet - Ouvre le modal de création (bleu)
```

### **Modal d'Importation**
```
┌─ Importer des projets ─────────────────────────────────┐
│                                                        │
│ Sélectionnez un fichier Excel (.xlsx) contenant       │
│ les projets à importer                                 │
│                                                        │
│ ┌─ Fichier Excel ─────────────────────────────────────┐│
│ │ [Choisir un fichier...]                            ││
│ │ Format attendu: Nom | Numéro | Type | Accès Staff  ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ ┌─ Progression ───────────────────────────────────────┐│
│ │ 3/5 ████████████████████░░░░░░░░ 60%               ││
│ │ Erreurs: • Projet X: Numéro déjà existant          ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ 💡 Modèle Excel                                        │
│ Première ligne: en-têtes                               │
│ Lignes suivantes: données des projets                  │
│                                                        │
│                                    [Annuler] [Importer]│
└────────────────────────────────────────────────────────┘
```

## 🚀 **Avantages de la Fonctionnalité**

### **Efficacité**
- ✅ **Importation en masse** : Création de dizaines de projets en une fois
- ✅ **Gain de temps** : Plus de saisie manuelle répétitive
- ✅ **Validation automatique** : Contrôle des données avant importation

### **Facilité d'Utilisation**
- ✅ **Interface intuitive** : Modal simple et clair
- ✅ **Progression visuelle** : Barre de progression en temps réel
- ✅ **Rapport détaillé** : Erreurs et succès clairement affichés

### **Robustesse**
- ✅ **Gestion d'erreurs** : Traitement des cas d'échec
- ✅ **Validation double** : Client et serveur
- ✅ **Import dynamique** : Évite les problèmes SSR

## 📋 **Format de Fichier Recommandé**

### **Modèle Excel à Utiliser**
```
A1: Nom
B1: Numéro
C1: Accès Staff

A2: Développement Durable
B2: PROJ-001
C2: ALL

A3: Initiative Climat
B3: PROJ-002
C3: PROGRAMME

A4: Support Technique
B4: PROJ-003
C4: OPERATION
```

### **Conseils d'Utilisation**
- ✅ **Première ligne** : Toujours les en-têtes
- ✅ **Colonnes A et B** : Obligatoires (Nom et Numéro)
- ✅ **Colonne C** : Optionnelle (Accès Staff)
- ✅ **Pas de cellules vides** : Dans les colonnes obligatoires
- ✅ **Format .xlsx** : Recommandé pour la compatibilité

## 🎯 **Application Disponible**

### **URL de Test**
- **Page Projects** : http://localhost:3001/projects

### **Fonctionnalités Finales**
- ✅ **Bouton Importer** : Interface d'importation Excel
- ✅ **Modal complet** : Sélection fichier + progression
- ✅ **Validation robuste** : Contrôle des données
- ✅ **Rapport détaillé** : Succès et erreurs

---

## 🎉 **Fonctionnalité d'Importation Excel Complète !**

La page `/projects` dispose maintenant d'une **fonctionnalité d'importation Excel complète** avec :
- **Interface intuitive** pour sélectionner et importer des fichiers
- **Validation robuste** des données Excel
- **Progression en temps réel** avec gestion d'erreurs
- **Rapport détaillé** des succès et échecs ! ✨
