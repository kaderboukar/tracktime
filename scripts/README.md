# 🧪 Scripts de Test du Système d'Alertes par Email

Ce dossier contient des scripts pour tester et valider le système d'envoi d'alertes par email optimisé.

## 📁 Scripts Disponibles

### 1. **`test-alert-system.js`** - Test de base du système
Teste le système d'alertes avec des données réelles de la base.

```bash
# Test basique
node scripts/test-alert-system.js

# Test avec configuration personnalisée
API_BASE_URL=http://localhost:3000 ADMIN_TOKEN=your-token node scripts/test-alert-system.js
```

### 2. **`test-alert-scenarios.js`** - Test des différents scénarios
Teste le système avec différents scénarios d'alertes selon l'état actuel.

```bash
# Test des scénarios
node scripts/test-alert-scenarios.js

# Test sur serveur distant
API_BASE_URL=https://your-server.com ADMIN_TOKEN=your-token node scripts/test-alert-scenarios.js
```

### 3. **`force-test-alerts.js`** - Test forcé avec modification de la base
⚠️ **ATTENTION** : Ce script peut modifier la base de données. Utilisez uniquement en environnement de test !

```bash
# Test sécurisé (lecture seule)
node scripts/force-test-alerts.js

# Test avec modification de la base (ENVIRONNEMENT DE TEST UNIQUEMENT)
ENABLE_DB_MODIFICATION=true ADMIN_TOKEN=your-token node scripts/force-test-alerts.js
```

### 4. **`test-bulk-email-alerts.js`** - Test d'envoi en masse
Teste l'envoi d'emails à un grand nombre d'utilisateurs (jusqu'à 130+).

```bash
# Test avec 50 utilisateurs
TEST_USERS=50 node scripts/test-bulk-email-alerts.js

# Test avec 130 utilisateurs
TEST_USERS=130 node scripts/test-bulk-email-alerts.js

# Test sur serveur distant
API_BASE_URL=https://your-server.com TEST_USERS=100 node scripts/test-bulk-email-alerts.js
```

## ⚙️ Configuration

### Variables d'Environnement

```bash
# URL de l'API
API_BASE_URL=http://localhost:3000

# Token d'authentification admin
ADMIN_TOKEN=your-admin-token-here

# Nombre d'utilisateurs pour les tests en masse
TEST_USERS=50

# Activer la modification de la base (UNIQUEMENT EN TEST)
ENABLE_DB_MODIFICATION=true
```

### Fichier de Configuration

Créez un fichier `.env` dans le dossier `scripts/` :

```bash
# scripts/.env
API_BASE_URL=http://localhost:3000
ADMIN_TOKEN=your-admin-token-here
TEST_USERS=100
ENABLE_DB_MODIFICATION=false
```

## 🚀 Utilisation

### Test Rapide du Système

```bash
# 1. Vérifier que le serveur fonctionne
curl -X GET "http://localhost:3000/api/admin/time-entry-alerts/check" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Tester le système d'alertes
node scripts/test-alert-system.js

# 3. Analyser les scénarios
node scripts/test-alert-scenarios.js
```

### Test Complet avec Données Réelles

```bash
# 1. Test de base
node scripts/test-alert-system.js

# 2. Test des scénarios
node scripts/test-alert-scenarios.js

# 3. Test d'envoi en masse (si nécessaire)
TEST_USERS=130 node scripts/test-bulk-email-alerts.js
```

### Test de Performance

```bash
# Test avec différents volumes
for users in 10 50 100 130; do
  echo "Testing with $users users..."
  TEST_USERS=$users node scripts/test-bulk-email-alerts.js
  echo "---"
  sleep 5
done
```

## 📊 Interprétation des Résultats

### ✅ **Système Fonctionnel**
```
🚀 Début de l'envoi des alertes par batch. Total: 19 utilisateurs
⚙️ Configuration: batchSize=10, délai entre batches=3000ms
📦 Traitement du batch 1/2 (10 utilisateurs)
✅ Envoi terminé en 45000ms
📊 Métriques: Succès: 19, Échecs: 0, Taux: 100%
```

### ⚠️ **Aucun Email à Envoyer (Normal)**
```
19 utilisateurs STAFF sans entrées de temps
0 utilisateurs à alerter pour FIRST_REMINDER
🚀 Début de l'envoi des alertes par batch. Total: 0 utilisateurs
✅ Envoi terminé en 0ms
📊 Métriques: Succès: 0, Échecs: 0, Taux: 0%
```

### 🚨 **Problème Détecté**
```
❌ Échec de l'envoi de l'alerte à user@example.com - Timeout
🚨 TAUX DE SUCCÈS CRITIQUE: 45% (seuil: 70%)
```

## 🔍 Dépannage

### Problème : Aucun email envoyé

**Cause probable** : Tous les utilisateurs ont déjà reçu cette alerte

**Solution** :
```bash
# Vérifier l'état des alertes
curl -X GET "http://localhost:3000/api/admin/time-entry-alerts/check" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Analyser les scénarios
node scripts/test-alert-scenarios.js
```

### Problème : Erreurs d'envoi

**Cause probable** : Configuration SMTP incorrecte

**Solution** :
```bash
# Vérifier la configuration email
node -e "require('../src/lib/email').testEmailConfiguration()"

# Vérifier les variables d'environnement
echo $SMTP_HOST $SMTP_PORT $SMTP_USER
```

### Problème : Performance lente

**Cause probable** : Délais trop longs entre batches

**Solution** :
```bash
# Ajuster la configuration dans src/lib/email-config.ts
# Réduire delayBetweenBatches et delayBetweenEmails
```

## 📈 Métriques de Performance

### Temps d'Exécution Attendus

| Utilisateurs | Temps Estimé | Configuration Batch |
|--------------|---------------|-------------------|
| 10-50       | 15-30s       | 20 emails, 1s délai |
| 50-100      | 45-90s       | 15 emails, 2s délai |
| 100-130     | 60-120s      | 10 emails, 3s délai |

### Seuils d'Alerte

- **⚠️ Avertissement** : Taux de succès < 85%
- **🚨 Critique** : Taux de succès < 70%
- **🚨 Échecs élevés** : Plus de 20 emails échoués

## 🎯 Bonnes Pratiques

### 1. **Tests Réguliers**
- Tester le système au moins une fois par semaine
- Vérifier les métriques de performance
- Surveiller les taux de succès

### 2. **Environnement de Test**
- Utiliser une base de données de test
- Ne jamais activer `ENABLE_DB_MODIFICATION=true` en production
- Tester avec des volumes réalistes

### 3. **Monitoring**
- Surveiller les logs du serveur
- Vérifier les métriques de performance
- Alerter en cas de taux de succès faible

## 🚨 Sécurité

### ⚠️ **IMPORTANT**
- **NE JAMAIS** utiliser `ENABLE_DB_MODIFICATION=true` en production
- **NE JAMAIS** partager les tokens d'authentification
- **TOUJOURS** tester sur une base de données de test

### 🔒 **Protection**
- Les scripts vérifient l'authentification
- Aucune modification de la base sans autorisation explicite
- Logs détaillés pour audit et traçabilité

---

**Note** : Ces scripts sont conçus pour tester et valider le système d'alertes. Utilisez-les avec précaution et uniquement dans des environnements appropriés.
