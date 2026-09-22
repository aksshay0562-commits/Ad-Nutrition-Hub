import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Layers,
  Terminal
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'direct' | 'apk' | 'developer'>('direct');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-3nngh2ht6suqabobkknf2b-638592500263.asia-southeast1.run.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentUrl)}`;

  const handleDirectInstall = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const cliCommands = `# 1. Sync any new web changes to native Android
npm run build:android

# 2. Open native Android project in Android Studio
npx cap open android

# Or build debug APK directly with Gradle:
cd android && ./gradlew assembleDebug

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(cliCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="android-install-modal"
      >
        {/* Header with App Branding */}
        <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 p-5 text-neutral-950">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-neutral-950 transition-colors"
            id="close-android-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-13 h-13 rounded-2xl bg-neutral-950 border border-amber-400/40 p-2 shadow-xl shrink-0 flex items-center justify-center">
              <img 
                src="/icon.svg" 
                alt="AD Nutrition Hub" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-neutral-950 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Android & WebAPK
                </span>
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 inline" /> Verified
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-neutral-950">
                AD Nutrition Hub Israna App
              </h2>
              <p className="text-xs font-semibold text-neutral-900/80">
                Install directly on your Android phone or generate a standalone APK
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('direct')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'direct'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
            id="tab-direct-install"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>1-Tap Phone Install</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'apk'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
            id="tab-apk-builder"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Build / Package APK</span>
          </button>

          <button
            onClick={() => setActiveTab('developer')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'developer'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
            id="tab-dev-cli"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Android Studio & Capacitor</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-200">
          {/* TAB 1: Direct WebAPK Install */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-white text-sm">Native Android WebAPK Experience</p>
                  <p className="text-neutral-400">
                    Installs directly to your Android device’s home screen and app launcher. Operates as a fast, standalone fullscreen app with offline caching and instant WhatsApp ordering.
                  </p>
                </div>
              </div>

              {isInstalled ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-emerald-300 text-sm">Application Already Installed!</p>
                  <p className="text-xs text-neutral-400">
                    You are running AD Nutrition Hub as an installed standalone app on this device.
                  </p>
                </div>
              ) : isInstallable ? (
                <div className="space-y-3">
                  <button
                    onClick={handleDirectInstall}
                    disabled={installing}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
                    id="install-prompt-trigger-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Opening Android Installer...' : 'Install App on Android Now'}</span>
                  </button>
                  <p className="text-[11px] text-center text-neutral-400">
                    Takes 2 seconds • Zero disk space clutter • No sideloading warnings
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      How to install on any Android phone (Chrome / Brave / Edge):
                    </p>
                    <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
                      <li>Open this website in <strong>Google Chrome</strong> on your Android device.</li>
                      <li>Tap the <strong>three dots (⋮)</strong> menu in the top-right corner of Chrome.</li>
                      <li>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                      <li>Confirm <strong>&quot;Install&quot;</strong> — Android will place the AD Nutrition icon on your home screen.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* QR Code Section for Desktop Users */}
              <div className="pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-4 bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80">
                  <div className="w-24 h-24 bg-white p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentUrl)}`}
                      alt="Scan QR to open app on Android"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <QrCode className="w-4 h-4" />
                      <span>Scan with Phone Camera</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Point your Android phone&apos;s camera at the QR code to open and install the app immediately.
                    </p>
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy App URL to share via WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Standalone APK Generator via PWABuilder */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-white text-sm">Official PWABuilder Android Package (.APK & .AAB)</p>
                  <p className="text-neutral-400">
                    Microsoft &amp; Google&apos;s official tool converts this PWA manifest and icons into a signed or unsigned Android APK file (for direct distribution) or Android App Bundle (for the Google Play Store).
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="font-semibold text-white">App Manifest Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Compliant &amp; Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="font-semibold text-white">PWA Icons:</span>
                  <span className="text-emerald-400 font-bold">192px, 512px, Maskable</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="font-semibold text-white">Target Package ID:</span>
                  <span className="font-mono text-amber-400 text-[11px]">com.adnutritionhub.israna</span>
                </div>
              </div>

              <a
                href={pwaBuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01]"
                id="pwabuilder-external-link"
              >
                <span>Package Android APK on PWABuilder</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-[11px] text-center text-neutral-400 leading-relaxed">
                Clicking opens PWABuilder with your store URL loaded. Select <strong>&quot;Package for Android&quot;</strong> and click <strong>&quot;Download APK&quot;</strong> to get the raw installable file.
              </p>
            </div>
          )}

          {/* TAB 3: Developer / Capacitor CLI & Android Studio */}
          {activeTab === 'developer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
                <Layers className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-white text-sm">Native Android Studio Project (Ready)</p>
                  <p className="text-neutral-400">
                    The native Android project has been generated in <code className="text-amber-400 font-mono">/android</code> with package <code className="text-amber-400 font-mono">com.adnutritionhub.israna</code>. You can export or clone the project and compile the APK directly in Android Studio.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Terminal Commands:</span>
                  <button
                    onClick={handleCopyCmd}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Copied Commands!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-black border border-neutral-800 text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed">
                  {cliCommands}
                </pre>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
                <p className="font-semibold text-white">Output location in Android Studio:</p>
                <p className="font-mono text-[11px] text-neutral-300">
                  android/app/build/outputs/apk/debug/app-debug.apk
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Store Online &amp; Android Ready</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
