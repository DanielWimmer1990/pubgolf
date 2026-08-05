import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PLAYER_COLORS, AVATAR_EMOJIS } from "@/lib/playerColors";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";

export type PlayerIdentity = {
  name: string;
  color: string;
  avatarEmoji: string | null;
};

type PlayerIdentityFormProps = {
  value: PlayerIdentity;
  onChange: (value: PlayerIdentity) => void;
};

export function PlayerIdentityForm({
  value,
  onChange,
}: PlayerIdentityFormProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        <PlayerAvatar
          name={value.name}
          color={value.color}
          avatarEmoji={value.avatarEmoji}
          size="lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-name">Dein Name</Label>
        <Input
          id="player-name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="z.B. Max"
          maxLength={20}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Farbe</Label>
        <div className="flex flex-wrap gap-2">
          {PLAYER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...value, color })}
              className={cn(
                "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition",
                value.color === color && "ring-2 ring-foreground"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Farbe ${color} auswählen`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Avatar (optional)</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, avatarEmoji: null })}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border text-xs text-muted-foreground",
              value.avatarEmoji === null && "border-foreground"
            )}
          >
            Aa
          </button>
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ ...value, avatarEmoji: emoji })}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md border text-lg",
                value.avatarEmoji === emoji && "border-foreground"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
