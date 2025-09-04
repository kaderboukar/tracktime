"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  DocumentTextIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SignatureData {
  userId: number;
  userName: string;
  year: number;
  semester: string;
  signatureStatus: string;
  expiresAt: string;
}

function TimesheetSignatureContent() {
  const searchParams = useSearchParams();
  const signatureToken = searchParams.get('token');
  
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);

  useEffect(() => {
    if (!signatureToken) {
      setError("Token de signature manquant");
      setLoading(false);
      return;
    }

    const fetchSignatureData = async () => {
      try {
        const response = await fetch(`/api/timesheet/signature-data?token=${signatureToken}`);
        const result = await response.json();

        if (result.success) {
          setSignatureData(result.data);
        } else {
          setError(result.message);
        }
      } catch {
        setError("Erreur lors de la récupération des informations");
      } finally {
        setLoading(false);
      }
    };

    fetchSignatureData();
  }, [signatureToken]);

  const handleElectronicSignature = async () => {
    if (!signatureData || !signatureToken) return;

    setIsSigning(true);
    try {
      const response = await fetch('/api/timesheet/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatureToken
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSignatureComplete(true);
        toast.success("Feuille de temps signée avec succès !");
      } else {
        toast.error(result.message || "Erreur lors de la signature");
      }
    } catch (error) {
      console.error("Erreur lors de la signature:", error);
      toast.error("Erreur lors de la signature");
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des informations de signature...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur de Signature</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                Ce lien de signature n&apos;est pas valide ou a expiré. 
                Veuillez contacter votre administrateur.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (signatureComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Signature Réussie !</h1>
            <p className="text-gray-600 mb-6">
              Votre feuille de temps a été signée électroniquement avec succès.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">
                <strong>Utilisateur :</strong> {signatureData?.userName}<br/>
                <strong>Période :</strong> {signatureData?.year} - {signatureData?.semester}<br/>
                <strong>Date de signature :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Ouvrir le PDF signé dans un nouvel onglet
                  window.open(`/api/timesheet/sign?token=${signatureToken}`, '_blank');
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Voir le PDF Signé
              </button>
              
              <button
                onClick={() => {
                  // Télécharger le PDF signé
                  const link = document.createElement('a');
                  link.href = `/api/timesheet/sign?token=${signatureToken}`;
                  link.download = `feuille_temps_signee_${signatureData?.userName}_${signatureData?.year}_${signatureData?.semester}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg
                         hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger le PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!signatureData) {
    return null;
  }

  const isExpired = new Date(signatureData.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <ClockIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Lien Expiré</h1>
            <p className="text-gray-600 mb-6">
              Ce lien de signature a expiré le {new Date(signatureData.expiresAt).toLocaleDateString('fr-FR')}.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700">
                Veuillez contacter votre administrateur pour obtenir un nouveau lien de signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        
        {/* En-tête simple */}
        <div className="text-center mb-8">
          <DocumentTextIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signature Électronique</h1>
          <p className="text-gray-600">Feuille de temps - {signatureData.year} {signatureData.semester}</p>
        </div>

        {/* Informations essentielles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nom:</span>
              <p className="font-medium text-gray-900">{signatureData.userName}</p>
            </div>
            <div>
              <span className="text-gray-500">Période:</span>
              <p className="font-medium text-gray-900">{signatureData.year} - {signatureData.semester}</p>
            </div>
            <div>
              <span className="text-gray-500">Expire le:</span>
              <p className="font-medium text-gray-900">{new Date(signatureData.expiresAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <span className="text-gray-500">Statut:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                En attente
              </span>
            </div>
          </div>
        </div>

        {/* Instructions simples */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions</h3>
              <p className="text-sm text-blue-800">
                Vérifiez les informations ci-dessus et cliquez sur &quot;Signer&quot; pour valider votre feuille de temps.
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de signature */}
        <div className="text-center">
          <button
            onClick={handleElectronicSignature}
            disabled={isSigning}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200 font-medium"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            {isSigning ? 'Signature en cours...' : 'Signer Électroniquement'}
          </button>
          
          {isSigning && (
            <div className="mt-3 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-1"></div>
              Traitement en cours...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimesheetSignaturePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <TimesheetSignatureContent />
    </Suspense>
  );
}
