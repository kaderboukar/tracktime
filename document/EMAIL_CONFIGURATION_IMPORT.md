# 📧 Configuration Email pour l'Import Excel des Utilisateurs

## ✅ **Fonctionnalité Implémentée**

L'import par fichier Excel pour la création des utilisateurs **inclut maintenant l'envoi automatique d'emails de bienvenue** à chaque utilisateur créé.

## 🔧 **Configuration Requise**

### **Variables d'Environnement SMTP**

Pour que l'envoi d'email fonctionne, vous devez configurer les variables d'environnement suivantes dans votre fichier `.env` :

### **URL de l'Application (Automatique)**

Le système détecte automatiquement l'URL de l'application selon cette priorité :

1. **NEXT_PUBLIC_APP_URL** (recommandé)
2. **VERCEL_URL** (automatique sur Vercel)
3. **NEXTAUTH_URL** (si configuré)
4. **localhost:3000** (fallback développement)

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=votre-email@gmail.com

# URL de l'application (pour les liens dans les emails)
# Priorité: NEXT_PUBLIC_APP_URL > VERCEL_URL > NEXTAUTH_URL > localhost
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app

# Emails pour les notifications d'entrées de temps (optionnel)
TIME_ENTRY_NOTIFICATION_EMAILS=admin@example.com,manager@example.com
```

### **Exemples de Configuration**

#### **Gmail**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mon-app@gmail.com
SMTP_PASSWORD=mon-mot-de-passe-app
SMTP_FROM=mon-app@gmail.com
```

#### **Outlook/Hotmail**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=mon-app@outlook.com
SMTP_PASSWORD=mon-mot-de-passe
SMTP_FROM=mon-app@outlook.com
```

#### **Serveur SMTP Personnalisé**
```env
SMTP_HOST=mail.mondomaine.com
SMTP_PORT=587
SMTP_USER=app@mondomaine.com
SMTP_PASSWORD=mon-mot-de-passe
SMTP_FROM=app@mondomaine.com
```

#### **Configuration pour Vercel (Production)**
```env
# Ces variables sont automatiquement définies par Vercel
VERCEL_URL=votre-app.vercel.app

# Ou définissez manuellement
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

## 📋 **Processus d'Import avec Email**

### **Étapes du Workflow**
```
1. Import du fichier Excel
   ↓
2. Validation des données
   ↓
3. Création des utilisateurs en base
   ↓
4. Envoi automatique d'email de bienvenue
   ↓
5. Rapport d'import avec statut des emails
```

### **Contenu de l'Email de Bienvenue**

L'email envoyé contient :
- **Nom de l'utilisateur**
- **Adresse email**
- **Mot de passe** (celui fourni dans le fichier Excel ou par défaut)
- **Rôle attribué**
- **Lien de connexion** vers l'application
- **Instructions de sécurité**

## 🎨 **Template Email**

L'email utilise un template HTML professionnel avec :
- **En-tête** avec logo et titre
- **Informations de connexion** dans un cadre coloré
- **Bouton de connexion** direct
- **Instructions de sécurité**
- **Pied de page** avec informations légales

## ⚠️ **Gestion des Erreurs**

### **Erreurs Email Non-Bloquantes**
- Si l'envoi d'email échoue, l'import de l'utilisateur **continue**
- Les erreurs email sont **loggées** dans la console
- L'utilisateur est **créé même si l'email échoue**

### **Types d'Erreurs Possibles**
- Configuration SMTP incorrecte
- Serveur SMTP indisponible
- Email invalide dans le fichier Excel
- Problèmes de réseau

## 🧪 **Test de la Configuration**

### **Route de Test**
Utilisez la route `/api/test-email` pour tester la configuration :

```bash
# Test de la configuration SMTP et détection de l'URL
GET /api/test-email

# Test d'envoi d'email de bienvenue
POST /api/test-email
{
  "type": "welcome",
  "testData": {
    "email": "test@example.com",
    "name": "Utilisateur Test",
    "role": "STAFF"
  }
}
```

### **Réponse du Test GET**
```json
{
  "success": true,
  "configValid": true,
  "appUrl": "https://votre-app.vercel.app",
  "config": {
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "app@gmail.com",
    "from": "app@gmail.com"
  },
  "environment": {
    "NEXT_PUBLIC_APP_URL": "https://votre-app.vercel.app",
    "VERCEL_URL": "votre-app.vercel.app",
    "NEXTAUTH_URL": null
  }
}
```

### **Interface de Test**
Accédez à l'interface de test via le dashboard admin pour :
- Vérifier la configuration SMTP
- Tester l'envoi d'emails
- Voir les logs d'erreur

## 📊 **Statistiques d'Import**

### **Rapport d'Import**
Après un import Excel, vous recevez :
- **Nombre d'utilisateurs créés**
- **Liste des erreurs** (si any)
- **Statut des emails envoyés** (dans les logs)

### **Exemple de Réponse**
```json
{
  "success": true,
  "message": "5 utilisateurs importés avec succès",
  "errors": [
    {
      "row": 3,
      "message": "L'email john.doe@example.com est déjà utilisé"
    }
  ],
  "importedUsers": [
    {
      "id": "1",
      "email": "user1@example.com",
      "name": "User One"
    }
  ]
}
```

## 🔒 **Sécurité**

### **Bonnes Pratiques**
- Utilisez des **mots de passe d'application** pour Gmail
- Configurez un **compte email dédié** pour l'application
- Activez l'**authentification à deux facteurs** sur le compte email
- Utilisez des **variables d'environnement** pour les secrets

### **Mots de Passe**
- Les mots de passe sont **envoyés en clair** dans l'email (nécessaire pour l'utilisateur)
- Les mots de passe sont **hashés** avant stockage en base
- Mot de passe par défaut : `time2025trackingNiger`

## 🚀 **Déploiement**

### **Variables de Production**
Assurez-vous de configurer les variables d'environnement sur votre serveur de production :

```bash
# Exemple pour Vercel
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASSWORD
vercel env add SMTP_FROM
vercel env add NEXT_PUBLIC_APP_URL
```

### **Détection Automatique de l'URL**

Sur Vercel, l'URL est automatiquement détectée via la variable `VERCEL_URL`. Vous n'avez pas besoin de configurer `NEXT_PUBLIC_APP_URL` manuellement.

**Exemples d'URLs automatiques :**
- **Développement** : `http://localhost:3000`
- **Preview** : `https://votre-app-git-feature.vercel.app`
- **Production** : `https://votre-app.vercel.app`

### **Test Post-Déploiement**
Après le déploiement, testez l'envoi d'email avec un utilisateur de test pour vérifier que tout fonctionne correctement.

## 📝 **Notes Importantes**

1. **L'envoi d'email est maintenant intégré** dans l'import Excel
2. **Les erreurs email n'empêchent pas** la création des utilisateurs
3. **Configuration SMTP obligatoire** pour l'envoi d'emails
4. **Test recommandé** avant utilisation en production
5. **Logs détaillés** pour le debugging des problèmes email
