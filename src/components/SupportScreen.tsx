/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Heart,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Send,
  Coffee,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { generateUpiQrSvg } from '../services/qrGenerator';

interface SupportScreenProps {
  accentColor?: string;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  accentColor = '#f59e0b',
}) => {
  const UPI_ID = 'mahesh.2008here@oksbi';
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');

  const activeAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Master%20Documents&am=${activeAmount || ''}&cu=INR&tn=Support%20Master%20Documents`;
  const qrSvg = generateUpiQrSvg(upiUrl, 220);

  const handleRevealAndCopy = () => {
    setIsRevealed(true);
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const amounts = [50, 100, 250, 500];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-6 pb-28">
      {/* Header */}
      <div className="text-center space-y-2">
        <div
          className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #ec4899)`,
          }}
        >
          <Heart className="w-7 h-7 fill-current" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
          Support Master Documents
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
          Master Documents is built with passion as a 100% offline, privacy-first, ad-free document reader.
          Your support helps keep this tool independent and continuously updated.
        </p>
      </div>

      {/* Main Support Card */}
      <div className="droplert-card rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-6 text-stone-900 dark:text-stone-100">
        {/* Tier / Amount Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
            Select Contribution Amount (INR ₹)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {amounts.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount('');
                }}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                  selectedAmount === amt && !customAmount
                    ? 'text-white shadow-md'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
                style={{
                  backgroundColor:
                    selectedAmount === amt && !customAmount ? accentColor : undefined,
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400">Custom ₹:</span>
            <input
              type="number"
              placeholder="Enter amount..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Dynamic UPI QR Code Display */}
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 shadow-inner">
          <div className="w-56 h-56 p-3 rounded-2xl bg-white shadow-md text-stone-900 flex items-center justify-center overflow-hidden">
            <div
              className="w-full h-full text-stone-900 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <QrCode className="w-4 h-4 text-amber-500" />
            <span>Scan with any UPI App</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-0.5">
            Google Pay • PhonePe • Paytm • BHIM • Cred
          </p>
        </div>

        {/* Hidden-Until-Clicked UPI ID Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-500">Official UPI ID</span>
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified Receiver
            </span>
          </div>

          <div className="relative p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 overflow-hidden">
            {/* Masked / Revealed Content */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                {isRevealed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <div
                  className={`font-mono text-xs font-bold transition-all select-all ${
                    isRevealed
                      ? 'text-stone-900 dark:text-stone-100'
                      : 'blur-xs text-stone-400 select-none'
                  }`}
                >
                  {isRevealed ? UPI_ID : 'mahesh•••••@oksbi'}
                </div>
                <div className="text-[10px] text-stone-400">
                  {isRevealed ? 'Tap to copy ID' : 'Hidden for privacy • Tap reveal button'}
                </div>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleRevealAndCopy}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
              style={{ backgroundColor: accentColor }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : isRevealed ? (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reveal & Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Direct UPI App Intent Trigger */}
        <a
          href={upiUrl}
          className="w-full py-3 rounded-2xl text-center font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 hover:opacity-95"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #f43f5e)`,
          }}
        >
          <Send className="w-4 h-4" />
          <span>Pay via UPI App (₹{activeAmount || 100})</span>
        </a>
      </div>

      {/* Supporter Benefits / Gratitude Note */}
      <div className="p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Why Support Master Documents?</span>
        </div>
        <ul className="space-y-2 text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="font-bold text-amber-500">•</span>
            <span><strong>Zero Ads, Zero Subscriptions:</strong> Forever free from trackers, telemetry, and banner ads.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-amber-500">•</span>
            <span><strong>True Offline Privacy:</strong> Documents never touch remote cloud servers. Everything is processed locally.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-amber-500">•</span>
            <span><strong>Direct Developer Impact:</strong> Funds go straight toward ongoing maintenance, new file formats, and performance tuning.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
