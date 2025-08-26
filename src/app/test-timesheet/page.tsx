"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface TestUser {
  id: number;
  name: string;
  email: string;
  role: string;
  hasProformaCost: boolean;
}

interface SMTPConfig {
  host: string;
  port: string;
  user: string;
  from: string;
}

export default function TestTimesheetPage() {
  const [testUser, setTestUser] = useState<TestUser | null>(null);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState<'S1' | 'S2'>('S1');

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Veuillez vous connecter d'abord");
        return;
      }

      const response = await fetch('/api/test-timesheet-email', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setTestUser(data.data.testUser);
        setSmtpConfig(data.data.smtp);
        toast.success("Configuration SMTP valide");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      toast.error("Erreur lors de la vérification de la configuration");
    }
  };

  const sendTestEmail = async () => {
    if (!testUser) {
      toast.error("Aucun utilisateur de test disponible");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/test-timesheet-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: testUser.id,
          year: selectedYear,
          semester: selectedSemester
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Email de test envoyé avec succès à ${data.data.user.email}`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      toast.error("Erreur lors de l'envoi de l'email de test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🧪 Test du Système de Génération de Feuille de Temps
          </h1>

          {/* Configuration SMTP */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuration SMTP</h2>
            {smtpConfig ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Host:</span>
                    <span className="ml-2 text-green-700">{smtpConfig.host}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Port:</span>
                    <span className="ml-2 text-green-700">{smtpConfig.port}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">User:</span>
                    <span className="ml-2 text-green-700">{smtpConfig.user}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">From:</span>
                    <span className="ml-2 text-green-700">{smtpConfig.from}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Configuration SMTP non disponible</p>
              </div>
            )}
          </div>

          {/* Utilisateur de Test */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Utilisateur de Test</h2>
            {testUser ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Nom:</span>
                    <span className="ml-2 text-blue-700">{testUser.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Email:</span>
                    <span className="ml-2 text-blue-700">{testUser.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Rôle:</span>
                    <span className="ml-2 text-blue-700">{testUser.role}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Proforma Cost:</span>
                    <span className="ml-2 text-blue-700">
                      {testUser.hasProformaCost ? "✅ Disponible" : "❌ Non disponible"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">Aucun utilisateur STAFF trouvé pour le test</p>
              </div>
            )}
          </div>

          {/* Paramètres de Test */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Paramètres de Test</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semestre
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as 'S1' | 'S2')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="S1">Semestre 1 (Janvier - Juin)</option>
                  <option value="S2">Semestre 2 (Juillet - Décembre)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={checkConfiguration}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              🔄 Vérifier Configuration
            </button>
            <button
              onClick={sendTestEmail}
              disabled={!testUser || loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "📤 Envoi en cours..." : "📧 Envoyer Email de Test"}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Instructions de Test</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Vérifiez que la configuration SMTP est correcte</li>
              <li>Assurez-vous qu&apos;un utilisateur STAFF existe avec un coût proforma</li>
              <li>Sélectionnez l&apos;année et le semestre de test</li>
              <li>Cliquez sur &quot;Envoyer Email de Test&quot;</li>
              <li>Vérifiez votre boîte email pour recevoir le PDF de test</li>
              <li>Testez la signature électronique du PDF</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
