import { useState } from "react";
import { type Channel, type User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Hash, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChannelsListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  currentUserId: string;
  onCreateChannel: (name: string, isPrivate: boolean) => void;
}

export function ChannelsList({
  channels,
  selectedChannel,
  onChannelSelect,
  onCreateChannel,
}: ChannelsListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const handleCreate = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName, false);
      setNewChannelName("");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Channels</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsCreating(true)}
            data-testid="button-create-channel"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {isCreating && (
          <Card className="p-3 space-y-2">
            <Input
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
              data-testid="input-channel-name"
              className="h-9 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                className="flex-1"
                data-testid="button-confirm-create"
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewChannelName("");
                }}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>

      <ScrollArea className="flex-1">
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Hash className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No channels yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                data-testid={`channel-${channel.id}`}
                className={`w-full flex items-center gap-2 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors text-left ${
                  selectedChannel?.id === channel.id ? "bg-sidebar-accent" : ""
                }`}
              >
                {channel.isPrivate ? (
                  <Lock className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Hash className="h-4 w-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{channel.name}</p>
                  {channel.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {channel.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
