import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertMessageSchema, insertChannelSchema, insertReactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Map<string, WebSocket>();
  const typingUsers = new Map<string, Set<string>>();

  wss.on("connection", (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "auth") {
          userId = message.userId;
          if (userId) {
            clients.set(userId, ws);
            await storage.updateUserStatus(userId, "online");
            broadcast({ type: "userStatus", userId, status: "online" }, userId);
          }
        } else if (message.type === "message") {
          const validatedMessage = insertMessageSchema.parse({
            senderId: message.senderId,
            receiverId: message.receiverId,
            channelId: message.channelId,
            content: message.content,
          });

          const savedMessage = await storage.createMessage(validatedMessage);

          if (message.channelId) {
            const members = await storage.getChannelMembers(message.channelId);
            members.forEach((member) => {
              if (clients.has(member.id)) {
                clients.get(member.id)?.send(
                  JSON.stringify({ type: "message", message: savedMessage })
                );
              }
            });
            await storage.createNotification({
              userId: message.receiverId || "",
              senderName: message.senderName,
              messagePreview: message.content.substring(0, 50),
              type: "channel",
              read: false,
            });
          } else {
            if (clients.has(message.senderId)) {
              clients.get(message.senderId)?.send(
                JSON.stringify({ type: "message", message: savedMessage })
              );
            }
            if (clients.has(message.receiverId)) {
              clients.get(message.receiverId)?.send(
                JSON.stringify({ type: "message", message: savedMessage })
              );
            }
            await storage.createNotification({
              userId: message.receiverId,
              senderName: message.senderName,
              messagePreview: message.content.substring(0, 50),
              type: "message",
              read: false,
            });
          }
        } else if (message.type === "getHistory") {
          const messages = await storage.getMessagesBetweenUsers(
            message.userId,
            message.contactId
          );
          ws.send(JSON.stringify({ type: "history", messages }));
        } else if (message.type === "getChannelMessages") {
          const messages = await storage.getChannelMessages(message.channelId);
          ws.send(JSON.stringify({ type: "channelHistory", messages }));
        } else if (message.type === "typing") {
          const key = message.channelId || `${message.senderId}-${message.receiverId}`;
          if (!typingUsers.has(key)) {
            typingUsers.set(key, new Set());
          }
          typingUsers.get(key)?.add(message.senderId);

          if (message.channelId) {
            const members = await storage.getChannelMembers(message.channelId);
            members.forEach((member) => {
              if (member.id !== message.senderId && clients.has(member.id)) {
                clients.get(member.id)?.send(
                  JSON.stringify({
                    type: "typing",
                    userId: message.senderId,
                    channelId: message.channelId,
                  })
                );
              }
            });
          } else if (clients.has(message.receiverId)) {
            clients.get(message.receiverId)?.send(
              JSON.stringify({
                type: "typing",
                userId: message.senderId,
                receiverId: message.receiverId,
              })
            );
          }

          setTimeout(() => {
            const typing = typingUsers.get(key);
            if (typing) {
              typing.delete(message.senderId);
            }
          }, 3000);
        } else if (message.type === "reaction") {
          const reaction = await storage.addReaction(
            message.messageId,
            message.userId,
            message.emoji
          );

          if (message.channelId) {
            const members = await storage.getChannelMembers(message.channelId);
            members.forEach((member) => {
              if (clients.has(member.id)) {
                clients.get(member.id)?.send(
                  JSON.stringify({
                    type: "reaction",
                    reaction,
                  })
                );
              }
            });
          } else {
            [message.senderId, message.receiverId].forEach((id) => {
              if (clients.has(id)) {
                clients.get(id)?.send(
                  JSON.stringify({
                    type: "reaction",
                    reaction,
                  })
                );
              }
            });
          }
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
        storage.updateUserStatus(userId, "offline");
        broadcast({ type: "userStatus", userId, status: "offline" }, userId);
      }
    });
  });

  function broadcast(data: any, excludeUserId?: string) {
    clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
      const user = await storage.createUser({ username, password });
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // User Routes
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/messages/:contactId", async (req, res) => {
    try {
      const { contactId } = req.params;
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const messages = await storage.getMessagesBetweenUsers(userId, contactId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Channel Routes
  app.post("/api/channels", async (req, res) => {
    try {
      const { name, description, creatorId, isPrivate } = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel({ name, description, creatorId, isPrivate });
      res.json({ channel });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/channels", async (_req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });

  app.get("/api/channels/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const channel = await storage.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      const messages = await storage.getChannelMessages(channelId);
      const members = await storage.getChannelMembers(channelId);
      res.json({ channel, messages, members });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch channel" });
    }
  });

  app.post("/api/channels/:channelId/members", async (req, res) => {
    try {
      const { channelId } = req.params;
      const { userId } = req.body;
      await storage.addChannelMember(channelId, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  app.get("/api/channels/:channelId/members", async (req, res) => {
    try {
      const { channelId } = req.params;
      const members = await storage.getChannelMembers(channelId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  app.get("/api/channels/:channelId/messages", async (req, res) => {
    try {
      const { channelId } = req.params;
      const messages = await storage.getChannelMessages(channelId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Reaction Routes
  app.post("/api/reactions", async (req, res) => {
    try {
      const { messageId, userId, emoji } = insertReactionSchema.parse(req.body);
      const reaction = await storage.addReaction(messageId, userId, emoji);
      res.json({ reaction });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/messages/:messageId/reactions", async (req, res) => {
    try {
      const { messageId } = req.params;
      const reactions = await storage.getMessageReactions(messageId);
      res.json(reactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });

  // Notification Routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  return httpServer;
}
