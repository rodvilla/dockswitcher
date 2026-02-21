import { Toggle } from "components/atoms/Toggle";

interface SettingsToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function SettingsToggleRow({ label, description, checked, onChange }: SettingsToggleRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <span className="text-base font-medium text-gray-900 dark:text-white">
          {label}
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export { SettingsToggleRow };
export type { SettingsToggleRowProps };
