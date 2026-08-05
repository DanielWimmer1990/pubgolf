import { cn } from "@/lib/utils";

type PlayerAvatarProps = {
  name: string;
  color: string;
  avatarEmoji?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-sm",
  md: "h-11 w-11 text-lg",
  lg: "h-16 w-16 text-3xl",
};

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

export function PlayerAvatar({
  name,
  color,
  avatarEmoji,
  size = "md",
  className,
}: PlayerAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {avatarEmoji ? (
        <span className="leading-none">{avatarEmoji}</span>
      ) : (
        <span>{initials(name || "?")}</span>
      )}
    </div>
  );
}
