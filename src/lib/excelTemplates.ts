import * as XLSX from 'xlsx';

/**
 * Génère un fichier Excel template pour l'import d'utilisateurs
 */
export function generateUserImportTemplate(): void {
  // Données d'exemple
  const templateData = [
    // En-têtes
    [
      'email',
      'password',
      'name',
      'indice',
      'grade',
      'type',
      'role',
      'year1',
      'cost1',
      'year2',
      'cost2'
    ],
    // Exemples de données
    [
      'john.doe@example.com',
      'motdepasse123',
      'John Doe',
      'P4',
      'G5',
      'OPERATION',
      'STAFF',
      2024,
      75000,
      2025,
      78000
    ],
    [
      'jane.smith@example.com',
      'password456',
      'Jane Smith',
      'P3',
      'G4',
      'PROGRAMME',
      'MANAGEMENT',
      2024,
      65000,
      2025,
      67000
    ],
    [
      'admin@example.com',
      'admin123',
      'Administrateur',
      'P5',
      'G6',
      'SUPPORT',
      'ADMIN',
      2024,
      85000,
      2025,
      88000
    ]
  ];

  // Créer un nouveau workbook
  const workbook = XLSX.utils.book_new();

  // Créer une feuille de calcul
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // Définir la largeur des colonnes
  const columnWidths = [
    { wch: 25 }, // email
    { wch: 15 }, // password
    { wch: 20 }, // name
    { wch: 10 }, // indice
    { wch: 10 }, // grade
    { wch: 12 }, // type
    { wch: 12 }, // role
    { wch: 8 },  // year1
    { wch: 10 }, // cost1
    { wch: 8 },  // year2
    { wch: 10 }  // cost2
  ];

  worksheet['!cols'] = columnWidths;

  // Ajouter des styles aux en-têtes (si supporté)
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:K1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;

    // Style pour les en-têtes
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } }
    };
  }

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Utilisateurs');

  // Ajouter une feuille d'instructions
  const instructionsData = [
    ['INSTRUCTIONS POUR L\'IMPORT D\'UTILISATEURS'],
    [''],
    ['Format requis:'],
    ['- email: Adresse email unique de l\'utilisateur'],
    ['- password: Mot de passe (optionnel, par défaut: time2025trackingNiger)'],
    ['- name: Nom complet de l\'utilisateur'],
    ['- indice: Indice de l\'utilisateur (ex: P4, P3, etc.)'],
    ['- grade: Grade de l\'utilisateur (ex: G5, G4, etc.)'],
    ['- type: Type d\'utilisateur (OPERATION, PROGRAMME, SUPPORT)'],
    ['- role: Rôle de l\'utilisateur (ADMIN, PMSU, MANAGEMENT, STAFF)'],
    ['- year1, cost1: Année et coût proforma (optionnel)'],
    ['- year2, cost2: Année et coût proforma supplémentaire (optionnel)'],
    [''],
    ['Notes importantes:'],
    ['- L\'email doit être unique'],
    ['- Les champs email et name sont obligatoires'],
    ['- Les types valides: OPERATION, PROGRAMME, SUPPORT'],
    ['- Les rôles valides: ADMIN, PMSU, MANAGEMENT, STAFF'],
    ['- Vous pouvez ajouter plus de colonnes year/cost (year3, cost3, etc.)'],
    ['- Les lignes vides seront ignorées'],
    [''],
    ['Exemple de données dans la feuille "Utilisateurs"']
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);

  // Largeur des colonnes pour les instructions
  instructionsSheet['!cols'] = [{ wch: 60 }];

  // Style pour le titre
  if (instructionsSheet['A1']) {
    instructionsSheet['A1'].s = {
      font: { bold: true, size: 14 },
      fill: { fgColor: { rgb: "4472C4" } }
    };
  }

  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Télécharger le fichier
  XLSX.writeFile(workbook, 'template_import_utilisateurs.xlsx');
}

