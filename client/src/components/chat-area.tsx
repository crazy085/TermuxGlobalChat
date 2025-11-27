import { useEffect, useRef } from "react";
import { type User, type Message } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/message-bubble";
import { MessageInput } from "@/components/message-input";
import { MessageCircle } from "lucide-react";

interface ChatAreaProps {
  selectedContact: User | null;
  messages: Message[];
  ws: WebSocket | null;
  currentUserId: string;
}

export function ChatArea({
  selectedContact,
  messages,
  ws,
  currentUserId,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedContact) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">
            Select a contact to start messaging
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Choose a contact from the list to begin your conversation
          </p>
        </div>
      </div>
    );
  }

  const conversationMessages = messages.filter(
    (msg) =>
      (msg.senderId === currentUserId && msg.receiverId === selectedContact.id) ||
      (msg.senderId === selectedContact.id && msg.receiverId === currentUserId)
  );

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-muted text-foreground font-semibold text-lg">
              {selectedContact.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-status-online border-2 border-background" />
        </div>
        <div>
          <h2 className="font-semibold text-lg" data-testid="text-contact-name">
            {selectedContact.username}
          </h2>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          conversationMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        ws={ws}
        currentUserId={currentUserId}
        receiverId={selectedContact.id}
      />
    </div>
  );
}
