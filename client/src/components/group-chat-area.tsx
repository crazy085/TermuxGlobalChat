import { useEffect, useRef, useState } from "react";
import { type Channel, type Message, type User, type Reaction } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/message-bubble";
import { MessageInput } from "@/components/message-input";
import { TypingIndicator } from "@/components/typing-indicator";
import { MessageReactions } from "@/components/message-reactions";

interface GroupChatAreaProps {
  selectedChannel: Channel | null;
  messages: Message[];
  ws: WebSocket | null;
  currentUserId: string;
  currentUsername: string;
  channelMembers: User[];
  typingUsers: Set<string>;
  reactions: Map<string, Reaction[]>;
  onAddReaction: (messageId: string, emoji: string) => void;
}

export function GroupChatArea({
  selectedChannel,
  messages,
  ws,
  currentUserId,
  currentUsername,
  channelMembers,
  typingUsers,
  reactions,
  onAddReaction,
}: GroupChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedChannel) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Select a channel to start messaging</p>
      </div>
    );
  }

  const channelMessages = messages.filter((m) => m.channelId === selectedChannel.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div>
          <h2 className="font-semibold text-lg" data-testid="text-channel-name">
            #{selectedChannel.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {channelMembers.length} members
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {channelMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages in this channel yet
            </p>
          </div>
        ) : (
          channelMessages.map((message) => {
            const sender = channelMembers.find((u) => u.id === message.senderId);
            const messageReactions = reactions.get(message.id) || [];
            return (
              <div
                key={message.id}
                className="space-y-1"
                data-testid={`group-message-${message.id}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                      {sender?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold">{sender?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {message.timestamp
                          ? new Date(message.timestamp).toLocaleTimeString()
                          : ""}
                      </p>
                    </div>
                    <MessageBubble
                      message={message}
                      isOwn={message.senderId === currentUserId}
                    />
                    <div className="mt-2">
                      <MessageReactions
                        reactions={messageReactions}
                        messageId={message.id}
                        currentUserId={currentUserId}
                        onAddReaction={(emoji) => onAddReaction(message.id, emoji)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <TypingIndicator />
            <span className="text-xs">
              {Array.from(typingUsers)
                .map((id) => channelMembers.find((u) => u.id === id)?.username)
                .join(", ")} is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        ws={ws}
        currentUserId={currentUserId}
        receiverId=""
        channelId={selectedChannel.id}
        senderName={currentUsername}
      />
    </div>
  );
}
