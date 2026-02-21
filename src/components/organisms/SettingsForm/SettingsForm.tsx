import { SettingsToggleRow } from "../../molecules/SettingsToggleRow";
import type { Settings } from "../../../types/settings";

interface SettingsFormProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
}

function SettingsForm({ settings, onUpdateSettings }: SettingsFormProps) {
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
    <div className="space-y-6">
      <SettingsToggleRow
        label="Launch at Login"
        description="Start DockSwitcher automatically when you log in"
        checked={settings.launch_at_login}
        onChange={toggleLaunchAtLogin}
      />
      <SettingsToggleRow
        label="Confirm Before Switching"
        description="Show a confirmation dialog before switching profiles"
        checked={settings.confirm_before_switch}
        onChange={toggleConfirmBeforeSwitch}
      />
    </div>
  );
}

export { SettingsForm };
export type { SettingsFormProps };
