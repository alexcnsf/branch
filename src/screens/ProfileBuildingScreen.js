import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { auth, db, storage } from '../config/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

const ProfileBuildingScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Interests, 3: Photo
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    
    setErrorMessage('');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
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

  const uploadProfileImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profile_${auth.currentUser.uid}_${Date.now()}`;
      const storageRef = ref(storage, `profile_images/${filename}`);
      
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      const userId = auth.currentUser.uid;
      let profileData = {
        name,
        bio,
        interests,
        createdAt: new Date(),
        activityHistory: {},
      };
      
      if (profileImage) {
        const imageUrl = await uploadProfileImage(profileImage);
        if (imageUrl) {
          profileData.profileImage = imageUrl;
        }
      }
      
      await setDoc(doc(db, 'users', userId), profileData, { merge: true });
      
      // Navigate to main app - you'll need to update this based on your navigation
      // navigation.navigate('MainApp');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Your Profile</Text>
        <Text style={styles.stepText}>Step {step} of 3</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell us about yourself..."
            />
          </View>
        )}
        
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Interests</Text>
            <Text style={styles.description}>
              Add outdoor activities you enjoy. These will help us connect you with like-minded people.
            </Text>
            
            <View style={styles.interestInputContainer}>
              <TextInput
                style={styles.interestInput}
                value={newInterest}
                onChangeText={setNewInterest}
                placeholder="Add an interest..."
              />
              <TouchableOpacity style={styles.addButton} onPress={addInterest}>
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
        )}
        
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Profile Picture</Text>
            <Text style={styles.description}>
              Add a photo so others can recognize you.
            </Text>
            
            <TouchableOpacity onPress={handleImagePick} style={styles.photoContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={50} color={colors.primary.accent} />
                  <Text style={styles.photoText}>Tap to add a photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.buttonsContainer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {step < 3 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.nextButton, loading && styles.disabledButton]} 
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>Complete</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.dark,
  },
  stepText: {
    fontSize: 14,
    color: colors.primary.accent,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: colors.secondary.gray,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  interestInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: 20,
  },
  interestInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.secondary.gray,
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.light,
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
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: colors.primary.dark,
    marginRight: 6,
  },
  photoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: colors.secondary.light,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    color: colors.primary.dark,
    marginTop: 10,
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary.light,
  },
  backButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.primary.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: colors.primary.medium,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorText: {
    color: 'red',
    padding: 15,
    textAlign: 'center',
  },
});

export default ProfileBuildingScreen; 