/**
 * Valide les données d'un fichier Excel d'import d'utilisateurs
 */
export function validateUserImportData(data: unknown[][]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || data.length === 0) {
    errors.push('Le fichier est vide');
    return { isValid: false, errors, warnings };
  }

  if (data.length < 2) {
    errors.push('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
    return { isValid: false, errors, warnings };
  }

  const headers = data[0] as string[];
  const requiredHeaders = ['email', 'name'];
  const validTypes = ['OPERATION', 'PROGRAMME', 'SUPPORT'];
  const validRoles = ['ADMIN', 'PMSU', 'MANAGEMENT', 'STAFF'];

  // Vérifier les en-têtes requis
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      errors.push(`Colonne requise manquante: ${header}`);
    }
  }

  // Vérifier les données
  const rows = data.slice(1);
  const emails = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 car on commence à la ligne 2 (après l'en-tête)
    const rowData: Record<string, unknown> = {};

    headers.forEach((header, headerIndex) => {
      rowData[header] = row[headerIndex];
    });

    // Vérifier l'email
    const email = String(rowData.email || "");
    if (!email) {
      errors.push(`Ligne ${rowNumber}: Email requis`);
    } else if (emails.has(email)) {
      errors.push(`Ligne ${rowNumber}: Email en double: ${email}`);
    } else {
      emails.add(email);
    }

    // Vérifier le nom
    const name = String(rowData.name || "");
    if (!name) {
      errors.push(`Ligne ${rowNumber}: Nom requis`);
    }

    // Vérifier le type
    const type = String(rowData.type || "");
    if (type && !validTypes.includes(type.toUpperCase())) {
      warnings.push(`Ligne ${rowNumber}: Type invalide "${type}". Types valides: ${validTypes.join(', ')}`);
    }

    // Vérifier le rôle
    const role = String(rowData.role || "");
    if (role && !validRoles.includes(role.toUpperCase())) {
      warnings.push(`Ligne ${rowNumber}: Rôle invalide "${role}". Rôles valides: ${validRoles.join(', ')}`);
    }

    // Vérifier les coûts proforma
    Object.keys(rowData).forEach(key => {
      if (key.startsWith('year') && rowData[key]) {
        const yearIndex = key.replace('year', '');
        const costKey = `cost${yearIndex}`;
        const costValue = String(rowData[costKey] || "");

        if (!costValue) {
          warnings.push(`Ligne ${rowNumber}: Coût manquant pour ${key}`);
        } else if (isNaN(parseFloat(costValue))) {
          warnings.push(`Ligne ${rowNumber}: Coût invalide pour ${key}: ${costValue}`);
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Convertit les données Excel en format attendu par l'API
 */
export function convertExcelDataToUsers(data: unknown[][]): unknown[] {
  if (data.length < 2) return [];

  const headers = data[0] as string[];
  const rows = data.slice(1);

  return rows.map(row => {
    const rowData: Record<string, unknown> = {};
    headers.forEach((header, headerIndex) => {
      rowData[header] = (row as unknown[])[headerIndex];
    });

    // Extraire les coûts proforma
    const proformaCosts: Array<{ year: number; cost: number }> = [];
    Object.entries(rowData).forEach(([key, value]) => {
      if (key.startsWith('year') && value) {
        const yearIndex = key.replace('year', '');
        const costValue = rowData[`cost${yearIndex}`];
        if (costValue) {
          proformaCosts.push({
            year: parseInt(value as string),
            cost: parseFloat(costValue as string)
          });
        }
      }
    });

    return {
      email: String(rowData.email || ""),
      password: String(rowData.password || "time2025trackingNiger"),
      name: String(rowData.name || ""),
      indice: String(rowData.indice || ""),
      grade: String(rowData.grade || ""),
      type: String(rowData.type || "OPERATION").toUpperCase(),
      role: String(rowData.role || "STAFF").toUpperCase(),
      proformaCosts
    };
  }).filter(user => user.email && user.name);
}
