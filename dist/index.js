// server/index-prod.ts
import fs from "node:fs";
import path from "node:path";
import express2 from "express";

// server/app.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
var SALT_ROUNDS = 10;
var MemStorage = class {
  users;
  messages;
  channels;
  channelMembers;
  reactions;
  notifications;
  lastSeen = /* @__PURE__ */ new Map();
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.channels = /* @__PURE__ */ new Map();
    this.channelMembers = /* @__PURE__ */ new Map();
    this.reactions = /* @__PURE__ */ new Map();
    this.notifications = /* @__PURE__ */ new Map();
  }
  updateUserLastSeen(userId) {
    this.lastSeen.set(userId, /* @__PURE__ */ new Date());
    const user = this.users.get(userId);
    if (user) user.lastSeen = /* @__PURE__ */ new Date();
  }
  getUserLastSeen(userId) {
    return this.lastSeen.get(userId) || null;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const user = { ...insertUser, id, password: hashedPassword, avatar: null, status: "offline" };
    this.users.set(id, user);
    return user;
  }
  async authenticateUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  async updateUserStatus(userId, status) {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
    }
  }
  async createMessage(insertMessage) {
    const id = randomUUID();
    const message = {
      ...insertMessage,
      id,
      timestamp: /* @__PURE__ */ new Date(),
      read: false,
      receiverId: insertMessage.receiverId ?? null,
      channelId: insertMessage.channelId ?? null,
      fileUrl: null
    };
    this.messages.set(id, message);
    return message;
  }
  async getMessagesBetweenUsers(userId1, userId2) {
    return Array.from(this.messages.values()).filter(
      (msg) => msg.channelId === null && (msg.senderId === userId1 && msg.receiverId === userId2 || msg.senderId === userId2 && msg.receiverId === userId1)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  async getChannelMessages(channelId) {
    return Array.from(this.messages.values()).filter((msg) => msg.channelId === channelId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  async markMessageAsRead(messageId) {
    const message = this.messages.get(messageId);
    if (message) {
      message.read = true;
    }
  }
  async createChannel(channel) {
    const id = randomUUID();
    const newChannel = {
      ...channel,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      description: channel.description ?? null,
      isPrivate: channel.isPrivate ?? false
    };
    this.channels.set(id, newChannel);
    this.channelMembers.set(id, /* @__PURE__ */ new Set([channel.creatorId]));
    return newChannel;
  }
  async getChannels() {
    return Array.from(this.channels.values());
  }
  async getUserChannels(userId) {
    return Array.from(this.channels.values()).filter(
      (ch) => this.channelMembers.get(ch.id)?.has(userId)
    );
  }
  async getChannel(channelId) {
    return this.channels.get(channelId);
  }
  async addChannelMember(channelId, userId) {
    const members = this.channelMembers.get(channelId);
    if (members) {
      members.add(userId);
    }
  }
  async removeChannelMember(channelId, userId) {
    const members = this.channelMembers.get(channelId);
    if (members) {
      members.delete(userId);
    }
  }
  async getChannelMembers(channelId) {
    const memberIds = this.channelMembers.get(channelId) || /* @__PURE__ */ new Set();
    return Array.from(memberIds).map((id) => this.users.get(id)).filter((u) => u !== void 0);
  }
  async addReaction(messageId, userId, emoji) {
    const id = randomUUID();
    const reaction = { id, messageId, userId, emoji, createdAt: /* @__PURE__ */ new Date() };
    this.reactions.set(id, reaction);
    return reaction;
  }
  async getMessageReactions(messageId) {
    return Array.from(this.reactions.values()).filter((r) => r.messageId === messageId);
  }
  async removeReaction(reactionId) {
    this.reactions.delete(reactionId);
  }
  async createNotification(notification) {
    const id = randomUUID();
    const newNotif = { ...notification, id, createdAt: /* @__PURE__ */ new Date() };
    this.notifications.set(id, newNotif);
    return newNotif;
  }
  async getNotifications(userId) {
    return Array.from(this.notifications.values()).filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async markNotificationAsRead(notificationId) {
    const notif = this.notifications.get(notificationId);
    if (notif) {
      notif.read = true;
    }
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  status: varchar("status").default("offline")
});
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id"),
  channelId: varchar("channel_id"),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
  fileUrl: text("file_url")
});
var channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isPrivate: boolean("is_private").default(false)
});
var channelMembers = pgTable("channel_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow()
});
var reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull(),
  userId: varchar("user_id").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  senderName: text("sender_name").notNull(),
  messagePreview: text("message_preview").notNull(),
  type: varchar("type").notNull().default("message"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  avatar: true,
  status: true
});
var loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});
var insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
  read: true
});
var insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = /* @__PURE__ */ new Map();
  const typingUsers = /* @__PURE__ */ new Map();
  wss.on("connection", (ws) => {
    let userId = null;
    ws.on("message", async (data) => {
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
            content: message.content
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
              read: false
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
              read: false
            });
          }
        } else if (message.type === "getHistory") {
          const messages2 = await storage.getMessagesBetweenUsers(
            message.userId,
            message.contactId
          );
          ws.send(JSON.stringify({ type: "history", messages: messages2 }));
        } else if (message.type === "getChannelMessages") {
          const messages2 = await storage.getChannelMessages(message.channelId);
          ws.send(JSON.stringify({ type: "channelHistory", messages: messages2 }));
        } else if (message.type === "typing") {
          const key = message.channelId || `${message.senderId}-${message.receiverId}`;
          if (!typingUsers.has(key)) {
            typingUsers.set(key, /* @__PURE__ */ new Set());
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
                    channelId: message.channelId
                  })
                );
              }
            });
          } else if (clients.has(message.receiverId)) {
            clients.get(message.receiverId)?.send(
              JSON.stringify({
                type: "typing",
                userId: message.senderId,
                receiverId: message.receiverId
              })
            );
          }
          setTimeout(() => {
            const typing = typingUsers.get(key);
            if (typing) {
              typing.delete(message.senderId);
            }
          }, 3e3);
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
                    reaction
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
                    reaction
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
  function broadcast(data, excludeUserId) {
    clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  app2.post("/api/auth/register", async (req, res) => {
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
  app2.post("/api/auth/login", async (req, res) => {
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
  app2.get("/api/users", async (_req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/messages/:contactId", async (req, res) => {
    try {
      const { contactId } = req.params;
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const messages2 = await storage.getMessagesBetweenUsers(userId, contactId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/channels", async (req, res) => {
    try {
      const { name, description, creatorId, isPrivate } = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel({ name, description, creatorId, isPrivate });
      res.json({ channel });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });
  app2.get("/api/channels", async (_req, res) => {
    try {
      const channels2 = await storage.getChannels();
      res.json(channels2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });
  app2.get("/api/channels/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const channel = await storage.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      const messages2 = await storage.getChannelMessages(channelId);
      const members = await storage.getChannelMembers(channelId);
      res.json({ channel, messages: messages2, members });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch channel" });
    }
  });
  app2.post("/api/channels/:channelId/members", async (req, res) => {
    try {
      const { channelId } = req.params;
      const { userId } = req.body;
      await storage.addChannelMember(channelId, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add member" });
    }
  });
  app2.get("/api/channels/:channelId/members", async (req, res) => {
    try {
      const { channelId } = req.params;
      const members = await storage.getChannelMembers(channelId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });
  app2.get("/api/channels/:channelId/messages", async (req, res) => {
    try {
      const { channelId } = req.params;
      const messages2 = await storage.getChannelMessages(channelId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/reactions", async (req, res) => {
    try {
      const { messageId, userId, emoji } = insertReactionSchema.parse(req.body);
      const reaction = await storage.addReaction(messageId, userId, emoji);
      res.json({ reaction });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });
  app2.get("/api/messages/:messageId/reactions", async (req, res) => {
    try {
      const { messageId } = req.params;
      const reactions2 = await storage.getMessageReactions(messageId);
      res.json(reactions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });
  app2.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const notifications2 = await storage.getNotifications(userId);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  app2.patch("/api/notifications/:notificationId", async (req, res) => {
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

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
}

// server/index-prod.ts
async function serveStatic(app2, _server) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
(async () => {
  await runApp(serveStatic);
})();
export {
  serveStatic
};
