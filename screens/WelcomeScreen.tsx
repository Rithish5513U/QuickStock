import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import Typography from '../components/Typography';
import { Colors } from '../constants/colors';

export default function WelcomeScreen({ navigation }: any) {
  const imageAnim = useRef(new Animated.Value(300)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(-100)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    playAnimation();
  }, []);

  const playAnimation = () => {
    // Reset animation values
    imageAnim.setValue(300);
    textOpacity.setValue(0);
    textTranslateX.setValue(-100);
    buttonOpacity.setValue(0);

    Animated.sequence([
      // Image animation - pop up from bottom
      Animated.spring(imageAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Text animation - fade in from left to right
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateX, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Button fade in
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving welcome flag:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.imageContainer,
          { transform: [{ translateY: imageAnim }] }
        ]}
      >
        <View style={styles.imageWrapper}>
          <Image 
            source={require('../assets/landing-img.jpg')} 
            resizeMode="cover"
            style={styles.image}
          />
        </View>
      </Animated.View>

      <View style={styles.bottomContainer}>
        <Animated.View 
          style={[
            styles.textContainer,
            { 
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }]
            }
          ]}
        >
          <Typography variant="h1">Trendwise</Typography>
          <Typography variant="h3" style={styles.subtitle}>
            Your smart inventory partner
          </Typography>
          <Typography variant="body" align="center" style={styles.description}>
            Track inventory, manage stock levels, generate invoices, and grow your business with ease - all in one place.
          </Typography>
        </Animated.View>

        <Animated.View style={{ width: '100%', alignItems: 'center', opacity: buttonOpacity }}>
          <Button 
            title="Get started" 
            onPress={handleGetStarted}
            size="large"
            fullWidth
          />
        </Animated.View>
      </View>
      
      <StatusBar style="dark" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    flex: 0.65,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10%',
    paddingTop: '20%'
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    flex: 0.35,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 30,
    paddingHorizontal: 25,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    marginBottom: 10,
    marginTop: 5,
  },
  description: {
    marginBottom: 15,
    paddingHorizontal: 10,
    marginTop: 20
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
