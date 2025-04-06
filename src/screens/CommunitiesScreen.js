import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';

const CommunitiesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userCommunities, setUserCommunities] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCommunities();
    fetchAllCommunities();
  }, []);

  const fetchAllCommunities = async () => {
    try {
      const communitiesRef = collection(db, 'communities');
      const snapshot = await getDocs(communitiesRef);
      const communities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllCommunities(communities);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCommunities(userData.communities || []);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Please sign in to join communities');
        return;
      }

      // Update local state
      setUserCommunities(prev => [...prev, communityId]);

      // Update user's communities in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        communities: arrayUnion(communityId)
      });

      // Update community's members count
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        members: arrayUnion(currentUser.uid)
      });

      Alert.alert('Success', 'You have joined the community!');
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Failed to join community. Please try again.');
    }
  };

  const AvailabilityIndicator = ({ availability, onToggle }) => {
    const days = ['M', 'T', 'W', 'TH', 'F', 'S', 'SU'];
    
    return (
      <View style={styles.availabilityContainer}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.availabilityButton,
              availability[index] && styles.availabilityButtonSelected,
            ]}
            onPress={() => onToggle(index)}
          >
            <Text
              style={[
                styles.availabilityText,
                availability[index] && styles.availabilityTextSelected,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const CommunityCard = ({ community, isJoined }) => {
    const [localAvailability, setLocalAvailability] = useState(
      community.availability || [false, false, false, false, false, false, false]
    );

    const handleToggleAvailability = (index) => {
      const newAvailability = [...localAvailability];
      newAvailability[index] = !newAvailability[index];
      setLocalAvailability(newAvailability);
      // In a real app, you would update this in your database
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Discover', { communityId: community.id })}
      >
        <Image source={{ uri: community.image }} style={styles.communityImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.communityName}>{community.name}</Text>
            {!isJoined && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleJoinCommunity(community.id)}
              >
                <Ionicons name="add-circle" size={28} color={colors.primary.accent} />
              </TouchableOpacity>
            )}
          </View>
          {isJoined && (
            <AvailabilityIndicator 
              availability={localAvailability} 
              onToggle={handleToggleAvailability}
            />
          )}
          <View style={styles.memberInfo}>
            <Text style={styles.memberCount}>{community.members?.length || 0} members</Text>
            <Text style={styles.friendCount}>{community.friends || 0} friends</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const joinedCommunities = allCommunities.filter(
    community => userCommunities.includes(community.id)
  );

  const suggestedCommunities = allCommunities.filter(
    community => !userCommunities.includes(community.id)
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search communities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.secondary.gray}
        />
      </View>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Your Communities</Text>
        {joinedCommunities.map((community) => (
          <CommunityCard key={community.id} community={community} isJoined={true} />
        ))}
        
        <Text style={styles.sectionTitle}>Suggested</Text>
        {suggestedCommunities.map((community) => (
          <CommunityCard key={community.id} community={community} isJoined={false} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.primary.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.cream,
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    borderRadius: 20,
    paddingHorizontal: 16,
    color: colors.text.dark,
    backgroundColor: colors.secondary.cream,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 16,
    marginTop: 8,
    fontFamily: 'Beatrice', // Make sure to load this font in your app
  },
  card: {
    backgroundColor: colors.primary.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  communityImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.secondary.cream,
  },
  cardContent: {
    padding: 16,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 12,
    fontFamily: 'Beatrice',
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  availabilityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  availabilityButtonSelected: {
    backgroundColor: colors.primary.accent,
    borderColor: colors.primary.accent,
  },
  availabilityText: {
    color: colors.primary.main,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Beatrice',
  },
  availabilityTextSelected: {
    color: colors.primary.white,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberCount: {
    color: colors.primary.main,
    fontSize: 14,
    fontFamily: 'Beatrice',
  },
  friendCount: {
    color: colors.secondary.gray,
    fontSize: 14,
    fontFamily: 'Beatrice',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.secondary.gray,
    fontFamily: 'Beatrice',
  },
});

export default CommunitiesScreen; 