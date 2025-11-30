import { useState } from "react";
import { type Reaction } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";

interface MessageReactionsProps {
  reactions: Reaction[];
  messageId: string;
  currentUserId: string;
  onAddReaction: (emoji: string) => void;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

export function MessageReactions({
  reactions,
  messageId,
  currentUserId,
  onAddReaction,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      const existing = acc.find((r) => r.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reaction.userId);
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.userId],
        });
      }
      return acc;
    },
    [] as Array<{ emoji: string; count: number; users: string[] }>
  );

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {groupedReactions.map((group) => (
        <Badge
          key={group.emoji}
          variant="secondary"
          className="text-xs gap-1"
          data-testid={`reaction-${group.emoji}`}
        >
          <span>{group.emoji}</span>
          <span>{group.count}</span>
        </Badge>
      ))}

      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          data-testid="button-add-reaction"
        >
          <SmilePlus className="h-3 w-3" />
        </Button>

        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-lg p-2 grid grid-cols-4 gap-1 shadow-lg z-10">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onAddReaction(emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg p-1 hover:bg-muted rounded transition-colors"
                data-testid={`emoji-option-${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
