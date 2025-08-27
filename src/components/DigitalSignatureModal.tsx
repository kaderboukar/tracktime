import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signature: string) => void;
  userName: string;
  documentName: string;
}

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  onSign,
  userName,
  documentName
}: DigitalSignatureModalProps) {
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigned, setIsSigned] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
    setSignature('');
    setIsSigned(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      setSignature(dataURL);
      setIsSigned(true);
    }
  };

  const handleSubmit = () => {
    if (signature) {
      onSign(signature);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckIcon className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Signature Électronique
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Document à signer
            </h3>
            <p className="text-gray-600">{documentName}</p>
            <p className="text-sm text-gray-500">Signataire : {userName}</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">i</span>
                </div>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Instructions de signature :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Utilisez votre souris pour dessiner votre signature</li>
                  <li>Cliquez sur &quot;Sauvegarder Signature&quot; une fois satisfait</li>
                  <li>Cliquez sur &quot;Signer le Document&quot; pour finaliser</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Canvas de signature */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre signature
            </label>
            <div className="border-2 border-gray-300 rounded-lg p-2">
              <canvas
                ref={canvasRef}
                width={500}
                height={150}
                className="border border-gray-200 rounded cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dessinez votre signature dans la zone ci-dessus
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={clearSignature}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Effacer
              </button>
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Sauvegarder Signature
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isSigned}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                         hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg
                         transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigned ? (
                  <>
                    <CheckIcon className="w-5 h-5 inline mr-2" />
                    Signer le Document
                  </>
                ) : (
                  'Signature requise'
                )}
              </button>
            </div>
          </div>

          {/* Aperçu de la signature */}
          {isSigned && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Signature sauvegardée ✓</h4>
              <div className="flex items-center space-x-3">
                <Image src={signature} alt="Signature" width={48} height={48} className="border border-gray-300 rounded" />
                <span className="text-sm text-green-700">
                  Votre signature est prête. Cliquez sur &quot;Signer le Document&quot; pour finaliser.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
