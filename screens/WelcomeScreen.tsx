import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Typography, Icon } from '../components';
import { Colors } from '../constants/colors';
import { heightScale, mediumScale } from '../constants/size';

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
          <View style={styles.iconContainer}>
            <Icon name="inventory" size={120} color={Colors.primary} />
          </View>
          <View style={styles.iconRow}>
            <Icon name="receipt" size={60} color={Colors.secondary} />
            <Icon name="shopping-cart" size={60} color={Colors.secondary} />
          </View>
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
    borderRadius: mediumScale(30),
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightScale(20),
  },
  iconRow: {
    flexDirection: 'row',
    gap: mediumScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flex: 0.35,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: heightScale(30),
    paddingHorizontal: mediumScale(25),
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    marginBottom: heightScale(10),
    marginTop: heightScale(5),
  },
  description: {
    marginBottom: heightScale(15),
    paddingHorizontal: mediumScale(10),
    marginTop: heightScale(20)
  },
  getStartedText: {
    color: Colors.white,
    fontSize: mediumScale(18),
    fontWeight: '600',
  },
});
