import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { auth, db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (originalData) {
      const changed = 
        name !== originalData.name ||
        bio !== originalData.bio ||
        profileImage !== originalData.profileImage ||
        JSON.stringify(interests) !== JSON.stringify(originalData.interests);
      
      setHasChanges(changed);
    }
  }, [name, bio, profileImage, interests, originalData]);

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigation.navigate('Login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name || '');
        setBio(userData.bio || '');
        setInterests(userData.interests || []);
        setProfileImage(userData.profileImage || null);
        setOriginalData({
          name: userData.name || '',
          bio: userData.bio || '',
          interests: userData.interests || [],
          profileImage: userData.profileImage || null,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Compress image to 50% quality
        maxWidth: 1000, // Limit image width
        maxHeight: 1000, // Limit image height
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorMessage('Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (uri) => {
    try {
      if (!uri) {
        throw new Error('No image URI provided');
      }

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Failed to fetch image data');
      }

      const blob = await response.blob();
      const filename = `profile_${auth.currentUser.uid}_${Date.now()}`;
      const storageRef = ref(storage, `profile_images/${filename}`);
      
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMessage('Failed to upload image. Please try again.');
      return null;
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const userId = auth.currentUser.uid;
      let profileData = {
        name,
        bio,
        interests,
        updatedAt: new Date(),
      };
      
      if (profileImage) {
        const imageUrl = await uploadProfileImage(profileImage);
        if (imageUrl) {
          profileData.profileImage = imageUrl;
        }
      }
      
      await setDoc(doc(db, 'users', userId), profileData, { merge: true });
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving || !hasChanges}
          style={[
            styles.saveButton,
            (saving || !hasChanges) && styles.disabledButton
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity 
          style={styles.profileImageContainer} 
          onPress={handleImagePick}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="camera" size={40} color={colors.primary.accent} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </View>
          )}
          <View style={styles.editIconContainer}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="Tell us about yourself..."
            maxLength={300}
          />
          <Text style={styles.charCount}>{bio.length}/300</Text>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Interests</Text>
          <Text style={styles.subLabel}>
            Add outdoor activities you enjoy
          </Text>
          
          <View style={styles.interestInputContainer}>
            <TextInput
              style={styles.interestInput}
              value={newInterest}
              onChangeText={setNewInterest}
              placeholder="Add an interest..."
            />
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={addInterest}
              disabled={!newInterest.trim()}
            >
              <Ionicons name="add" size={24} color={colors.primary.accent} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.interestsContainer}>
            {interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
                <TouchableOpacity onPress={() => removeInterest(interest)}>
                  <Ionicons name="close" size={16} color={colors.primary.dark} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.dark,
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary.medium,
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: colors.primary.accent,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: colors.secondary.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary.gray,
  },
  addPhotoText: {
    color: colors.primary.dark,
    marginTop: 5,
    fontSize: 12,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary.accent,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.light,
  },
  formSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.light,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: colors.secondary.gray,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 5,
    color: colors.secondary.gray,
    fontSize: 12,
  },
  interestInputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  interestInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary.accent,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: colors.primary.dark,
    marginRight: 6,
  },
});

export default EditProfileScreen; 