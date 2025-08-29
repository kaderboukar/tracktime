// Templates d'emails pour les alertes d'entrées de temps manquantes

export interface AlertEmailData {
  userName: string;
  userEmail: string;
  year: number;
  semester: string;
  daysSinceActivation: number;
  periodName: string;
}

export interface ManagementAlertData {
  staffList: Array<{
    name: string;
    email: string;
    grade: string;
  }>;
  year: number;
  semester: string;
  daysSinceActivation: number;
  totalStaff: number;
  complianceRate: number;
}

// Jour 3 - Premier rappel (Gentil)
export function getFirstReminderEmail(data: AlertEmailData) {
  return {
    subject: `📝 Rappel - Saisie des entrées de temps`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">UNDP Digital Hub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Système de Gestion des Temps</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.userName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            La période <strong>${data.periodName}</strong> a été activée depuis ${data.daysSinceActivation} jours.
          </p>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            N'oubliez pas de saisir vos entrées de temps dans l'application.
          </p>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;">
              <strong>📅 Période concernée :</strong> ${data.periodName}<br>
              <strong>⏰ Délai :</strong> ${data.daysSinceActivation} jours depuis l'activation
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
            Merci de votre attention !
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Cordialement,<br>
              L'équipe UNDP Digital Hub
            </p>
          </div>
        </div>
      </div>
    `
  };
}

// Jour 7 - Deuxième rappel (Ferme) + Copie Management
export function getSecondReminderEmail(data: AlertEmailData) {
  return {
    subject: `⚠️ Rappel Important - Entrées de temps manquantes`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">UNDP Digital Hub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Système de Gestion des Temps</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.userName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Il y a maintenant <strong>${data.daysSinceActivation} jours</strong> que la période 
            <strong>${data.periodName}</strong> est active, mais vous n'avez pas encore saisi vos entrées de temps.
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ ACTION REQUISE :</strong><br>
              Veuillez procéder à la saisie de vos entrées de temps dès que possible.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
            Cette situation est maintenant suivie par le management.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Cordialement,<br>
              L'équipe UNDP Digital Hub
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            [Management en copie]
          </p>
        </div>
      </div>
    `
  };
}

// Jour 14 - Troisième rappel (Important) + Copie Management
export function getThirdReminderEmail(data: AlertEmailData) {
  return {
    subject: `URGENT - Entrées de temps non saisies`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">UNDP Digital Hub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Système de Gestion des Temps</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.userName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Cela fait <strong>${data.daysSinceActivation} jours</strong> que la période 
            <strong>${data.periodName}</strong> est active sans saisie de votre part.
          </p>
          
          <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>⚠️ ACTION REQUISE IMMÉDIATEMENT</strong><br>
              • Connectez-vous à l'application<br>
              • Saisissez vos entrées de temps<br>
              • Validez vos saisies
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
            Cette situation est maintenant suivie par le management.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Cordialement,<br>
              L'équipe UNDP Digital Hub
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            [Management en copie]
          </p>
        </div>
      </div>
    `
  };
}

// Jour 21 - Dernier rappel (Urgent) + Escalade Management
export function getFinalReminderEmail(data: AlertEmailData) {
  return {
    subject: `🚨 ESCALADE - Entrées de temps manquantes - Action immédiate requise`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d63031 0%, #e17055 100%); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">UNDP Digital Hub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Système de Gestion des Temps</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.userName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Cela fait maintenant <strong>${data.daysSinceActivation} jours</strong> que la période 
            <strong>${data.periodName}</strong> est active sans aucune saisie de votre part.
          </p>
          
          <div style="background: #f5c6cb; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>🚨 SITUATION CRITIQUE</strong><br>
              Cette situation a été escaladée au management pour suivi immédiat.
            </p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>ACTION REQUISE DANS LES 24H :</strong><br>
              • Saisie immédiate de vos entrées de temps<br>
              • Contact avec votre superviseur si difficultés
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Cordialement,<br>
              L'équipe UNDP Digital Hub
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            [Management - Escalade pour action immédiate]
          </p>
        </div>
      </div>
    `
  };
}

// Email au Management
export function getManagementAlertEmail(data: ManagementAlertData) {
  const staffListHtml = data.staffList.map(staff => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${staff.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${staff.email}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${staff.grade}</td>
    </tr>`
  ).join('');

  return {
    subject: `📊 RAPPORT - Entrées de temps manquantes - Jour ${data.daysSinceActivation}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">UNDP Digital Hub</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Rapport d'Alertes - Entrées de Temps</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Bonjour Management,</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Voici le rapport des entrées de temps manquantes pour la période 
            <strong>${data.year} - ${data.semester}</strong> :
          </p>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;">
              <strong>📊 STAFF sans entrées (depuis ${data.daysSinceActivation} jours) :</strong> ${data.totalStaff} personnes
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Nom</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Email</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${staffListHtml}
              </tbody>
            </table>
          </div>
          
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              <strong>📈 Statistiques :</strong><br>
              • Période : ${data.year} - ${data.semester}<br>
              • Délai depuis activation : ${data.daysSinceActivation} jours<br>
              • Taux de conformité : ${data.complianceRate}%
            </p>
          </div>
          
          ${data.daysSinceActivation >= 21 ? `
          <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>🚨 ACTION REQUISE :</strong><br>
              Intervention immédiate requise pour ces collaborateurs.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Cordialement,<br>
              Système d'alertes UNDP Digital Hub
            </p>
          </div>
        </div>
      </div>
    `
  };
}
