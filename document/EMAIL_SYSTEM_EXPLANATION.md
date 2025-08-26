# 📧 Système d'Envoi d'Emails - WORKLOAD STUDY SURVEY

## 🎯 **Vue d'Ensemble**

Votre application envoie automatiquement des emails dans **2 situations principales** :

1. **📨 Email de Bienvenue** - Quand un utilisateur est créé
2. **📋 Notification d'Entrée de Temps** - Quand une nouvelle entrée de temps est créée

## 📨 **1. Email de Bienvenue**

### **🕐 Quand est-il envoyé ?**

L'email de bienvenue est envoyé **automatiquement** dans ces cas :

#### **A. Création d'utilisateur individuel**
- **Route** : `POST /api/user`
- **Déclencheur** : Un admin crée un nouvel utilisateur via l'interface
- **Moment** : Immédiatement après la création réussie de l'utilisateur

#### **B. Import Excel d'utilisateurs**
- **Route** : `POST /api/user/import`
- **Déclencheur** : Un admin importe un fichier Excel avec des utilisateurs
- **Moment** : Pour chaque utilisateur créé avec succès dans l'import

### **📋 Contenu de l'Email de Bienvenue**

```
Sujet : "Bienvenue dans le système de suivi du temps - Vos informations de connexion"

Contenu :
- Nom de l'utilisateur
- Adresse email
- Mot de passe (en clair pour l'utilisateur)
- Rôle attribué (ADMIN, PMSU, MANAGEMENT, STAFF)
- Lien direct vers la page de connexion
- Instructions de sécurité
```

### **🎨 Template de l'Email**

```html
<div class="header">
    <h1>WORKLOAD STUDY SURVEY</h1>
    <h2>Bienvenue dans le système de suivi du temps</h2>
</div>
<div class="credentials">
    <h3>Vos informations de connexion :</h3>
    <p><strong>Email :</strong> user@example.com</p>
    <p><strong>Mot de passe :</strong> MotDePasse123</p>
    <p><strong>Rôle :</strong> STAFF</p>
</div>
<a href="https://votre-app.vercel.app/login" class="button">
    Se connecter
</a>
```

## 📋 **2. Notification d'Entrée de Temps**

### **🕐 Quand est-elle envoyée ?**

La notification est envoyée **automatiquement** quand :

- **Route** : `POST /api/time-entries`
- **Déclencheur** : Un utilisateur crée une nouvelle entrée de temps
- **Moment** : Immédiatement après la création réussie de l'entrée

### **👥 Destinataires**

Les notifications sont envoyées aux emails configurés dans la variable d'environnement :
```env
TIME_ENTRY_NOTIFICATION_EMAILS=admin@example.com,manager@example.com
```

### **📋 Contenu de la Notification**

```
Sujet : "Nouvelle entrée de temps - [Nom Utilisateur] - [Nom Projet]"

Contenu :
- Nom de l'utilisateur qui a créé l'entrée
- Email de l'utilisateur
- Nom du projet
- Nom de l'activité
- Nombre d'heures
- Date de l'entrée
- Période (semestre et année)
- Description (si fournie)
- Lien vers le dashboard
```

### **🎨 Template de la Notification**

```html
<div class="header">
    <h1>WORKLOAD STUDY SURVEY</h1>
    <h2>Nouvelle entrée de temps</h2>
</div>
<div class="entry-details">
    <h3>Détails de l'entrée :</h3>
    <div>Utilisateur : John Doe (john@example.com)</div>
    <div>Projet : Projet Alpha</div>
    <div>Activité : Développement</div>
    <div>Heures : 8h</div>
    <div>Date : 15/01/2024</div>
    <div>Période : S1 2024</div>
</div>
<a href="https://votre-app.vercel.app/" class="button">
    Accéder au Dashboard
</a>
```

## ⚙️ **Configuration Technique**

### **🔧 Configuration SMTP**

