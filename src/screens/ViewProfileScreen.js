import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const ViewProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params; // Get the userId from navigation params
  const [profile, setProfile] = useState(null);
  const [connectionDegree, setConnectionDegree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the profile data of the user we're viewing
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        setError('User profile not found');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      setProfile(userData);
      
      // Extract activities from the activityHistory
      if (userData.activityHistory) {
        const activitiesArray = Object.entries(userData.activityHistory).map(([name, count]) => ({
          name,
          count
        })).sort((a, b) => b.count - a.count); // Sort by count in descending order
        
        setActivities(activitiesArray);
      }
      
      // Calculate connection degree
      await calculateConnectionDegree(userId);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateConnectionDegree = async (targetUserId) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || currentUserId === targetUserId) {
      return; // No need to calculate for self
    }

    try {
      // Get current user's friends
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      const currentUserFriends = currentUserDoc.data()?.friends || [];
      
      // 1st degree - direct friend
      if (currentUserFriends.includes(targetUserId)) {
        setConnectionDegree('1st');
        return;
      }
      
      // 2nd degree - friend of friend (simplified implementation)
      let isSecondDegree = false;
      
      for (const friendId of currentUserFriends) {
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        const friendFriends = friendDoc.data()?.friends || [];
        
        if (friendFriends.includes(targetUserId)) {
          isSecondDegree = true;
          break;
        }
      }
      
      if (isSecondDegree) {
        setConnectionDegree('2nd');
      } else {
        setConnectionDegree('3rd+');
      }
      
    } catch (error) {
      console.error('Error calculating connection degree:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.accent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TouchableOpacity 
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary.dark} />
        </TouchableOpacity>
        
        {/* Header with profile photo, name and connection degree */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {profile.profilePhoto ? (
              <Image 
                source={{ uri: typeof profile.profilePhoto === 'string' ? profile.profilePhoto : profile.profilePhoto.url }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.placeholderText}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profile.name}</Text>
            {connectionDegree && (
              <View style={styles.connectionBadge}>
                <Text style={styles.connectionText}>{connectionDegree}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Bio section */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}
        
        {/* Activity badges section */}
        {activities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activities</Text>
            <View style={styles.activitiesBadgesContainer}>
              {activities.map((activity, index) => (
                <View key={index} style={styles.activityBadge}>
                  <View style={styles.badgeCircle}>
                    <Text style={styles.badgeCount}>{activity.count}</Text>
                  </View>
                  <Text style={styles.badgeName}>{activity.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Interests section */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.light,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary.accent,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backArrow: {
    padding: 15,
    position: 'absolute',
    zIndex: 10,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: colors.background.light,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.primary.accent,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary.dark,
  },
  nameContainer: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 8,
  },
  connectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.primary.accent,
    borderRadius: 16,
  },
  connectionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: colors.primary.dark,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: colors.primary.dark,
  },
  activitiesBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activityBadge: {
    alignItems: 'center',
    width: 80,
    marginRight: 12,
    marginBottom: 16,
  },
  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  badgeName: {
    color: colors.primary.dark,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default ViewProfileScreen; 