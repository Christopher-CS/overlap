import mockGroupChatDataJson from "./mock-group-chat.json";
import type { ChatMessage, ChatRepository, SendMessageInput } from "./chat-types";

type MockChatData = {
  messages: ChatMessage[];
};

const mockChatData = mockGroupChatDataJson as MockChatData;
const seedMessages = mockChatData.messages;
const overlayMessages: ChatMessage[] = [];
const localSender = {
  id: "me",
  name: "You",
};

const createMessageId = (groupId: string) =>
  `local-${groupId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createLocalChatRepository = (): ChatRepository => ({
  async listMessages(groupId: string) {
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
      senderId: localSender.id,
      senderName: localSender.name,
      text: input.text.trim(),
      createdAt: new Date().toISOString(),
    };
    overlayMessages.push(newMessage);
    return newMessage;
  },
});

export const chatRepository = createLocalChatRepository();