Le système utilise **Nodemailer** avec cette configuration :

```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // ex: smtp.gmail.com
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,      // ex: app@gmail.com
    pass: process.env.SMTP_PASSWORD,  // mot de passe d'application
  },
});
```

### **🌍 Détection Automatique de l'URL**

L'URL dans les emails est détectée automatiquement selon cette priorité :

1. **NEXT_PUBLIC_APP_URL** (recommandé)
2. **VERCEL_URL** (automatique sur Vercel)
3. **NEXTAUTH_URL** (si configuré)
4. **localhost:3000** (fallback développement)

## 🛡️ **Gestion des Erreurs**

### **❌ Erreurs Non-Bloquantes**

**Important** : Les erreurs d'envoi d'email **n'empêchent jamais** les opérations principales :

- ✅ L'utilisateur est créé même si l'email échoue
- ✅ L'entrée de temps est créée même si la notification échoue
- ✅ Les erreurs sont loggées dans la console
- ✅ L'application continue de fonctionner normalement

### **📝 Logs d'Erreurs**

```javascript
// Succès
console.log(`Email de bienvenue envoyé à ${userData.email}`);

// Erreur
console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
```

## 🔄 **Workflow Complet**

### **Workflow Email de Bienvenue**

```
1. Admin crée un utilisateur
   ↓
2. Validation des données
   ↓
3. Création en base de données
   ↓
4. Hashage du mot de passe
   ↓
5. Envoi de l'email de bienvenue
   ↓
6. Log du succès/échec
   ↓
7. Retour de la réponse à l'admin
```

### **Workflow Notification d'Entrée de Temps**

```
1. Utilisateur crée une entrée de temps
   ↓
2. Validation des données
   ↓
3. Création en base de données
   ↓
4. Récupération des emails de notification
   ↓
5. Envoi de la notification
   ↓
6. Log du succès/échec
   ↓
7. Retour de la réponse à l'utilisateur
```

## 🧪 **Test du Système**

### **Test de Configuration**

```bash
# Vérifier la configuration SMTP
GET /api/test-email

# Tester l'envoi d'email de bienvenue
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

### **Test d'Import de Masse**

```bash
# Tester l'import avec emails
POST /api/test-email
{
  "type": "bulk-import"
}
```

### **Interface de Test Web**

Accédez à : `http://localhost:3000/test-bulk-import.html`

## 📊 **Statistiques et Monitoring**

### **Logs Disponibles**

- ✅ Emails envoyés avec succès
- ❌ Erreurs d'envoi d'emails
- 📧 Destinataires des notifications
- 🔧 Configuration SMTP utilisée

### **Variables d'Environnement de Monitoring**

```env
# Pour activer les logs détaillés en développement
NODE_ENV=development

# Pour voir les erreurs complètes
NODE_ENV=development
```

## 🚀 **Déploiement**

### **Variables de Production**

Sur Vercel ou autre plateforme :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=app@votre-domaine.com
SMTP_PASSWORD=mot-de-passe-app
SMTP_FROM=app@votre-domaine.com

# URL de production
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app

# Emails de notification
TIME_ENTRY_NOTIFICATION_EMAILS=admin@votre-domaine.com
```

### **Sécurité**

- 🔒 Utilisez des mots de passe d'application pour Gmail
- 🔒 Activez l'authentification à deux facteurs
- 🔒 Utilisez des variables d'environnement pour les secrets
- 🔒 Configurez un compte email dédié pour l'application

## ✅ **Résumé**

| Type d'Email | Déclencheur | Destinataire | Contenu |
|--------------|-------------|--------------|---------|
| **Bienvenue** | Création utilisateur | Nouvel utilisateur | Informations de connexion |
| **Notification** | Nouvelle entrée de temps | Admins/Managers | Détails de l'entrée |

**Tous les emails sont envoyés automatiquement et de manière non-bloquante !** 🎉

