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
import { auth, db, storage } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Add a listener for when the screen comes back into focus
  // This ensures the profile refreshes after editing
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchProfileData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        // Handle not logged in case
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.accent} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    // If no profile exists yet, show options to create one
    return (
      <SafeAreaView style={styles.noProfileContainer}>
        <Text style={styles.noProfileText}>Create your profile to get started</Text>
        <TouchableOpacity 
          style={styles.createProfileButton}
          onPress={() => navigation.navigate('ProfileBuilding')}
        >
          <Text style={styles.createProfileButtonText}>Create Profile</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {profile.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profile.name || 'Your Name'}</Text>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
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
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.light,
  },
  noProfileText: {
    fontSize: 18,
    color: colors.primary.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  createProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary.accent,
    borderRadius: 8,
  },
  createProfileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    padding: 20,
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
  profileImagePlaceholderText: {
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
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary.accent,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
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

export default ProfileScreen; 