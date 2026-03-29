import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { messagesApi } from '../../api/messages.api';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { SocketEvents } from '@ride-out/shared';
import type { Message } from '@ride-out/shared';
import { formatRelativeTime } from '@ride-out/shared';

export function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { convId, participantName } = route.params;
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: participantName });
  }, [participantName]);

  const { data } = useQuery({
    queryKey: ['messages', convId],
    queryFn: () => messagesApi.getMessages(convId),
  });

  useEffect(() => {
    if (data) setMessages(data.data.data);
  }, [data]);

  useEffect(() => {
    if (!socket || !convId) return;
    socket.emit('conversation:join', convId);
    const onMsg = (msg: Message) => setMessages((prev) => [...prev, msg]);
    socket.on(SocketEvents.MESSAGE_NEW, onMsg);
    return () => {
      socket.emit('conversation:leave', convId);
      socket.off(SocketEvents.MESSAGE_NEW, onMsg);
    };
  }, [socket, convId]);

  const handleSend = () => {
    if (!text.trim() || !socket) return;
    socket.emit(SocketEvents.MESSAGE_SEND, { conversationId: convId, content: text.trim() });
    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.content}
              </Text>
              <Text style={[styles.time, isMe ? styles.timeMe : styles.timeThem]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={text}
          onChangeText={setText}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!text.trim()}>
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10 },
  bubbleMe: { backgroundColor: '#FF6B00', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#242424', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#F0F0F0' },
  time: { fontSize: 11, marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  timeThem: { color: '#888' },
  inputRow: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#242424' },
  input: { flex: 1, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: '#F0F0F0' },
  sendButton: { backgroundColor: '#FF6B00', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
