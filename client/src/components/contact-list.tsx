import { useState } from "react";
import { type User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface ContactListProps {
  contacts: User[];
  selectedContact: User | null;
  onContactSelect: (contact: User) => void;
  currentUsername: string;
}

export function ContactList({
  contacts,
  selectedContact,
  onContactSelect,
  currentUsername,
}: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {currentUsername.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate" data-testid="text-current-user">
              {currentUsername}
            </h2>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          Logout
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-lg"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Contact List */}
      <ScrollArea className="flex-1">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No contacts found" : "No contacts available"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onContactSelect(contact)}
                data-testid={`contact-${contact.id}`}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors ${
                  selectedContact?.id === contact.id
                    ? "bg-sidebar-accent"
                    : ""
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-foreground font-semibold">
                      {contact.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-status-online border-2 border-background" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-base truncate">
                    {contact.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
