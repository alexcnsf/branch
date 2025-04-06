import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

const MessagingScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('MessagingScreen mounted');
    const unsubscribe = setupChatsListener();
    return () => {
      console.log('MessagingScreen unmounted');
      unsubscribe();
    };
  }, []);

  const setupChatsListener = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No current user found');
      setLoading(false);
      return;
    }

    console.log('Setting up chats listener for user:', currentUser.uid);

    // Listen to the user's document for chat references
    return onSnapshot(doc(db, 'users', currentUser.uid), async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data:', userData);
        
        const chatIds = userData.chats || [];
        console.log('Found chat IDs:', chatIds);

        if (chatIds.length === 0) {
          console.log('No chats found for user');
          setChats([]);
          setLoading(false);
          return;
        }

        // Fetch all chat documents
        const chatPromises = chatIds.map(async (chatId) => {
          try {
            console.log('Fetching chat:', chatId);
            const chatDoc = await getDocs(query(collection(db, 'chats'), where('id', '==', chatId)));
            
            if (!chatDoc.empty) {
              const chatData = chatDoc.docs[0].data();
              console.log('Chat data for', chatId, ':', chatData);
              
              // Get the other user's data
              const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
              if (otherUserId) {
                const otherUserDoc = await getDocs(query(collection(db, 'users'), where('id', '==', otherUserId)));
                if (!otherUserDoc.empty) {
                  const otherUserData = otherUserDoc.docs[0].data();
                  return {
                    id: chatId,
                    lastMessage: chatData.lastMessage || 'No messages yet',
                    lastMessageTime: chatData.lastMessageTime?.toDate() || new Date(),
                    otherUser: {
                      name: otherUserData.name,
                      photoURL: otherUserData.photoURL
                    },
                    unreadCount: chatData.unreadCount?.[currentUser.uid] || 0
                  };
                }
              }
            }
            return null;
          } catch (error) {
            console.error('Error fetching chat:', chatId, error);
            return null;
          }
        });

        try {
          const chatResults = await Promise.all(chatPromises);
          console.log('Raw chat results:', chatResults);
          
          const validChats = chatResults
            .filter(chat => chat !== null)
            .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
          
          console.log('Valid chats after processing:', validChats);
          setChats(validChats);
        } catch (error) {
          console.error('Error processing chats:', error);
        }
      } else {
        console.log('User document does not exist');
      }
      setLoading(false);
    });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat', { chatId: item.id })}
    >
      <Image 
        source={{ uri: item.otherUser?.photoURL || 'https://via.placeholder.com/50' }} 
        style={styles.avatar} 
      />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.otherUser?.name || 'Unknown User'}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.timeContainer}>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
        <Text style={styles.timeText}>
          {item.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      {chats.length > 0 ? (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatsContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={64} color={colors.secondary.gray} />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Match with other members to start chatting
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.cream,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.main,
    fontFamily: 'Beatrice',
  },
  chatsContainer: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.cream,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 4,
    fontFamily: 'Beatrice',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.secondary.gray,
    fontFamily: 'Beatrice',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: colors.secondary.gray,
    fontFamily: 'Beatrice',
  },
  unreadBadge: {
    backgroundColor: colors.primary.accent,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadCount: {
    color: colors.primary.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginTop: 16,
    fontFamily: 'Beatrice',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.secondary.gray,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Beatrice',
  },
});

export default MessagingScreen; 