# 📋 Système de Consultation des Feuilles de Temps Signées

## 🎯 Vue d'ensemble

Ce système permet aux **ADMIN** et **PMSU** de consulter, filtrer et télécharger toutes les feuilles de temps signées électroniquement par le STAFF via le système de signature par email.

## 🚀 Fonctionnalités

### ✅ **Consultation complète**
- 📊 **Liste de toutes les feuilles de temps** avec statuts
- 🔍 **Filtrage avancé** par année, semestre, statut et utilisateur
- 📄 **Pagination** pour gérer de grandes quantités de données
- 📈 **Statistiques en temps réel** des signatures

### ✅ **Gestion des statuts**
- 🟢 **SIGNED** : Feuille de temps signée et disponible
- 🟡 **PENDING** : En attente de signature
- 🔴 **EXPIRED** : Lien de signature expiré
- ⚫ **CANCELLED** : Signature annulée

### ✅ **Actions disponibles**
- 📥 **Téléchargement** des PDFs signés
- 👁️ **Visualisation** des informations détaillées
- 📅 **Suivi** des dates de signature et d'expiration

## 🏗️ Architecture Technique

### **1. API Endpoints**

#### **GET `/api/admin/signed-timesheets`**
Récupère toutes les feuilles de temps signées avec filtres.

**Paramètres de requête :**
- `year` : Année (ex: 2024)
- `semester` : Semestre (S1 ou S2)
- `status` : Statut de signature
- `userId` : ID de l'utilisateur

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 123,
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "userGrade": "Ingénieur",
      "userRole": "STAFF",
      "year": 2024,
      "semester": "S1",
      "hasSignedPdf": true,
      "signatureDate": "2024-01-15T10:30:00Z",
      "signatureStatus": "SIGNED",
      "expiresAt": "2024-01-22T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### **GET `/api/admin/signed-timesheets/[id]/download`**
Télécharge le PDF signé d'une feuille de temps spécifique.

**Paramètres :**
- `id` : ID de la feuille de temps signée

**Réponse :**
- Fichier PDF avec headers appropriés
- Nom de fichier formaté : `feuille_temps_signee_[Nom]_[Année]_[Semestre].pdf`

### **2. Page d'administration**

**Route :** `/admin/signed-timesheets`

**Composant :** `src/app/admin/signed-timesheets/page.tsx`

## 🎨 Interface Utilisateur

### **En-tête**
- 🏷️ **Titre** : "Feuilles de Temps Signées"
- 📝 **Description** : "Gestion et consultation des signatures électroniques"

### **Filtres**
- 📅 **Année** : Dropdown avec années disponibles
- 📚 **Semestre** : S1 (Jan-Juin) ou S2 (Juil-Déc)
- ✅ **Statut** : PENDING, SIGNED, EXPIRED, CANCELLED
- 👤 **Utilisateur** : Recherche par nom

### **Statistiques**
- 🟢 **Signées** : Nombre de feuilles signées
- 🟡 **En attente** : Nombre de feuilles en attente
- 🔴 **Expirées** : Nombre de liens expirés
- 🔵 **Total** : Nombre total de feuilles

### **Tableau principal**
| Colonne | Description |
|---------|-------------|
| **STAFF** | Nom, grade et rôle de l'utilisateur |
| **Période** | Année et semestre |
| **Statut** | Statut de signature avec indicateur visuel |
| **Date de signature** | Date et heure de signature |
| **Expiration** | Date d'expiration du lien |
| **Actions** | Bouton de téléchargement si disponible |

## 🔧 Implémentation Technique

### **1. États du composant**
```typescript
const [signedTimesheets, setSignedTimesheets] = useState<SignedTimesheet[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Filtres
const [selectedYear, setSelectedYear] = useState<string>("");
const [selectedSemester, setSelectedSemester] = useState<string>("");
const [selectedStatus, setSelectedStatus] = useState<string>("");
const [selectedUser, setSelectedUser] = useState<string>("");

// Pagination
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(10);
```

