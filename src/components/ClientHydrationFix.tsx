'use client';

import { useEffect } from 'react';

export default function ClientHydrationFix() {
  useEffect(() => {
    // Nettoyer les attributs ajoutés par les extensions de navigateur
    // qui peuvent causer des erreurs d'hydratation SSR
    const cleanupBrowserExtensionAttributes = () => {
      const body = document.body;
      
      // Liste des attributs couramment ajoutés par les extensions
      const extensionAttributes = [
        'cz-shortcut-listen',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'spellcheck',
        'data-gramm',
        'data-gramm_editor',
        'data-enable-grammarly'
      ];
      
      extensionAttributes.forEach(attr => {
        if (body.hasAttribute(attr)) {
          body.removeAttribute(attr);
        }
      });
      
      // Nettoyer aussi sur l'élément html
      const html = document.documentElement;
      extensionAttributes.forEach(attr => {
        if (html.hasAttribute(attr)) {
          html.removeAttribute(attr);
        }
      });
    };

    // Exécuter immédiatement
    cleanupBrowserExtensionAttributes();
    
    // Exécuter après un délai pour les extensions qui ajoutent des attributs plus tard
    const timeoutId = setTimeout(cleanupBrowserExtensionAttributes, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
