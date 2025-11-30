import { type User, type InsertUser, type Message, type InsertMessage, type Channel, type InsertChannel, type Reaction, type Notification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: string, status: string): Promise<void>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getChannelMessages(channelId: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  
  // Channel methods
  createChannel(channel: InsertChannel): Promise<Channel>;
  getChannels(): Promise<Channel[]>;
  getUserChannels(userId: string): Promise<Channel[]>;
  getChannel(channelId: string): Promise<Channel | undefined>;
  addChannelMember(channelId: string, userId: string): Promise<void>;
  removeChannelMember(channelId: string, userId: string): Promise<void>;
  getChannelMembers(channelId: string): Promise<User[]>;
  
  // Reaction methods
  addReaction(messageId: string, userId: string, emoji: string): Promise<Reaction>;
  getMessageReactions(messageId: string): Promise<Reaction[]>;
  removeReaction(reactionId: string): Promise<void>;
  
  // Notification methods
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;
  private channels: Map<string, Channel>;
  private channelMembers: Map<string, Set<string>>;
  private reactions: Map<string, Reaction>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.channels = new Map();
    this.channelMembers = new Map();
    this.reactions = new Map();
    this.notifications = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, avatar: null, status: "offline" };
    this.users.set(id, user);
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      read: false,
      receiverId: insertMessage.receiverId ?? null,
      channelId: insertMessage.channelId ?? null,
      fileUrl: null,
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (msg) =>
          msg.channelId === null &&
          ((msg.senderId === userId1 && msg.receiverId === userId2) ||
            (msg.senderId === userId2 && msg.receiverId === userId1))
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getChannelMessages(channelId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.channelId === channelId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.read = true;
    }
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const id = randomUUID();
    const newChannel: Channel = { 
      ...channel, 
      id, 
      createdAt: new Date(),
      description: channel.description ?? null,
      isPrivate: channel.isPrivate ?? false,
    };
    this.channels.set(id, newChannel);
    this.channelMembers.set(id, new Set([channel.creatorId]));
    return newChannel;
  }

  async getChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  async getUserChannels(userId: string): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter((ch) =>
      this.channelMembers.get(ch.id)?.has(userId)
    );
  }

  async getChannel(channelId: string): Promise<Channel | undefined> {
    return this.channels.get(channelId);
  }

  async addChannelMember(channelId: string, userId: string): Promise<void> {
    const members = this.channelMembers.get(channelId);
    if (members) {
      members.add(userId);
    }
  }

  async removeChannelMember(channelId: string, userId: string): Promise<void> {
    const members = this.channelMembers.get(channelId);
    if (members) {
      members.delete(userId);
    }
  }

  async getChannelMembers(channelId: string): Promise<User[]> {
    const memberIds = this.channelMembers.get(channelId) || new Set();
    return Array.from(memberIds)
      .map((id) => this.users.get(id))
      .filter((u) => u !== undefined) as User[];
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<Reaction> {
    const id = randomUUID();
    const reaction: Reaction = { id, messageId, userId, emoji, createdAt: new Date() };
    this.reactions.set(id, reaction);
    return reaction;
  }

  async getMessageReactions(messageId: string): Promise<Reaction[]> {
    return Array.from(this.reactions.values()).filter((r) => r.messageId === messageId);
  }

  async removeReaction(reactionId: string): Promise<void> {
    this.reactions.delete(reactionId);
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const id = randomUUID();
    const newNotif: Notification = { ...notification, id, createdAt: new Date() };
    this.notifications.set(id, newNotif);
    return newNotif;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notif = this.notifications.get(notificationId);
    if (notif) {
      notif.read = true;
    }
  }
}

export const storage = new MemStorage();
