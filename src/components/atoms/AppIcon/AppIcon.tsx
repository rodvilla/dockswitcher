export interface AppIconProps {
  name: string;
  icon?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-lg",
  lg: "h-12 w-12 text-xl",
};

const colors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

export function AppIcon({ name, icon, size = "md" }: AppIconProps) {
  const sizeClass = sizeClasses[size];
  const initial = name.charAt(0).toUpperCase();
  const colorIndex = name.length % colors.length;
  const bgClass = colors[colorIndex];

  if (icon) {
    return (
      <img
        src={`data:image/png;base64,${icon}`}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-lg shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${bgClass}`}
    >
      <span className="font-bold">{initial}</span>
    </div>
  );
}
