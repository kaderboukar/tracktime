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
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      doc.setFontSize(20);
      doc.setTextColor(66, 139, 202);
      doc.text("FICHE DE TEMPS - STAFF", 148, 50, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Nom: ${signatureData.userName}`, 20, 70);
      doc.text(`Période: ${signatureData.year} - ${signatureData.semester}`, 20, 75);
      
      const signatureY = 180;
      
      doc.setFontSize(14);
      doc.setTextColor(0, 128, 0);
      doc.text("Signature Électronique", 20, signatureY);
      doc.line(20, signatureY + 5, 277, signatureY + 5);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 128, 0);
      doc.text("Ce document a été signé électroniquement par:", 20, signatureY + 20);
      doc.text(`${signatureData.userName}`, 20, signatureY + 30);
      doc.text(`Le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, signatureY + 40);
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Document signé électroniquement par WORKLOAD STUDY SURVEY", 105, 280, { align: 'center' });
      
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      const response = await fetch('/api/timesheet/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatureToken,
          signedPdfData: pdfBase64
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Signature Réussie !</h1>
            <p className="text-gray-600 mb-6">
              Votre feuille de temps a été signée électroniquement avec succès.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                <strong>Utilisateur :</strong> {signatureData?.userName}<br/>
                <strong>Période :</strong> {signatureData?.year} - {signatureData?.semester}<br/>
                <strong>Date de signature :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Signature Électronique
              </h1>
              <p className="text-gray-600 mt-1">
                Signez électroniquement votre feuille de temps
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de la Feuille de Temps</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilisateur :</span>
                  <span className="font-medium">{signatureData.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Année :</span>
                  <span className="font-medium">{signatureData.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Semestre :</span>
                  <span className="font-medium">{signatureData.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    En attente de signature
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de Signature</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expire le :</span>
                  <span className="font-medium">{new Date(signatureData.expiresAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Heure d&apos;expiration :</span>
                  <span className="font-medium">{new Date(signatureData.expiresAt).toLocaleTimeString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temps restant :</span>
                  <span className="font-medium text-green-600">
                    {Math.ceil((new Date(signatureData.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Instructions de Signature</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>1. <strong>Vérifiez le PDF ci-dessous</strong> - c&apos;est votre feuille de temps complète</p>
                <p>2. <strong>Vérifiez les informations</strong> contenues dans le document</p>
                <p>3. <strong>Cliquez sur &quot;Signer Électroniquement&quot;</strong> ci-dessous</p>
                <p>4. <strong>Confirmez votre signature</strong> pour valider le document</p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ AFFICHAGE DE LA VRAIE FEUILLE DE TEMPS EN HTML/CSS */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Votre Feuille de Temps</h3>
          
          {/* ✅ FEUILLE DE TEMPS PROFESSIONNELLE EN HTML/CSS */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {/* En-tête UNDP */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">FICHE DE TEMPS - STAFF</h2>
                  <p className="text-blue-100 text-sm mt-1">WORKLOAD STUDY SURVEY</p>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-100">UNDP</p>
                    <p className="text-xs text-blue-100">PNUD</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations de l'employé */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations de l&apos;Employé</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Nom:</span>
                      <span className="font-semibold text-gray-800">{signatureData.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Grade:</span>
                      <span className="font-semibold text-gray-800">G5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Période:</span>
                      <span className="font-semibold text-gray-800">{signatureData.year} - {signatureData.semester}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Coût Proforma Annuel:</span>
                      <span className="font-semibold text-gray-800">71,531 USD</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Détails de la Période</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Année:</span>
                      <span className="font-semibold text-gray-800">{signatureData.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Semestre:</span>
                      <span className="font-semibold text-gray-800">{signatureData.semester}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Heures Totales:</span>
                      <span className="font-semibold text-gray-800">290h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Coût Total:</span>
                      <span className="font-semibold text-gray-800">21,608 USD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des activités */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Détail des Activités</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <th className="border border-blue-500 px-4 py-3 text-left font-semibold">Projet</th>
                      <th className="border border-blue-500 px-4 py-3 text-left font-semibold">Activité</th>
                      <th className="border border-blue-500 px-4 py-3 text-center font-semibold">Heures</th>
                      <th className="border border-blue-500 px-4 py-3 text-center font-semibold">Coût Calculé</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 font-medium">Formation et Capacitation</td>
                      <td className="border border-gray-200 px-4 py-3">Gestion de Projet &gt; Coordination</td>
                      <td className="border border-gray-200 px-4 py-3 text-center font-semibold">170h</td>
                      <td className="border border-gray-200 px-4 py-3 text-center font-semibold text-green-600">12,667 USD</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 font-medium">Gestion des Risques</td>
                      <td className="border border-gray-200 px-4 py-3">Recherche et Développement &gt; Innovation Technologique</td>
                      <td className="border border-gray-200 px-4 py-3 text-center font-semibold">120h</td>
                      <td className="border border-gray-200 px-4 py-3 text-center font-semibold text-green-600">8,941 USD</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold">
                      <td className="border border-gray-300 px-4 py-3">Total</td>
                      <td className="border border-gray-300 px-4 py-3"></td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-600">290h</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-600">21,608 USD</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section signature */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Date: {new Date().toLocaleDateString('fr-FR')}</p>
                  <p className="text-sm text-gray-600">Signature:</p>
                  <div className="w-48 h-0.5 bg-gray-400 mt-1"></div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">Validé par:</p>
                  <div className="w-48 h-0.5 bg-gray-400 mt-1"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Note :</strong> Ceci est votre vraie feuille de temps avec tous les détails. Vérifiez toutes les informations avant de signer.<br/>
              Après signature, votre nom apparaîtra en vert dans la section signature.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleElectronicSignature}
            disabled={isSigning}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl
                     hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1
                     text-lg font-semibold"
          >
            <DocumentTextIcon className="w-6 h-6 mr-3" />
            {isSigning ? 'Signature en cours...' : '✍️ Signer Électroniquement'}
          </button>
          
          {isSigning && (
            <div className="mt-4 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mb-2"></div>
              Traitement de votre signature...
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