### **2. Fonction de récupération des données**
```typescript
const fetchSignedTimesheets = useCallback(async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    // Construire les paramètres de filtrage
    const params = new URLSearchParams();
    if (selectedYear) params.append("year", selectedYear);
    if (selectedSemester) params.append("semester", selectedSemester);
    if (selectedStatus) params.append("status", selectedStatus);
    if (selectedUser) params.append("userId", selectedUser);

    const response = await fetch(`/api/admin/signed-timesheets?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (result.success) {
      setSignedTimesheets(result.data);
    }
  } catch (error) {
    setError((error as Error).message);
  } finally {
    setLoading(false);
  }
}, [selectedYear, selectedSemester, selectedStatus, selectedUser]);
```

### **3. Fonction de téléchargement**
```typescript
const downloadSignedPdf = async (timesheetId: number, fileName: string) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/admin/signed-timesheets/${timesheetId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement: ${response.status}`);
    }

    // Créer un blob et télécharger
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("PDF téléchargé avec succès !");
  } catch (error) {
    toast.error("Erreur lors du téléchargement du PDF");
  }
};
```

## 🔐 Sécurité et Autorisation

### **Vérifications d'accès**
- ✅ **Authentification** : Token JWT requis
- 🔒 **Autorisation** : Seuls ADMIN et PMSU peuvent accéder
- 🚫 **Protection** : Vérification du rôle utilisateur

### **Validation des données**
- 📝 **Paramètres** : Validation des filtres d'entrée
- 🆔 **ID** : Vérification de l'existence des feuilles de temps
- 📄 **PDF** : Vérification de la disponibilité des fichiers signés

## 📊 Base de Données

### **Table `SignedTimesheet`**
```sql
model SignedTimesheet {
  id                Int      @id @default(autoincrement())
  userId            Int      // ID du STAFF
  year              Int      // Année
  semester          Semester // S1 ou S2
  originalPdfPath   String   // Chemin vers le PDF original
  signedPdfData     Bytes?   // PDF signé stocké en base (BLOB)
  signatureDate     DateTime? // Date de signature
  signatureStatus   SignatureStatus // PENDING, SIGNED, EXPIRED, CANCELLED
  signatureToken    String   @unique // Token unique pour la signature
  expiresAt         DateTime // Expiration du token de signature
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, year, semester])
  @@index([userId])
  @@index([signatureToken])
}
```

## 🧪 Tests et Validation

### **Script de test**
```bash
node scripts/test-signed-timesheets-system.js
```

**Tests inclus :**
1. ✅ **Structure des données** SignedTimesheet
2. 🔍 **Filtrage des données** par différents critères
3. 📄 **Système de pagination** avec calculs
4. ✅ **Statuts de signature** et leurs traductions
5. 📈 **Calcul des statistiques** en temps réel
6. 📅 **Formatage des dates** en français
7. 🔧 **Actions disponibles** selon le statut

## 🚀 Utilisation

### **1. Accès à la page**
- Naviguer vers `/admin/signed-timesheets`
- Être connecté avec un compte ADMIN ou PMSU

### **2. Consultation des données**
- 📊 **Vue d'ensemble** : Statistiques en haut de page
- 🔍 **Filtrage** : Utiliser les filtres pour affiner la recherche
- 📄 **Navigation** : Utiliser la pagination pour parcourir les résultats

### **3. Téléchargement des PDFs**
- ✅ **Bouton "Télécharger"** : Disponible pour les feuilles signées
- 📁 **Nom de fichier** : Format automatique avec nom du STAFF et période
- 💾 **Sauvegarde** : Téléchargement direct dans le dossier de téléchargements

## 🔄 Workflow Complet

### **1. Génération de la feuille de temps**
- Admin génère la feuille de temps STAFF
- Système crée un enregistrement `SignedTimesheet` avec statut `PENDING`

### **2. Envoi de l'email**
- Email automatique envoyé au STAFF avec lien de signature
- PDF de la feuille de temps joint à l'email

### **3. Signature par le STAFF**
- STAFF clique sur le lien dans l'email
- Signature électronique via la page web
- Statut passe à `SIGNED`

### **4. Consultation par l'Admin**
- Admin consulte la page des feuilles signées
- Filtre et recherche selon ses besoins
- Télécharge les PDFs signés

## 🎯 Avantages du Système

### **Pour les ADMIN/PMSU :**
- 📊 **Vue d'ensemble** de toutes les signatures
- 🔍 **Recherche rapide** par différents critères
- 📥 **Accès facile** aux documents signés
- 📈 **Suivi en temps réel** des statuts

### **Pour le STAFF :**
- 📧 **Processus simplifié** de signature par email
- 🔗 **Lien sécurisé** et unique pour chaque signature
- ⏰ **Délai de 7 jours** pour signer
- 📱 **Signature accessible** depuis n'importe quel appareil

### **Pour l'organisation :**
- 📋 **Traçabilité complète** des signatures
- 🔒 **Sécurité renforcée** avec tokens uniques
- 📊 **Conformité** avec les exigences de signature électronique
- 💾 **Archivage centralisé** des documents signés

## 🔮 Évolutions Futures

### **Fonctionnalités potentielles :**
- 📧 **Notifications automatiques** pour les signatures en retard
- 📊 **Rapports et exports** des données de signature
- 🔄 **Workflow d'approbation** multi-niveaux
- 📱 **Application mobile** pour les signatures
- 🔐 **Signature biométrique** et authentification forte

## 📝 Conclusion

Le système de consultation des feuilles de temps signées complète parfaitement le workflow de signature électronique par email. Il offre aux administrateurs une vue complète et organisée de toutes les signatures, tout en maintenant la simplicité du processus pour le STAFF.

**Le système est maintenant prêt et testé !** 🎉
