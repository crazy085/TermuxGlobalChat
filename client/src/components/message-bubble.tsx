import { type Message } from "@shared/schema";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.timestamp), "h:mm a");

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-md px-4 py-2 rounded-2xl ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border border-card-border"
        }`}
      >
        <p className="text-sm break-words whitespace-pre-wrap">
          {message.content}
        </p>
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          <span>{formattedTime}</span>
          {isOwn && (
            <span className="ml-1">
              {message.read ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
