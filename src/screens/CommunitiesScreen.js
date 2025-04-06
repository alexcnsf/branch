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
  ActivityIndicator,
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
  const [joiningCommunity, setJoiningCommunity] = useState(null);

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
      Alert.alert('Error', 'Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setUserCommunities([]);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCommunities(userData.communities || []);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
      Alert.alert('Error', 'Failed to load your communities. Please try again.');
    }
  };

  const handleJoinCommunity = async (communityId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to join communities',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    try {
      setJoiningCommunity(communityId);

      // Update user's communities in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        communities: arrayUnion(communityId)
      });

      // Update community's members in Firestore
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        members: arrayUnion(currentUser.uid)
      });

      // Update local state
      setUserCommunities(prev => [...prev, communityId]);
      
      // Show success message
      Alert.alert('Success', 'You have joined the community!');
      
      // Refresh the communities lists
      fetchAllCommunities();
      fetchUserCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Failed to join community. Please try again.');
    } finally {
      setJoiningCommunity(null);
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

    const handleToggleAvailability = async (index) => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert(
            'Sign In Required',
            'Please sign in to set your availability',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign In', onPress: () => navigation.navigate('Login') }
            ]
          );
          return;
        }

        const newAvailability = [...localAvailability];
        newAvailability[index] = !newAvailability[index];
        setLocalAvailability(newAvailability);

        // Update the community document
        const communityRef = doc(db, 'communities', community.id);
        
        if (newAvailability[index]) {
          // Add user to activeMembers for this day
          await updateDoc(communityRef, {
            [`activeMembers.${index}`]: arrayUnion(currentUser.uid)
          });
        } else {
          // Remove user from activeMembers for this day
          const communityDoc = await getDoc(communityRef);
          const currentActiveMembers = communityDoc.data()?.activeMembers?.[index] || [];
          const updatedActiveMembers = currentActiveMembers.filter(
            memberId => memberId !== currentUser.uid
          );
          
          await updateDoc(communityRef, {
            [`activeMembers.${index}`]: updatedActiveMembers
          });
        }
      } catch (error) {
        console.error('Error updating availability:', error);
        Alert.alert('Error', 'Failed to update availability. Please try again.');
        // Revert local state on error
        setLocalAvailability(prev => {
          const reverted = [...prev];
          reverted[index] = !reverted[index];
          return reverted;
        });
      }
    };

    const isJoining = joiningCommunity === community.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Discover', { communityId: community.id })}
      >
        <Image source={{ uri: community.image }} style={styles.communityImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.memberCount}>
                {community.members?.length || 0} members
              </Text>
            </View>
            {!isJoined && (
              <TouchableOpacity
                style={[styles.addButton, isJoining && styles.addButtonDisabled]}
                onPress={() => handleJoinCommunity(community.id)}
                disabled={isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color={colors.primary.accent} />
                ) : (
                  <Ionicons name="add-circle" size={28} color={colors.primary.accent} />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {community.description}
          </Text>

          {isJoined && (
            <AvailabilityIndicator 
              availability={localAvailability} 
              onToggle={handleToggleAvailability}
            />
          )}
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
          <ActivityIndicator size="large" color={colors.primary.accent} />
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
        {joinedCommunities.length > 0 ? (
          joinedCommunities.map((community) => (
            <CommunityCard key={community.id} community={community} isJoined={true} />
          ))
        ) : (
          <Text style={styles.emptyText}>
            Join some communities to see them here!
          </Text>
        )}
        
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
    fontFamily: 'Beatrice',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 4,
    fontFamily: 'Beatrice',
  },
  description: {
    fontSize: 14,
    color: colors.secondary.gray,
    marginBottom: 12,
    fontFamily: 'Beatrice',
  },
  memberCount: {
    fontSize: 14,
    color: colors.secondary.gray,
    fontFamily: 'Beatrice',
  },
  addButton: {
    padding: 4,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  availabilityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyText: {
    textAlign: 'center',
    color: colors.secondary.gray,
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Beatrice',
  },
});

export default CommunitiesScreen; 