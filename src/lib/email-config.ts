// Configuration pour l'envoi d'emails en masse
export const EMAIL_BULK_CONFIG = {
  // Configuration des batches
  batchSize: 15,               // Nombre d'emails par batch (optimisé pour 130+ utilisateurs)
  delayBetweenBatches: 2000,   // Délai de 2 secondes entre les batches
  delayBetweenEmails: 300,     // Délai de 0.3 seconde entre chaque email
  
  // Configuration des retry
  maxRetries: 3,               // Nombre maximum de tentatives
  retryDelay: 3000,            // Délai de 3 secondes avant retry
  
  // Configuration des timeouts
  emailTimeout: 30000,         // Timeout de 30 secondes par email
  batchTimeout: 300000,        // Timeout de 5 minutes par batch
  
  // Configuration des limites
  maxEmailsPerHour: 1000,      // Limite de 1000 emails par heure
  maxEmailsPerDay: 10000,      // Limite de 10000 emails par jour
  
  // Configuration des notifications
  enableProgressLogging: true,  // Activer les logs de progression
  enableErrorReporting: true,   // Activer le reporting d'erreurs
  enableSuccessMetrics: true,   // Activer les métriques de succès
};

// Configuration des délais adaptatifs selon le volume
export const getAdaptiveDelays = (totalUsers: number) => {
  if (totalUsers <= 50) {
    return {
      batchSize: 20,
      delayBetweenBatches: 1000,
      delayBetweenEmails: 200
    };
  } else if (totalUsers <= 100) {
    return {
      batchSize: 15,
      delayBetweenBatches: 2000,
      delayBetweenEmails: 300
    };
  } else {
    return {
      batchSize: 10,
      delayBetweenBatches: 3000,
      delayBetweenEmails: 500
    };
  }
};

// Configuration des seuils d'alerte
export const ALERT_THRESHOLDS = {
  warningSuccessRate: 85,       // Avertissement si taux de succès < 85%
  criticalSuccessRate: 70,      // Critique si taux de succès < 70%
  maxFailedEmails: 20,          // Maximum d'emails échoués avant alerte
  maxRetryAttempts: 5,          // Maximum de tentatives de retry
};

// Types pour la configuration
export interface EmailBatchConfig {
  batchSize: number;
  delayBetweenBatches: number;
  delayBetweenEmails: number;
  maxRetries: number;
  retryDelay: number;
}

export interface EmailMetrics {
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  successRate: number;
  averageTimePerEmail: number;
  totalTime: number;
}
