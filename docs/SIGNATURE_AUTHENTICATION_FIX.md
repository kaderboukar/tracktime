# Correction de l'Authentification pour la Signature de Feuille de Temps

## Problème Identifié

Lorsque le staff reçoit l'email de signature de la feuille de temps et clique sur le bouton "Signer", une erreur "Format d'authentification invalide" s'affiche.

### Cause Racine

Le problème vient du fait que l'API de signature (`/api/timesheet/sign`) utilise la fonction `authenticate()` qui vérifie uniquement les tokens JWT dans le header `Authorization: Bearer <token>`. Cependant, quand le staff arrive via le lien de l'email, il n'est pas connecté et n'a pas de token JWT.

### Flux Problématique

1. **Email envoyé** → Lien vers `/timesheet/sign?token=<signatureToken>`
2. **Staff clique** → Arrive sur la page de signature
3. **Page fait appel API** → `/api/timesheet/sign?token=<signatureToken>`
4. **API vérifie auth** → `authenticate()` cherche `Authorization: Bearer <jwt>`
5. **Erreur** → "Format d'authentification invalide" car pas de JWT

## Solution Implémentée

### Double Authentification

L'API de signature accepte maintenant **deux méthodes d'authentification** :

1. **Authentification JWT standard** (pour les utilisateurs connectés)
2. **Authentification par token de signature** (pour les utilisateurs arrivant via email)

### Code Modifié

#### `src/app/api/timesheet/sign/route.ts`

```typescript
// Fonction pour authentifier via token de signature
async function authenticateViaSignatureToken(signatureToken: string) {
  try {
    const signedTimesheet = await prisma.signedTimesheet.findUnique({
      where: { signatureToken },
      include: { user: true }
    });

    if (!signedTimesheet || signedTimesheet.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: signedTimesheet.userId,
      role: signedTimesheet.user.role,
      signatureToken: signedTimesheet
    };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    let authResult;
    const { signatureToken, signedPdfData } = await request.json();

    // Essayer d'abord l'authentification JWT standard
    authResult = await authenticate(request);
    
    // Si l'authentification JWT échoue, essayer avec le token de signature
    if (authResult instanceof NextResponse) {
      if (authResult.status === 401) {
        // Essayer l'authentification via token de signature
        const signatureAuth = await authenticateViaSignatureToken(signatureToken);
        if (signatureAuth) {
          authResult = signatureAuth;
        } else {
          return NextResponse.json(
            { success: false, message: "Token de signature invalide ou expiré" },
            { status: 401 }
          );
        }
      } else {
        return authResult;
      }
    }

    // ... reste de la logique de signature
  } catch (error) {
    // ... gestion d'erreur
  }
}
```

## Avantages de la Solution

### Sécurité Maintenue
- **Double vérification** : JWT OU token de signature valide
- **Expiration** : Les tokens de signature expirent après 7 jours
- **Validation** : Vérification de l'existence et de la validité du token

### Flexibilité
- **Utilisateurs connectés** : Peuvent signer via l'interface normale
- **Utilisateurs non connectés** : Peuvent signer via le lien email
- **Rétrocompatibilité** : L'authentification JWT continue de fonctionner

### Maintenance
- **Code clair** : Logique d'authentification séparée et réutilisable
- **Tests** : Scripts de test pour valider le fonctionnement
- **Documentation** : Explication claire du problème et de la solution

## Tests de Validation

### Script de Test d'Authentification
```bash
node scripts/test-signature-auth.js
```

### Script de Test de l'API
```bash
node scripts/test-signature-api.js
```

## Utilisation

### Pour les Administrateurs
- Générer la feuille de temps normalement
- L'email sera envoyé automatiquement avec le lien de signature

### Pour le Staff
1. **Recevoir l'email** avec le lien de signature
2. **Cliquer sur le lien** → Redirection vers la page de signature
3. **Signer électroniquement** → Plus d'erreur d'authentification
4. **Confirmation** → Statut mis à jour en base de données

## Variables d'Environnement Requises

Assurez-vous que ces variables sont configurées pour l'envoi d'emails :

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
NEXT_PUBLIC_APP_URL=https://your-app.com
```

## Conclusion

Cette solution résout le problème d'authentification tout en maintenant la sécurité et la flexibilité du système. Le staff peut maintenant signer ses feuilles de temps directement depuis les liens reçus par email sans rencontrer d'erreurs d'authentification.
