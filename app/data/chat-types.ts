export type ChatMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type SendMessageInput = {
  groupId: string;
  text: string;
};

export type ChatRepository = {
  listMessages: (groupId: string) => Promise<ChatMessage[]>;
  sendMessage: (input: SendMessageInput) => Promise<ChatMessage>;
};
