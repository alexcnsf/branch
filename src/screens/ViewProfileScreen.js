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
import { doc, getDoc } from 'firebase/firestore';

const ViewProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        setError('User profile not found');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      setProfile(userData);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
        
        {/* Header with profile photo and name */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {profile.profilePhoto ? (
              <Image 
                source={{ 
                  uri: typeof profile.profilePhoto === 'string' 
                    ? profile.profilePhoto 
                    : (profile.profilePhoto?.url || profile.profilePhoto),
                  headers: {
                    'Accept': 'image/jpeg,image/png,image/*',
                    'User-Agent': 'Mozilla/5.0'
                  }
                }} 
                style={styles.profileImage}
                onError={(e) => {
                  console.log('Image loading error:', e.nativeEvent.error);
                  console.log('Profile photo data:', profile.profilePhoto);
                  console.log('Attempted URL:', typeof profile.profilePhoto === 'string' 
                    ? profile.profilePhoto 
                    : (profile.profilePhoto?.url || profile.profilePhoto));
                }}
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
          </View>
        </View>
        
        {/* Bio section */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
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

        {/* Can Drive section */}
        {profile.canDrive && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transportation</Text>
            <View style={styles.driverInfo}>
              <Ionicons name="car" size={24} color={colors.primary.accent} />
              <Text style={styles.driverText}>Can drive</Text>
            </View>
          </View>
        )}

        {/* Notes section */}
        {profile.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{profile.notes}</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    backgroundColor: colors.secondary.cream,
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
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary.cream,
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
    backgroundColor: colors.secondary.cream,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: colors.primary.dark,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary.dark,
  },
  notesText: {
    fontSize: 16,
    color: colors.primary.dark,
    lineHeight: 24,
  },
});

export default ViewProfileScreen; 