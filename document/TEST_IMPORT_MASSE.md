# 🧪 Guide de Test - Import de Masse avec Emails

## 🎯 **Objectif du Test**

Vérifier que l'import de masse d'utilisateurs par fichier Excel envoie bien des emails de bienvenue à tous les utilisateurs créés.

## 🚀 **Méthodes de Test**

### **Méthode 1 : Interface Web (Recommandée)**

1. **Accéder à l'interface de test**
   ```
   http://localhost:3000/test-bulk-import.html
   ```

2. **Se connecter à l'application**
   - Assurez-vous d'être connecté en tant qu'admin
   - Le token d'authentification est automatiquement récupéré

3. **Tester la configuration SMTP**
   - Cliquer sur "Tester Configuration SMTP"
   - Vérifier que la configuration est valide

4. **Lancer le test d'import de masse**
   - Cliquer sur "Lancer Test Import de Masse"
   - Attendre la fin du traitement
   - Vérifier les résultats détaillés

### **Méthode 2 : API Directe**

```bash
# Test de configuration
curl -X GET http://localhost:3000/api/test-email \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test d'import de masse
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type": "bulk-import"}'
```

## 📊 **Résultats Attendus**

### **Succès Complet**
```json
{
  "success": true,
  "message": "Test d'import de masse terminé: 3 utilisateurs créés, 3 emails envoyés",
  "summary": {
    "total": 3,
    "created": 3,
    "emailsSent": 3,
    "skipped": 0,
    "errors": 0
  }
}
```

### **Avec Erreurs**
```json
{
  "success": true,
  "message": "Test d'import de masse terminé: 2 utilisateurs créés, 1 email envoyé",
  "summary": {
    "total": 3,
    "created": 2,
    "emailsSent": 1,
    "skipped": 1,
    "errors": 0
  }
}
```

## 🔍 **Vérifications à Effectuer**

### **1. Vérification Base de Données**
- Les utilisateurs sont créés en base
- Les coûts proforma sont associés
- Les mots de passe sont hashés

### **2. Vérification Emails**
- Emails reçus dans les boîtes de réception
- Contenu correct (nom, email, mot de passe, rôle)
- Liens de connexion fonctionnels

### **3. Vérification Logs**
- Logs de création d'utilisateurs
- Logs d'envoi d'emails
- Logs d'erreurs (si any)

## ⚠️ **Points d'Attention**

### **Utilisateurs de Test**
- Les emails utilisés sont fictifs : `test1@example.com`, `test2@example.com`, `test3@example.com`
- Ces utilisateurs sont créés en base de données réelle
- Ils peuvent être supprimés après le test

### **Configuration SMTP**
- Vérifier que les variables d'environnement sont configurées
- Tester avec un email valide pour recevoir les emails de test

### **Performance**
- Le test crée 3 utilisateurs séquentiellement
- Chaque utilisateur déclenche un envoi d'email
- Le temps total dépend de la vitesse du serveur SMTP

## 🐛 **Dépannage**

### **Erreur "Configuration SMTP invalide"**
```bash
# Vérifier les variables d'environnement
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER
echo $SMTP_PASSWORD
echo $SMTP_FROM
```

### **Erreur "Non autorisé"**
- Vérifier que vous êtes connecté en tant qu'admin
- Vérifier que le token d'authentification est valide

### **Emails non reçus**
- Vérifier la configuration SMTP
- Vérifier les logs du serveur
- Tester avec un email valide

### **Erreurs de base de données**
- Vérifier la connexion à la base de données
- Vérifier les migrations Prisma
- Vérifier les contraintes d'unicité

## 📝 **Logs de Test**

### **Logs de Succès**
```
✅ Configuration SMTP valide
📧 URL de l'application: https://votre-app.vercel.app
🔧 Host SMTP: smtp.gmail.com
📤 Port SMTP: 587
👤 Utilisateur SMTP: app@gmail.com
📨 Expéditeur: app@gmail.com

✅ Test d'import de masse terminé: 3 utilisateurs créés, 3 emails envoyés
📊 Résumé: Total: 3, Créés: 3, Emails Envoyés: 3, Ignorés: 0, Erreurs: 0
```

### **Logs d'Erreur**
```
❌ Erreur: Configuration SMTP invalide
🔍 Vérifiez les paramètres SMTP dans les variables d'environnement

❌ Erreur: Utilisateur déjà existant
⚠️ L'utilisateur test1@example.com existe déjà en base
```

## 🎉 **Validation du Test**

Le test est réussi si :
- ✅ 3 utilisateurs sont créés en base
- ✅ 3 emails sont envoyés avec succès
- ✅ Les emails contiennent les bonnes informations
- ✅ Les liens de connexion pointent vers la bonne URL
- ✅ Aucune erreur dans les logs

## 🔄 **Nettoyage Post-Test**

Après le test, vous pouvez supprimer les utilisateurs de test :

```sql
-- Supprimer les utilisateurs de test
DELETE FROM "UserProformaCost" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE 'test%@example.com'
);
DELETE FROM "User" WHERE email LIKE 'test%@example.com';
```

Ou via l'interface admin de l'application.
