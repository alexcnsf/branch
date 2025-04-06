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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const DiscoverScreen = ({ route, navigation }) => {
  const { communityId } = route.params || { communityId: '1' }; // Default to first community if not provided
  const [availability, setAvailability] = useState([false, false, false, false, false, false, false]);
  const [hasSelectedAvailability, setHasSelectedAvailability] = useState(false);
  const [anonymousStats, setAnonymousStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [checkedMatches, setCheckedMatches] = useState([]);

  // Mock data for anonymous availability stats
  const mockAnonymousStats = {
    monday: 24,
    tuesday: 18,
    wednesday: 32,
    thursday: 21,
    friday: 15,
    saturday: 42,
    sunday: 38,
  };

  // Mock data for matches
  const mockMatches = [
    {
      id: '1',
      name: 'Alex Johnson',
      isFriend: true,
      mutualFriends: 0,
      availability: [true, false, true, true, false, true, true],
      canDrive: true,
      profilePhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
      similarityScore: 0.92,
      activityCount: 15,
      notes: 'Experienced surfer, can bring extra boards',
    },
    {
      id: '2',
      name: 'Sarah Chen',
      isFriend: false,
      mutualFriends: 3,
      availability: [true, true, false, true, true, false, true],
      canDrive: false,
      profilePhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
      similarityScore: 0.85,
      activityCount: 8,
      notes: 'New to hiking but very enthusiastic',
    },
    {
      id: '3',
      name: 'Michael Rodriguez',
      isFriend: true,
      mutualFriends: 0,
      availability: [false, true, true, false, true, true, false],
      canDrive: true,
      profilePhoto: 'https://randomuser.me/api/portraits/men/22.jpg',
      similarityScore: 0.78,
      activityCount: 12,
      notes: 'Professional photographer, can take group photos',
    },
    {
      id: '4',
      name: 'Emma Wilson',
      isFriend: false,
      mutualFriends: 2,
      availability: [true, false, true, false, true, true, true],
      canDrive: true,
      profilePhoto: 'https://randomuser.me/api/portraits/women/33.jpg',
      similarityScore: 0.91,
      activityCount: 20,
      notes: 'Certified climbing instructor',
    },
    {
      id: '5',
      name: 'David Kim',
      isFriend: false,
      mutualFriends: 1,
      availability: [false, true, false, true, false, true, false],
      canDrive: false,
      profilePhoto: 'https://randomuser.me/api/portraits/men/45.jpg',
      similarityScore: 0.82,
      activityCount: 6,
      notes: 'Has all the necessary gear',
    },
    {
      id: '6',
      name: 'Lisa Patel',
      isFriend: true,
      mutualFriends: 0,
      availability: [true, true, true, false, false, true, true],
      canDrive: true,
      profilePhoto: 'https://randomuser.me/api/portraits/women/28.jpg',
      similarityScore: 0.95,
      activityCount: 25,
      notes: 'First aid certified, experienced guide',
    },
    {
      id: '7',
      name: 'James Wilson',
      isFriend: false,
      mutualFriends: 4,
      availability: [false, true, true, true, false, false, true],
      canDrive: true,
      profilePhoto: 'https://randomuser.me/api/portraits/men/36.jpg',
      similarityScore: 0.88,
      activityCount: 10,
      notes: 'Can bring snacks and drinks',
    },
    {
      id: '8',
      name: 'Sophia Lee',
      isFriend: true,
      mutualFriends: 0,
      availability: [true, false, false, true, true, true, false],
      canDrive: false,
      profilePhoto: 'https://randomuser.me/api/portraits/women/42.jpg',
      similarityScore: 0.93,
      activityCount: 18,
      notes: 'Speaks multiple languages',
    },
    {
      id: '9',
      name: 'Ryan Thompson',
      isFriend: false,
      mutualFriends: 2,
      availability: [false, true, false, true, true, false, true],
      canDrive: true,
      profilePhoto: 'https://randomuser.me/api/portraits/men/29.jpg',
      similarityScore: 0.84,
      activityCount: 9,
      notes: 'Has a drone for aerial shots',
    },
    {
      id: '10',
      name: 'Olivia Martinez',
      isFriend: false,
      mutualFriends: 1,
      availability: [true, true, false, false, true, true, true],
      canDrive: true,
      profilePhoto: 'https://randomuser.me/api/portraits/women/31.jpg',
      similarityScore: 0.87,
      activityCount: 14,
      notes: 'Can organize group activities',
    },
  ];

  useEffect(() => {
    // Fetch user's checked matches when component mounts
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

    fetchCheckedMatches();
    setAnonymousStats(mockAnonymousStats);
    calculateMatches();
  }, [availability]);

  const calculateMatches = () => {
    // This is a simplified version of the matching algorithm
    const scoredMatches = mockMatches.map(match => {
      let score = 0;
      
      // 1. Friendship score (40% weight)
      if (match.isFriend) score += 40;
      else if (match.mutualFriends > 0) score += 20 + (match.mutualFriends * 5);
      
      // 2. Availability overlap (30% weight)
      const overlap = match.availability.filter((avail, i) => avail && availability[i]).length;
      score += (overlap / 5) * 30;
      
      // 3. Similarity score (20% weight)
      score += match.similarityScore * 20;
      
      // 4. Activity count (10% weight)
      score += Math.min(match.activityCount / 20, 1) * 10;
      
      return { ...match, matchScore: score };
    });

    // Sort by match score and take top 10
    const sortedMatches = scoredMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
    
    setMatches(sortedMatches);
  };

  const AvailabilitySelector = () => (
    <View style={styles.availabilitySection}>
      <Text style={styles.sectionTitle}>Select Your Availability</Text>
      <View style={styles.availabilityContainer}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.availabilityButton,
              availability[index] && styles.availabilityButtonSelected,
            ]}
            onPress={() => {
              const newAvailability = [...availability];
              newAvailability[index] = !newAvailability[index];
              setAvailability(newAvailability);
              setHasSelectedAvailability(true);
            }}
          >
            <Text
              style={[
                styles.availabilityText,
                availability[index] && styles.availabilityTextSelected,
              ]}
            >
              {day}
            </Text>
            {anonymousStats && (
              <Text style={styles.availabilityCount}>
                {anonymousStats[day.toLowerCase()]}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleCheckMatch = async (match) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

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
        if (matchData.checkedMatches?.includes(currentUser.uid)) {
          // Both users have checked each other - create a chat
          const chatId = [currentUser.uid, match.id].sort().join('_');
          
          await setDoc(doc(db, 'chats', chatId), {
            participants: [currentUser.uid, match.id],
            createdAt: new Date(),
            lastMessage: null,
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

          Alert.alert('Match!', `You and ${match.name} have matched! A chat has been created.`);
        } else {
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
          <Image source={{ uri: match.profilePhoto }} style={styles.profilePhoto} />
          <View style={styles.nameContainer}>
            <Text style={styles.matchName}>{match.name}</Text>
            {match.isFriend ? (
              <Text style={styles.friendLabel}>Friend</Text>
            ) : match.mutualFriends > 0 ? (
              <Text style={styles.mutualLabel}>{match.mutualFriends} mutual friends</Text>
            ) : null}
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
            <View
              key={index}
              style={[
                styles.availabilityDot,
                { backgroundColor: available ? colors.primary.accent : colors.secondary.gray },
              ]}
            />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {!hasSelectedAvailability ? (
          <>
            <AvailabilitySelector />
            <View style={styles.anonymousStats}>
              <Text style={styles.anonymousTitle}>People Available</Text>
              <View style={styles.statsContainer}>
                {Object.entries(anonymousStats || {}).map(([day, count]) => (
                  <View key={day} style={styles.statItem}>
                    <Text style={styles.statDay}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                    <Text style={styles.statCount}>{count} people</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <AvailabilitySelector />
            <Text style={styles.sectionTitle}>Top Matches</Text>
            <FlatList
              data={matches}
              renderItem={({ item }) => <MatchCard match={item} />}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.matchesContainer}
            />
          </>
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
  availabilitySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.cream,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: 'Beatrice',
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  availabilityButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    width: '18%',
    alignItems: 'center',
  },
  availabilityButtonSelected: {
    backgroundColor: colors.primary.accent,
    borderColor: colors.primary.accent,
  },
  availabilityText: {
    color: colors.primary.main,
    fontSize: 14,
    fontFamily: 'Beatrice',
  },
  availabilityTextSelected: {
    color: colors.primary.white,
  },
  availabilityCount: {
    fontSize: 12,
    color: colors.secondary.gray,
    marginTop: 4,
  },
  anonymousStats: {
    padding: 16,
  },
  anonymousTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 16,
    fontFamily: 'Beatrice',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 12,
    backgroundColor: colors.secondary.cream,
    borderRadius: 8,
    marginBottom: 12,
  },
  statDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 4,
    fontFamily: 'Beatrice',
  },
  statCount: {
    fontSize: 14,
    color: colors.secondary.gray,
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
  friendLabel: {
    color: colors.primary.accent,
    fontSize: 12,
    fontFamily: 'Beatrice',
  },
  mutualLabel: {
    color: colors.secondary.gray,
    fontSize: 12,
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
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
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
});

export default DiscoverScreen; 