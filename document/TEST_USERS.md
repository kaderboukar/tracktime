# 👥 Utilisateurs de Test

## 🔐 Comptes Disponibles

### 1. **Administrateur**
- **Email** : `admin@undp.org`
- **Mot de passe** : `Admin@123`
- **Rôle** : `ADMIN`
- **Grade** : `G7`
- **Indice** : `ADMIN001`
- **Accès** : Toutes les fonctionnalités

### 2. **PMSU User**
- **Email** : `pmsu@undp.org`
- **Mot de passe** : `Pmsu@123`
- **Rôle** : `PMSU`
- **Grade** : `G6`
- **Indice** : `PMSU001`
- **Accès** : Fonctionnalités PMSU

### 3. **Staff User (Nouveau)** ⭐
- **Email** : `staff@undp.org`
- **Mot de passe** : `Staff@123`
- **Rôle** : `STAFF`
- **Grade** : `G5`
- **Indice** : `STAFF001`
- **Nom** : `John Doe`
- **Type** : `OPERATION`
- **Coût Proforma 2025** : `75,000 USD`

## 📊 Données de Test pour l'Utilisateur STAFF

### **Projets Assignés**
1. **Projet Développement Durable**
   - **Numéro** : `PROJ001`
   - **Type** : `Programme`
   - **Allocation** : `60%`
   - **Accès** : `ALL`

2. **Initiative Climat**
   - **Numéro** : `PROJ002`
   - **Type** : `Opération`
   - **Allocation** : `40%`
   - **Accès** : `OPERATION`

### **Activités Disponibles**
1. **Gestion de Projet** (Parent)
   - Planification (Enfant)
   - Suivi et Évaluation (Enfant)

2. **Recherche et Développement** (Parent)
   - Analyse de Données (Enfant)

3. **Programme Activities** (Parent)
4. **Development Effectiveness Activities** (Parent)
5. **Agency Services** (Parent)
6. **Management Activities** (Parent)

### **Entrées de Temps Existantes**
1. **Analyse des données climatiques**
   - **Projet** : Initiative Climat
   - **Activité** : Management Activities
   - **Heures** : `18h`
   - **Statut** : `APPROVED`
   - **Semestre** : `S1 2025`

2. **Suivi des indicateurs de performance**
   - **Projet** : Projet Développement Durable
   - **Activité** : Development Effectiveness Activities
   - **Heures** : `32h`
   - **Statut** : `PENDING`
   - **Semestre** : `S1 2025`

## 🎯 Test du Dashboard STAFF

### **Métriques Attendues**
- **Total Heures S1 2025** : `50h` (18h + 32h)
- **Entrées Créées** : `2`
- **Coût Généré** : `~3,906 USD` (basé sur 75,000/2/480*50)
- **Objectif Atteint** : `10.4%` (50h/480h)
- **Moyenne/Entrée** : `25h`
- **Projets Actifs** : `2`

### **Fonctionnalités à Tester**
1. ✅ **Connexion** avec `staff@undp.org` / `Staff@123`
2. ✅ **Dashboard Personnel** avec statistiques enrichies
3. ✅ **Feuille de Temps** avec filtres et export PDF
4. ✅ **Graphique de Progression** mensuelle
5. ✅ **Modal d'Ajout** d'entrée de temps complet
6. ✅ **Calculs de Coûts** automatiques

## 🔧 Commandes Utiles

### **Réinitialiser les Données**
```bash
npx prisma db seed
```

### **Ajouter Plus de Données de Test**
```bash
# Vous pouvez modifier prisma/seed.ts et relancer
npx prisma db seed
```

### **Vérifier la Base de Données**
```bash
npx prisma studio
```

## 📝 Notes Importantes

### **Sécurité**
- ⚠️ Ces comptes sont uniquement pour les tests
- 🔒 Changez les mots de passe en production
- 🚫 Ne pas utiliser en environnement de production

### **Données**
- 📊 Les données sont créées automatiquement
- 🔄 Relancer le seed écrase les données existantes
- 💾 Les IDs peuvent changer entre les exécutions

### **Calculs**
- **Coût Horaire** : `Coût Proforma / 2 / 480h`
- **Coût Semestriel** : `75,000 / 2 = 37,500 USD`
- **Coût Horaire** : `37,500 / 480 = 78.125 USD/h`

## 🎉 Validation

### **Checklist de Test**
- [ ] Connexion réussie avec le compte STAFF
- [ ] Affichage des 3 cartes d'information personnelles
- [ ] Statistiques personnelles avec 6 métriques
- [ ] Feuille de temps avec données filtrées
- [ ] Export PDF fonctionnel
- [ ] Graphique de progression affiché
- [ ] Modal d'ajout d'entrée complet
- [ ] Calculs de coûts corrects
- [ ] Responsive design sur mobile/desktop

### **Résultats Attendus**
- ✅ Interface riche et personnalisée pour STAFF
- ✅ Données cohérentes et calculs précis
- ✅ Fonctionnalités complètes sans accès admin
- ✅ Performance fluide et design moderne

---

**🚀 Prêt pour les Tests !**

Vous pouvez maintenant tester toutes les nouvelles fonctionnalités du dashboard enrichi avec l'utilisateur STAFF `staff@undp.org`.
