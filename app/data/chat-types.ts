import type { GroupId, MessageId, UserId } from "./ids";

export type ChatMessage = {
  id: MessageId;
  groupId: GroupId;
  senderId: UserId;
  senderName: string;
  text: string;
  createdAt: string;
};

export type SendMessageInput = {
  groupId: GroupId;
  text: string;
  senderId: UserId;
  senderName: string;
};

export type ChatRepository = {
  listMessages: (groupId: GroupId) => Promise<ChatMessage[]>;
  sendMessage: (input: SendMessageInput) => Promise<ChatMessage>;
};
