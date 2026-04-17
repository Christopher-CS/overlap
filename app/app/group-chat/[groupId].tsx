import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { ChatMessage } from "../../data/chat-types";
import type { GroupRecord } from "../../data/groups-types";
import { getRepositories } from "../../data/repository-provider";

const { chat: chatRepository, groups: groupsRepository } = getRepositories();

const formatMessageTime = (dateValue: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));

export default function GroupChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId?: string | string[] }>();
  const resolvedGroupId = Array.isArray(groupId) ? groupId[0] : groupId ?? "";
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const currentGroup = useMemo(
    () => groups.find((group) => group.id === resolvedGroupId) ?? null,
    [groups, resolvedGroupId],
  );

  const loadChatState = async () => {
    if (!resolvedGroupId) {
      return;
    }
    const [loadedGroups, loadedMessages] = await Promise.all([
      groupsRepository.listGroups(),
      chatRepository.listMessages(resolvedGroupId),
    ]);
    setGroups(loadedGroups);
    setMessages(loadedMessages);
  };

  useEffect(() => {
    void loadChatState();
  }, [resolvedGroupId]);

  const handleSendMessage = async () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || !resolvedGroupId) {
      return;
    }
    try {
      setIsSending(true);
      await chatRepository.sendMessage({
        groupId: resolvedGroupId,
        text: trimmedMessage,
      });
      setDraftMessage("");
      const updatedMessages = await chatRepository.listMessages(resolvedGroupId);
      setMessages(updatedMessages);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={10}
        style={styles.screen}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather color="#22304D" name="chevron-left" size={20} />
          </TouchableOpacity>
          <View style={styles.topBarTitleBlock}>
            <Text numberOfLines={1} style={styles.topBarTitle}>
              {currentGroup?.name ?? "Group chat"}
            </Text>
            <Text style={styles.topBarSubtitle}>Mock chat</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          style={styles.chatScroll}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Start the conversation with your group.</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.senderId === "me";
              return (
                <View
                  key={message.id}
                  style={[styles.messageRow, isCurrentUser ? styles.messageRowCurrentUser : styles.messageRowOther]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isCurrentUser ? styles.messageBubbleCurrentUser : styles.messageBubbleOther,
                    ]}
                  >
                    {!isCurrentUser ? (
                      <Text style={styles.messageSenderName}>{message.senderName}</Text>
                    ) : null}
                    <Text style={[styles.messageText, isCurrentUser && styles.messageTextCurrentUser]}>
                      {message.text}
                    </Text>
                    <Text style={[styles.messageTime, isCurrentUser && styles.messageTimeCurrentUser]}>
                      {formatMessageTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.composerRow, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
          <TextInput
            onChangeText={setDraftMessage}
            placeholder="Type a message..."
            placeholderTextColor="#99A3B5"
            style={styles.composerInput}
            value={draftMessage}
          />
          <TouchableOpacity
            disabled={!draftMessage.trim() || isSending}
            onPress={() => {
              void handleSendMessage();
            }}
            style={[
              styles.sendButton,
              (!draftMessage.trim() || isSending) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons color="#FFFFFF" name="send" size={16} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FCFCFE",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FCFCFE",
  },
  topBar: {
    alignItems: "center",
    borderBottomColor: "#E9EEF7",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  topBarTitleBlock: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  topBarTitle: {
    color: "#1E2B47",
    fontSize: 18,
    fontWeight: "800",
  },
  topBarSubtitle: {
    color: "#6D7B93",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5EAF3",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 26,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyTitle: {
    color: "#22304D",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#7A879B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  messageRowCurrentUser: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    borderRadius: 14,
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageBubbleCurrentUser: {
    backgroundColor: "#2D6BFF",
  },
  messageBubbleOther: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5EAF3",
    borderWidth: 1,
  },
  messageSenderName: {
    color: "#5A6780",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  messageText: {
    color: "#1E2B47",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  messageTextCurrentUser: {
    color: "#FFFFFF",
  },
  messageTime: {
    color: "#8F9AAF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "right",
  },
  messageTimeCurrentUser: {
    color: "rgba(255,255,255,0.78)",
  },
  composerRow: {
    alignItems: "center",
    borderTopColor: "#E9EEF7",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  composerInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDE4F1",
    borderRadius: 12,
    borderWidth: 1,
    color: "#1E2B47",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#2D6BFF",
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
