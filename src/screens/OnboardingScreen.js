// src/screens/OnboardingScreen.js

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const WINE  = '#E60012';
const GOLD  = '#D6A23A';
const WHITE = '#FFFFFF';
const BLACK = '#1A1A1A';

const slides = [
  {
    id: '1',
    image: require('../../assets/onboard1.png'),
    titleBlack: 'Share love',
    titleWine: 'Receive blessings',
    subtitle: 'Create your event, share with your loved ones and receive contributions with ease.',
  },
  {
    id: '2',
    image: require('../../assets/onboard2.png'),
    titleBlack: 'Contribute',
    titleWine: 'with a tap',
    subtitle: 'Send gifts and cash contributions instantly to the people who matter most.',
  },
  {
    id: '3',
    image: require('../../assets/onboard3.png'),
    titleBlack: 'Share & invite',
    titleWine: 'everyone',
    subtitle: 'Share your event link or QR code with guests and track every contribution live.',
  },
];

function DotIndicator({ count, activeIndex }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function Slide({ item }) {
  return (
    <View style={styles.slide}>
      <View style={styles.textBlock}>
        <Text style={styles.titleBlack}>{item.titleBlack}</Text>
        <Text style={styles.titleWine}>{item.titleWine}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      <Image
        source={item.image}
        style={styles.illustration}
        resizeMode="contain"
      />
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const isLast = activeIndex === slides.length - 1;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (isLast) {
      // ✅ Changed replace to navigate
      navigation.navigate('GetStarted');
      return;
    }
    flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        style={{ flex: 1 }}
      />

      <View style={styles.bottom}>
        <DotIndicator count={slides.length} activeIndex={activeIndex} />

        <Animated.View style={[styles.btnWrap, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            style={styles.btn}
            onPress={handleNext}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            <Text style={styles.btnText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        >
          <Text style={styles.signInText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  slide: {
    width,
    flex: 1,
    paddingTop: height * 0.13,
    paddingHorizontal: 28,
    alignItems: 'flex-start',
  },
  textBlock: { marginBottom: 0 },
  titleBlack: { fontSize: 52, fontWeight: '800', color: BLACK, lineHeight: 60 },
  titleWine: { fontSize: 40, fontWeight: '800', color: WINE, lineHeight: 48, marginBottom: 12 },
  subtitle: { fontSize: 16, lineHeight: 26, color: '#666666' },
  illustration: { width: width - 56, height: width - 56, marginTop: 8, alignSelf: 'center' },
  bottom: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 8, alignItems: 'center', gap: 14 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { borderRadius: 100 },
  dotActive: { width: 32, height: 10, backgroundColor: WINE },
  dotInactive: { width: 10, height: 10, backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: GOLD },
  btnWrap: { width: '100%' },
  btn: { backgroundColor: WINE, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: WINE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  btnText: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
  signInText: { fontSize: 14, color: WINE, fontWeight: '600', textDecorationLine: 'underline' },
});