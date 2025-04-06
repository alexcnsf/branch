import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={120} color={colors.primary.accent} />
        </View>
        <Text style={styles.title}>Welcome to Branch</Text>
        <Text style={styles.subtitle}>
          Connect with like-minded outdoor enthusiasts and discover new adventures
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Beatrice',
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary.gray,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    fontFamily: 'Beatrice',
  },
  button: {
    backgroundColor: colors.primary.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: colors.primary.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Beatrice',
  },
  loginButton: {
    paddingVertical: 16,
  },
  loginText: {
    color: colors.primary.main,
    fontSize: 16,
    fontFamily: 'Beatrice',
  },
});

export default OnboardingScreen; 