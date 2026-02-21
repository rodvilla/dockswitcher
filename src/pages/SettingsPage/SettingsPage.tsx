import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/atoms";
import { SettingsForm } from "../../components/organisms/SettingsForm";
import type { Settings } from "../../types/settings";

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onBack: () => void;
}

function SettingsPage({ settings, onUpdateSettings, onBack }: SettingsPageProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800"
        data-tauri-drag-region
      >
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
          Back
        </Button>
        <h2
          className="text-lg font-semibold text-gray-900 dark:text-white"
          data-tauri-drag-region
        >
          Settings
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <SettingsForm settings={settings} onUpdateSettings={onUpdateSettings} />
      </div>
      <div className="border-t border-gray-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-center text-xs text-gray-400 dark:text-slate-500">
          DockSwitcher v1.0.0
        </p>
      </div>
    </div>
  );
}

export { SettingsPage };
export type { SettingsPageProps };
