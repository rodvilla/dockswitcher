import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Settings } from '../types';

interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const toggleLaunchAtLogin = () => {
    onUpdateSettings({
      ...settings,
      launch_at_login: !settings.launch_at_login,
    });
  };

  const toggleConfirmBeforeSwitch = () => {
    onUpdateSettings({
      ...settings,
      confirm_before_switch: !settings.confirm_before_switch,
    });
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={onBack}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-medium text-gray-900 dark:text-white">Launch at Login</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start DockSwitcher automatically when you log in</p>
            </div>
            <button
              onClick={toggleLaunchAtLogin}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                settings.launch_at_login ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.launch_at_login ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-medium text-gray-900 dark:text-white">Confirm before switching</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Show a confirmation dialog before applying a new Dock profile</p>
            </div>
            <button
              onClick={toggleConfirmBeforeSwitch}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                settings.confirm_before_switch ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.confirm_before_switch ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-6 text-center dark:border-slate-800">
        <p className="text-xs text-gray-400 dark:text-slate-500">DockSwitcher v0.1.0</p>
      </div>
    </div>
  );
};

export default SettingsView;
