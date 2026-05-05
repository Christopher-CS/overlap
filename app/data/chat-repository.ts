import mockGroupChatDataJson from "./mock-group-chat.json";
import type { ChatMessage, ChatRepository, SendMessageInput } from "./chat-types";
import { toGroupId, toMessageId, toUserId, type GroupId, type MessageId } from "./ids";

type RawMockMessage = Omit<ChatMessage, "id" | "groupId" | "senderId"> & {
  id: string;
  groupId: string;
  senderId: string;
};

type MockChatData = {
  messages: RawMockMessage[];
};

const mockChatData = mockGroupChatDataJson as MockChatData;
const seedMessages: ChatMessage[] = mockChatData.messages.map((message) => ({
  ...message,
  id: toMessageId(message.id),
  groupId: toGroupId(message.groupId),
  senderId: toUserId(message.senderId),
}));
const overlayMessages: ChatMessage[] = [];

const createMessageId = (groupId: GroupId): MessageId =>
  toMessageId(
    `local-${groupId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );

const createLocalChatRepository = (): ChatRepository => ({
  async listMessages(groupId: GroupId) {
    return [...seedMessages, ...overlayMessages]
      .filter((message) => message.groupId === groupId)
      .sort((firstMessage, secondMessage) =>
        firstMessage.createdAt.localeCompare(secondMessage.createdAt),
      );
  },
  async sendMessage(input: SendMessageInput) {
    const newMessage: ChatMessage = {
      id: createMessageId(input.groupId),
      groupId: input.groupId,
      senderId: input.senderId,
      senderName: input.senderName,
      text: input.text.trim(),
      createdAt: new Date().toISOString(),
    };
    overlayMessages.push(newMessage);
    return newMessage;
  },
});

export const chatRepository = createLocalChatRepository();
