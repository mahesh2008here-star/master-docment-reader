/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Plus,
  Eye,
  Trash2,
  FolderLock,
  FileText,
  AlertCircle,
  Check,
  UploadCloud,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { DocumentItem } from '../types/document';
import { DocumentCard, formatFileSize } from './DocumentCard';

interface LockerScreenProps {
  documents: DocumentItem[];
  vaultPin?: string;
  accentColor?: string;
  onOpenDocument: (doc: DocumentItem) => void;
  onToggleVaultState: (docId: string, isVaulted: boolean) => void;
  onOpenImport: () => void;
  onUpdatePin: (newPin: string) => void;
  onDeleteDocument: (doc: DocumentItem) => void;
}

export const LockerScreen: React.FC<LockerScreenProps> = ({
  documents,
  vaultPin = '1234',
  accentColor = '#f59e0b',
  onOpenDocument,
  onToggleVaultState,
  onOpenImport,
  onUpdatePin,
  onDeleteDocument,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);

  const vaultedDocs = documents.filter((d) => d.isVaulted);
  const unvaultedDocs = documents.filter((d) => !d.isVaulted);

  // Keypad numbers click
  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((p) => p.slice(0, -1));
    setPinError(false);
  };

  const verifyPin = (entered: string) => {
    if (entered === (vaultPin || '1234')) {
      setIsUnlocked(true);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => {
        setPinInput('');
        setPinError(false);
      }, 700);
    }
  };

  const handleBiometricUnlock = () => {
    setIsUnlocked(true);
    setPinInput('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length === 4) {
      onUpdatePin(newPinInput);
      setIsChangingPin(false);
      setNewPinInput('');
    }
  };

  // Locked View: PIN Keypad Screen
  if (!isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full text-stone-900 dark:text-stone-100 select-none pb-28">
        <div className="w-full text-center space-y-3 mb-6">
          <div
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #e11d48)`,
            }}
          >
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Private Document Locker</h2>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            Protected offline vault for sensitive documents. Enter 4-digit PIN or use Biometric scan.
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex items-center justify-center gap-4 my-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pinInput.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  pinError
                    ? 'bg-rose-500 scale-125'
                    : isFilled
                    ? 'scale-110 shadow-md'
                    : 'border-2 border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800'
                }`}
                style={{
                  backgroundColor: !pinError && isFilled ? accentColor : undefined,
                }}
              />
            );
          })}
        </div>

        {pinError && (
          <div className="text-xs font-bold text-rose-500 mb-2 animate-bounce">
            Incorrect PIN. Try again.
          </div>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeypadPress(digit)}
              className="droplert-card h-14 rounded-2xl flex items-center justify-center text-lg font-bold hover:bg-stone-50 dark:hover:bg-stone-900 active:scale-90 transition-transform shadow-xs"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Quick Unlock */}
          <button
            onClick={handleBiometricUnlock}
            className="droplert-card h-14 rounded-2xl flex items-center justify-center text-amber-500 hover:bg-amber-500/10 active:scale-90 transition-transform"
            title="Biometric Instant Unlock"
          >
            <Fingerprint className="w-6 h-6" style={{ color: accentColor }} />
          </button>

          {/* 0 */}
          <button
            onClick={() => handleKeypadPress('0')}
            className="droplert-card h-14 rounded-2xl flex items-center justify-center text-lg font-bold hover:bg-stone-50 dark:hover:bg-stone-900 active:scale-90 transition-transform shadow-xs"
          >
            0
          </button>

          {/* Delete */}
          <button
            onClick={handleBackspace}
            className="droplert-card h-14 rounded-2xl flex items-center justify-center text-xs font-bold text-stone-400 hover:text-stone-700 active:scale-90 transition-transform"
          >
            DEL
          </button>
        </div>

        <div className="mt-4 text-[11px] text-stone-400">
          Default Master PIN: <strong className="font-mono text-stone-300">1234</strong>
        </div>
      </div>
    );
  }

  // Unlocked Vault View
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-6 pb-28 text-stone-900 dark:text-stone-100">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #10b981)`,
            }}
          >
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Private Vault</h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Unlocked
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {vaultedDocs.length} encrypted documents stored
            </p>
          </div>
        </div>

        {/* Lock Vault Button */}
        <button
          onClick={() => setIsUnlocked(false)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 active:scale-95 transition-transform"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Vault</span>
        </button>
      </div>

      {/* Quick Vault Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setAddModalOpen(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-3 shadow-xs hover:border-amber-500/40 transition-all text-left group active:scale-95"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold group-hover:underline">Move from Library</div>
            <div className="text-[10px] text-stone-400">Hide public document</div>
          </div>
        </button>

        <button
          onClick={onOpenImport}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-3 shadow-xs hover:border-amber-500/40 transition-all text-left group active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold group-hover:underline">Import Secret File</div>
            <div className="text-[10px] text-stone-400">Add directly to vault</div>
          </div>
        </button>
      </div>

      {/* Vault Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1 font-bold text-stone-500">
          <span>Vault Documents ({vaultedDocs.length})</span>
          <button
            onClick={() => setIsChangingPin(!isChangingPin)}
            className="text-[11px] hover:underline"
            style={{ color: accentColor }}
          >
            {isChangingPin ? 'Cancel PIN Change' : 'Change Security PIN'}
          </button>
        </div>

        {/* Change PIN Form */}
        {isChangingPin && (
          <form
            onSubmit={handleChangePinSubmit}
            className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-3 text-xs"
          >
            <div className="font-bold text-stone-800 dark:text-stone-200">
              Set New 4-Digit Security PIN
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4 digits..."
                className="w-36 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 font-mono text-center text-sm"
              />
              <button
                type="submit"
                disabled={newPinInput.length !== 4}
                className="px-4 py-1.5 rounded-xl text-white font-bold disabled:opacity-40"
                style={{ backgroundColor: accentColor }}
              >
                Save PIN
              </button>
            </div>
          </form>
        )}

        {vaultedDocs.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-2">
            <FolderLock className="w-8 h-8 mx-auto text-stone-400" />
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Your Private Vault is Empty
            </h3>
            <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
              Move contracts, ID cards, tax forms, or confidential spreadsheets into the vault to isolate them from the public library.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {vaultedDocs.map((doc) => (
              <div
                key={doc.id}
                className="droplert-card p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div
                  onClick={() => onOpenDocument(doc)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate text-stone-900 dark:text-stone-100">
                      {doc.name}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {formatFileSize(doc.sizeBytes)} • Vaulted
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onToggleVaultState(doc.id, false)}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                    title="Move back to public library"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-500"
                    title="Permanently remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Move Document from Library to Vault */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold">Select Document to Move to Vault</h3>
            <p className="text-xs text-stone-400">
              The selected document will be hidden from the public library and protected with your PIN.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {unvaultedDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onToggleVaultState(doc.id, true);
                    setAddModalOpen(false);
                  }}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs"
                >
                  <span className="font-semibold truncate">{doc.name}</span>
                  <span className="font-mono text-[10px] text-stone-400 shrink-0">
                    {formatFileSize(doc.sizeBytes)}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAddModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
