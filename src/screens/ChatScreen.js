import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot, Timestamp } from 'firebase/firestore';

const ChatScreen = ({ route, navigation }) => {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    fetchChatData();
    const unsubscribe = setupMessagesListener();
    return () => unsubscribe();
  }, [chatId]);

  const fetchChatData = async () => {
    try {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        setChatData(chatDoc.data());
        navigation.setOptions({
          title: chatDoc.data().participantsData[auth.currentUser.uid === chatDoc.data().participants[0] ? chatDoc.data().participants[1] : chatDoc.data().participants[0]].name
        });
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    }
  };

  const setupMessagesListener = () => {
    return onSnapshot(doc(db, 'chats', chatId), (doc) => {
      if (doc.exists()) {
        setMessages(doc.data().messages || []);
        setLoading(false);
      }
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = {
        text: newMessage.trim(),
        senderId: auth.currentUser.uid,
        timestamp: Timestamp.now(),
      };

      await updateDoc(doc(db, 'chats', chatId), {
        messages: arrayUnion(message),
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === auth.currentUser.uid;
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && (
          <Image
            source={{ uri: chatData?.participantsData[item.senderId]?.photoURL }}
            style={styles.avatar}
          />
        )}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isMe && styles.myTimestamp]}>
            {new Date(item.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.secondary.gray}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={24}
              color={newMessage.trim() ? colors.primary.accent : colors.secondary.gray}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: colors.primary.accent,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.secondary.cream,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Beatrice',
  },
  myText: {
    color: colors.primary.white,
  },
  theirText: {
    color: colors.primary.main,
  },
  timestamp: {
    fontSize: 12,
    color: colors.secondary.gray,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: '#E0E0E0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.secondary.cream,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.secondary.cream,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontFamily: 'Beatrice',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen; 