import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const DiscoverScreen = ({ route, navigation }) => {
  const { communityId } = route.params || { communityId: '1' };
  const [matches, setMatches] = useState([]);
  const [checkedMatches, setCheckedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    console.log('DiscoverScreen mounted with communityId:', communityId);
    fetchCommunity();
    fetchCheckedMatches();
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      console.log('Fetching community data for ID:', communityId);
      const communityRef = doc(db, 'communities', communityId);
      const communityDoc = await getDoc(communityRef);
      
      if (communityDoc.exists()) {
        const communityData = communityDoc.data();
        console.log('Community data:', communityData);
        setCommunity(communityData);
        fetchActiveMembers(communityData);
      } else {
        console.log('Community document does not exist');
        Alert.alert('Error', 'Community not found');
      }
    } catch (error) {
      console.error('Error fetching community:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveMembers = async (communityData) => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get all unique active member IDs from all days
      const activeMemberIds = new Set();
      Object.values(communityData.activeMembers || {}).forEach(dayMembers => {
        dayMembers.forEach(id => activeMemberIds.add(id));
      });

      // Remove current user from the set
      activeMemberIds.delete(currentUser.uid);

      // Fetch user data for active members
      const matches = [];
      for (const userId of activeMemberIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Get user's availability for this specific community
          const communityAvailability = Array(7).fill(false);
          Object.entries(communityData.activeMembers || {}).forEach(([dayIndex, members]) => {
            if (members.includes(userId)) {
              communityAvailability[parseInt(dayIndex)] = true;
            }
          });

          matches.push({
            id: userId,
            name: userData.name,
            profilePhoto: userData.photoURL || userData.profileImage || null,
            availability: communityAvailability,
            canDrive: userData.canDrive || false,
            notes: userData.notes || '',
            activityCount: userData.activityCount || 0,
          });
        }
      }

      console.log('Found matches:', matches);
      setMatches(matches);
    } catch (error) {
      console.error('Error fetching active members:', error);
      Alert.alert('Error', 'Failed to load active members');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckedMatches = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCheckedMatches(userData.checkedMatches || []);
      }
    } catch (error) {
      console.error('Error fetching checked matches:', error);
    }
  };

  const handleCheckMatch = async (match) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Please sign in to check members');
        return;
      }

      console.log('Checking match with:', match.id);
      console.log('Current user:', currentUser.uid);

      // Update local state
      setCheckedMatches(prev => [...prev, match.id]);

      // Update current user's checked matches in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        checkedMatches: arrayUnion(match.id)
      });

      // Check if the other user has also checked this user
      const matchRef = doc(db, 'users', match.id);
      const matchDoc = await getDoc(matchRef);
      
      if (matchDoc.exists()) {
        const matchData = matchDoc.data();
        console.log('Match data:', matchData);
        
        if (matchData.checkedMatches?.includes(currentUser.uid)) {
          console.log('Mutual match detected! Creating chat...');
          
          // Create a unique chat ID by sorting user IDs
          const chatId = [currentUser.uid, match.id].sort().join('_');
          console.log('Creating chat with ID:', chatId);
          
          // Create chat document
          await setDoc(doc(db, 'chats', chatId), {
            participants: [currentUser.uid, match.id],
            createdAt: new Date(),
            lastMessage: null,
            lastMessageTime: new Date(),
            messages: [], // Initialize empty messages array
            participantsData: {
              [currentUser.uid]: {
                name: currentUser.displayName || 'User',
                photoURL: currentUser.photoURL,
              },
              [match.id]: {
                name: match.name,
                photoURL: match.profilePhoto,
              }
            }
          });

          // Add chat reference to both users' chat list
          // First, get the current chats array to ensure we don't duplicate
          const currentUserDoc = await getDoc(userRef);
          const matchUserDoc = await getDoc(matchRef);
          
          const currentUserChats = currentUserDoc.data()?.chats || [];
          const matchUserChats = matchUserDoc.data()?.chats || [];

          if (!currentUserChats.includes(chatId)) {
            await updateDoc(userRef, {
              chats: arrayUnion(chatId)
            });
            console.log('Added chat to current user');
          }

          if (!matchUserChats.includes(chatId)) {
            await updateDoc(matchRef, {
              chats: arrayUnion(chatId)
            });
            console.log('Added chat to match user');
          }

          console.log('Chat created and references added successfully');
          Alert.alert('Match!', `You and ${match.name} have matched! A chat has been created.`);
        } else {
          console.log('No mutual match yet');
          Alert.alert('Success', `You've checked ${match.name}! You'll be notified if they check you back.`);
        }
      }
    } catch (error) {
      console.error('Error checking match:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const MatchCard = ({ match }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.profileInfo}>
          <Image 
            source={{ 
              uri: match.profilePhoto 
                ? (typeof match.profilePhoto === 'string' 
                    ? match.profilePhoto 
                    : match.profilePhoto.url)
                : 'https://via.placeholder.com/40'
            }} 
            style={styles.profilePhoto} 
          />
          <View style={styles.nameContainer}>
            <Text style={styles.matchName}>{match.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.checkButton,
            checkedMatches.includes(match.id) && styles.checkButtonChecked
          ]}
          onPress={() => handleCheckMatch(match)}
          disabled={checkedMatches.includes(match.id)}
        >
          <Ionicons 
            name={checkedMatches.includes(match.id) ? "checkmark-circle" : "checkmark-circle-outline"} 
            size={24} 
            color={checkedMatches.includes(match.id) ? colors.primary.accent : colors.primary.main} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.matchDetails}>
        <View style={styles.availabilityContainer}>
          {match.availability.map((available, index) => (
            <View key={index} style={styles.dayContainer}>
              <Text style={styles.dayLabel}>{['M','T','W','Th','F','Sa','Su'][index]}</Text>
              <View
                style={[
                  styles.availabilityDot,
                  { backgroundColor: available ? colors.primary.accent : colors.secondary.gray },
                ]}
              />
            </View>
          ))}
        </View>
        {match.canDrive && (
          <View style={styles.driverInfo}>
            <Ionicons name="car" size={16} color={colors.primary.main} />
            <Text style={styles.driverLabel}>Can drive</Text>
          </View>
        )}
      </View>
      {match.notes && (
        <Text style={styles.notes}>{match.notes}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.accent} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>{community?.name || 'Community'}</Text>
        {matches.length > 0 ? (
          <FlatList
            data={matches}
            renderItem={({ item }) => <MatchCard match={item} />}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.matchesContainer}
          />
        ) : (
          <Text style={styles.emptyText}>
            No active members in this community
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: 'Beatrice',
  },
  matchesContainer: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: colors.primary.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
    fontFamily: 'Beatrice',
  },
  checkButton: {
    padding: 4,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonChecked: {
    backgroundColor: colors.primary.accent + '20',
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  availabilityLabel: {
    fontSize: 12,
    color: colors.primary.main,
    marginRight: 6,
    fontFamily: 'Beatrice',
  },
  dayContainer: {
    alignItems: 'center',
    marginRight: 6, 
  },
  dayLabel: {
    fontSize: 10,
    color: colors.primary.main,
    marginBottom: 2,
    fontFamily: 'Beatrice',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverLabel: {
    color: colors.primary.main,
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Beatrice',
  },
  notes: {
    marginTop: 8,
    color: colors.secondary.gray,
    fontSize: 12,
    fontFamily: 'Beatrice',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.secondary.gray,
    fontSize: 16,
    marginTop: 20,
    fontFamily: 'Beatrice',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondary.gray,
    fontFamily: 'Beatrice',
  },
});

export default DiscoverScreen; 