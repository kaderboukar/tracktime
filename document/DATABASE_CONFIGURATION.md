# 🗄️ Configuration Base de Données et Variables d'Environnement

## ⚠️ **Problème Identifié**

L'erreur "Erreur serveur" lors de l'ajout/modification de projets avec l'option "MANAGEMENT" est causée par une incohérence entre le schéma Prisma et la base de données.

## 🔧 **Solution**

### **1. Mise à Jour du Schéma Prisma**

L'enum `staffAccess` a été mis à jour pour inclure `"MANAGEMENT"` :

```prisma
enum staffAccess {
  ALL
  OPERATION
  PROGRAMME
  SUPPORT
  MANAGEMENT  // ✅ Ajouté
}
```

### **2. Migration de Base de Données**

Vous devez exécuter la migration pour mettre à jour la base de données :

```bash
# Générer et appliquer la migration
npx prisma migrate dev --name add_management_to_staff_access

# Ou si vous préférez générer d'abord
npx prisma migrate dev
```

### **3. Variables d'Environnement Requises**

Créez un fichier `.env` à la racine du projet avec ces variables :

```env
# Configuration Base de Données
DATABASE_URL="mysql://username:password@localhost:3306/tracktime"

# Configuration JWT
JWT_SECRET="votre-secret-jwt-tres-securise"

# Configuration SMTP pour les emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=votre-email@gmail.com

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Emails pour les notifications d'entrées de temps (optionnel)
TIME_ENTRY_NOTIFICATION_EMAILS=admin@example.com,manager@example.com

# Configuration NextAuth (optionnel)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-nextauth
```

## 🚀 **Étapes de Résolution**

### **Étape 1 : Configuration de la Base de Données**
```bash
# 1. Créer le fichier .env avec vos paramètres de base de données
cp .env.example .env
# Éditer le fichier .env avec vos vraies valeurs

# 2. Appliquer les migrations
npx prisma migrate dev

# 3. Générer le client Prisma
npx prisma generate
```

### **Étape 2 : Vérification**
```bash
# Vérifier que la base de données est à jour
npx prisma db push

# Vérifier le statut des migrations
npx prisma migrate status
```

### **Étape 3 : Test**
1. Redémarrer le serveur de développement
2. Tester l'ajout d'un projet avec `staffAccess: "MANAGEMENT"`
3. Vérifier que l'erreur "Erreur serveur" n'apparaît plus

## 🔍 **Détails du Problème**

### **Avant la Correction**
- Le schéma Prisma ne incluait pas `"MANAGEMENT"` dans l'enum `staffAccess`
- La validation côté client acceptait `"MANAGEMENT"`
- La base de données rejetait la valeur `"MANAGEMENT"`
- Résultat : "Erreur serveur" lors de l'ajout/modification

### **Après la Correction**
- ✅ L'enum `staffAccess` inclut `"MANAGEMENT"`
- ✅ La validation côté client accepte `"MANAGEMENT"`
- ✅ La base de données accepte `"MANAGEMENT"`
- ✅ L'ajout/modification fonctionne correctement

## 📋 **Valeurs Valides pour staffAccess**

Après la migration, les valeurs valides sont :
- `"ALL"` - Tous les utilisateurs
- `"OPERATION"` - Équipe opération
- `"PROGRAMME"` - Équipe programme
- `"SUPPORT"` - Équipe support
- `"MANAGEMENT"` - Équipe management (✅ Nouveau)

## 🐛 **Dépannage**

### **Erreur "Environment variable not found: DATABASE_URL"**
- Vérifiez que le fichier `.env` existe
- Vérifiez que `DATABASE_URL` est correctement définie
- Redémarrez le terminal après avoir créé le fichier `.env`

### **Erreur de Migration**
```bash
# Si la migration échoue, essayez :
npx prisma migrate reset
npx prisma migrate dev
```

### **Erreur de Connexion à la Base de Données**
- Vérifiez que MySQL est démarré
- Vérifiez les paramètres de connexion dans `DATABASE_URL`
- Vérifiez que la base de données `tracktime` existe

## 📝 **Notes Importantes**

1. **Migration Obligatoire** : La migration doit être appliquée pour que `"MANAGEMENT"` fonctionne
2. **Variables d'Environnement** : Toutes les variables doivent être configurées
3. **Redémarrage** : Redémarrez le serveur après les modifications
4. **Test** : Testez toujours après les modifications

## ✅ **Validation**

Après avoir suivi ces étapes, vous devriez pouvoir :
- ✅ Ajouter un projet avec `staffAccess: "MANAGEMENT"`
- ✅ Modifier un projet existant vers `staffAccess: "MANAGEMENT"`
- ✅ Voir `"MANAGEMENT"` dans la liste déroulante
- ✅ Ne plus avoir d'erreur "Erreur serveur"
