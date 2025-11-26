import { StyleSheet, Dimensions } from 'react-native';
import { EventSubscription } from "expo-modules-core";

import { useState, useEffect } from "react";
import { Accelerometer, Magnetometer } from 'expo-sensors';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

import { View } from "@/components/ui/view";
import { Button } from "@/components/ui/button";
import { shallowEqual, useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { ProfileState, profileSlice } from '@/store/profileSlice';
import { RootState, AppDispatch } from '@/store';

const { actions } = profileSlice;

const { width, height } = Dimensions.get('screen');

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}


export default function() {

  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
  const profile = useAppSelector(state => state.profile, shallowEqual);
  const { x, y } = profile;

  const scale = useSharedValue(profile.scale);
  const startScale = useSharedValue(0);

  const angle = useSharedValue(profile.angle);
  const startAngle = useSharedValue(0);

  const translationX = useSharedValue(x);
  const translationY = useSharedValue(y);
  const prevTranslationX = useSharedValue(x);
  const prevTranslationY = useSharedValue(y);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const dispatch = useDispatch<AppDispatch>();


  const pan = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
    })
    .onUpdate((event) => {
      const maxTranslateX = width / 2 - 20;
      const maxTranslateY = height / 2 - 20;

      translationX.value = clamp(
        prevTranslationX.value + event.translationX,
        -maxTranslateX,
        maxTranslateX
      );
      translationY.value = clamp(
        prevTranslationY.value + event.translationY,
        -maxTranslateY,
        maxTranslateY
      );

      dispatch(actions.move({x: translationX.value, y: translationY.value}));
    })
    .runOnJS(true);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = clamp(
        startScale.value * event.scale,
        0.5,
        Math.min(width / 100, height / 100)
      );

      dispatch(actions.zoom({scale: scale.value}));
    })
    .runOnJS(true);

  const rotation = Gesture.Rotation()
    .onStart(() => {
      startAngle.value = angle.value;
    })
    .onUpdate((event) => {
      angle.value = (startAngle.value + event.rotation);

      dispatch(actions.rotate({angle: angle.value}));
    })
    .runOnJS(true);

  const composed = Gesture.Simultaneous(rotation, pinch);



  const boxAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotate: `${angle.value * 180 / Math.PI}deg` }]
    }
  });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
    ],
  }));


  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.Image style={styles.compass} source={require('@/assets/images/compass.png')} />
      <GestureDetector gesture={composed}>
        <Animated.Image source={require('@/assets/images/floor-map.png')} style={[styles.img, boxAnimatedStyles]} />
      </GestureDetector>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.point, animatedStyles]} />
      </GestureDetector>
    </GestureHandlerRootView>

  );
}

const styles = StyleSheet.create({
  parent: {
    flex: 1,
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  compass: {
    position: 'absolute',
    right: 10, top: 10,
    width: 100, height: 100,
    zIndex: 2
  },
  point: {
    height: 20,
    width: 20,
    backgroundColor: '#0066ffff',
    borderRadius: 10
  },
  button_panel: {
    position: 'absolute',
    top: 10,
    zIndex: 2,
  },
  btn: {
    margin: 5,
    width: 120,
    height: 30,
  }
});
