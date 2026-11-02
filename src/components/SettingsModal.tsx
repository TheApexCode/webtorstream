import React, { useState } from 'react';
import { X, Server, Settings, Trash2, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  customBaseUrl: string;
  onSaveBaseUrl: (url: string) => void;
  onClearHistory: () => void;
  historyCount: number;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  customBaseUrl,
  onSaveBaseUrl,
  onClearHistory,
  historyCount,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState(customBaseUrl || 'https://webtor.io');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBaseUrl(urlInput.trim() || 'https://webtor.io');
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1000);
  };

  const handleResetDefault = () => {
    setUrlInput('https://webtor.io');
    onSaveBaseUrl('https://webtor.io');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Settings className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100">Webtor & Stream Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-200 mb-1 flex items-center justify-between">
              <span>Webtor Backend Base URL</span>
              {urlInput !== 'https://webtor.io' && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  Reset to default
                </button>
              )}
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://webtor.io"
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Default is <code className="text-neutral-300">https://webtor.io</code>. If you run your own self-hosted Webtor Docker cluster, specify your custom domain here.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-200">Recent Streams History</p>
                <p className="text-[11px] text-neutral-400">
                  {historyCount} saved item{historyCount === 1 ? '' : 's'} in local cache
                </p>
              </div>
              {historyCount > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Client-side P2P stream parsing via Web Crypto API. No data stored on third-party servers.</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://github.com/webtor-io/embed-sdk-js"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Webtor Embed SDK Repo</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {savedNotice ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedNotice ? 'Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
