import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3;
const ROTATION_MULTIPLIER = 0.1;

interface SwipeCardProps {
  imageUri: string;
  index: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

export default function SwipeCard({
  imageUri,
  index,
  onSwipeLeft,
  onSwipeRight,
  isTop,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      if (isTop) {
        scale.value = withSpring(1.05);
      }
    },
    onActive: (event) => {
      if (isTop) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        
        // Add rotation based on horizontal movement
        const rotation = (event.translationX / screenWidth) * ROTATION_MULTIPLIER;
        translateX.value = event.translationX;
      }
    },
    onEnd: (event) => {
      if (isTop) {
        const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD;
        const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD;
        
        if (shouldSwipeLeft) {
          // Swipe left
          translateX.value = withTiming(-screenWidth * 1.5, { duration: 300 });
          opacity.value = withTiming(0, { duration: 300 });
          runOnJS(onSwipeLeft)();
        } else if (shouldSwipeRight) {
          // Swipe right
          translateX.value = withTiming(screenWidth * 1.5, { duration: 300 });
          opacity.value = withTiming(0, { duration: 300 });
          runOnJS(onSwipeRight)();
        } else {
          // Return to center
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          scale.value = withSpring(1);
        }
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = (translateX.value / screenWidth) * ROTATION_MULTIPLIER;
    
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}rad` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const zIndex = isTop ? 1 : 0;
    const scaleValue = isTop ? 1 : 0.95 - (index * 0.05);
    
    return {
      zIndex,
      transform: [{ scale: scaleValue }],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} enabled={isTop}>
      <Animated.View style={[styles.container, cardStyle]}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          
          {/* Action buttons overlay */}
          {isTop && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.dislikeButton]}
                onPress={onSwipeLeft}
              >
                <ThemedText style={styles.actionButtonText}>✕</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={onSwipeRight}
              >
                <ThemedText style={styles.actionButtonText}>♥</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Swipe indicators */}
          {isTop && (
            <>
              <View style={[styles.swipeIndicator, styles.leftIndicator]}>
                <ThemedText style={styles.swipeIndicatorText}>NOPE</ThemedText>
              </View>
              <View style={[styles.swipeIndicator, styles.rightIndicator]}>
                <ThemedText style={styles.swipeIndicatorText}>LIKE</ThemedText>
              </View>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: screenWidth - 40,
    height: '80%',
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dislikeButton: {
    backgroundColor: '#ff4757',
  },
  likeButton: {
    backgroundColor: '#2ed573',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    transform: [{ rotate: '-30deg' }],
    opacity: 0,
  },
  leftIndicator: {
    left: 20,
    backgroundColor: 'rgba(255, 71, 87, 0.8)',
  },
  rightIndicator: {
    right: 20,
    backgroundColor: 'rgba(46, 213, 115, 0.8)',
    transform: [{ rotate: '30deg' }],
  },
  swipeIndicatorText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
