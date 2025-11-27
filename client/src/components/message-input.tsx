import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";

interface MessageInputProps {
  ws: WebSocket | null;
  currentUserId: string;
  receiverId: string;
  channelId?: string;
  senderName?: string;
}

export function MessageInput({ 
  ws, 
  currentUserId, 
  receiverId, 
  channelId,
  senderName 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSend = () => {
    if (!message.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    const messageData: any = {
      type: "message",
      senderId: currentUserId,
      content: message.trim(),
      senderName: senderName || "User",
    };

    if (channelId) {
      messageData.channelId = channelId;
    } else {
      messageData.receiverId = receiverId;
    }

    ws.send(JSON.stringify(messageData));
    setMessage("");
    setSelectedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    const typingData: any = {
      type: "typing",
      senderId: currentUserId,
    };

    if (channelId) {
      typingData.channelId = channelId;
    } else {
      typingData.receiverId = receiverId;
    }

    ws.send(JSON.stringify(typingData));
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <input
          type="file"
          id="file-input"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          data-testid="input-file"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => document.getElementById("file-input")?.click()}
          data-testid="button-attach-file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          className="resize-none min-h-12 max-h-32 text-base rounded-3xl"
          rows={1}
          data-testid="input-message"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="h-12 w-12 rounded-full flex-shrink-0"
          data-testid="button-send"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {selectedFile && (
        <div className="flex items-center gap-2 text-xs bg-muted p-2 rounded-lg mt-2">
          <span className="truncate">{selectedFile.name}</span>
          <button
            onClick={() => setSelectedFile(null)}
            data-testid="button-remove-file"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
