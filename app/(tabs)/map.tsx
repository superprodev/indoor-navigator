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

const INIT_VALUE = { x: 0, y: 0, z: 0, timestamp: 0 }
Accelerometer.setUpdateInterval(20);
Magnetometer.setUpdateInterval(20);

const AV = 1000;

export default function ModalScreen() {

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

  const root_translationX = useSharedValue(0);
  const root_translationY = useSharedValue(0);
  const root_prevTranslationX = useSharedValue(0);
  const root_prevTranslationY = useSharedValue(0);

  const dispatch = useDispatch<AppDispatch>();


  const pan = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
    })
    .onUpdate((event) => {
      const maxTranslateX = width / 2 - 10;
      const maxTranslateY = height / 2 - 10;

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

  const rootPan = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      root_prevTranslationX.value = root_translationX.value;
      root_prevTranslationY.value = root_translationY.value;
    })
    .onUpdate((event) => {
      const maxTranslateX = width * (scale.value - 1) / 2;
      const maxTranslateY = height * (scale.value - 1)  / 2;

      root_translationX.value = clamp(
        root_prevTranslationX.value + event.translationX,
        -maxTranslateX,
        maxTranslateX
      );
      root_translationY.value = clamp(
        root_prevTranslationY.value + event.translationY,
        -maxTranslateY,
        maxTranslateY
      );
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

  const composed = Gesture.Simultaneous(rotation, pinch, rootPan);



  const boxAnimatedStyles = useAnimatedStyle(() => {
    let newX = root_translationX.value * Math.cos(angle.value) + root_translationY.value * Math.sin(angle.value);
    let newY = -root_translationX.value * Math.sin(angle.value) + root_translationY.value * Math.cos(angle.value);;
    return {
      transform: [{ scale: scale.value }, { rotate: `${angle.value * 180 / Math.PI}deg` }, { translateX: newX },
      { translateY: newY }],
    }
  });

  

  const [accel, setAccel] = useState(INIT_VALUE);
  const [mag, setMag] = useState(INIT_VALUE);
  const [grav, setGrav] = useState(INIT_VALUE);
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [lastStamp, setLastStamp] = useState(0);

  const [started, setStarted] = useState(false);

  const [accelSub, setAccelSub] = useState<EventSubscription>();
  const [magSub, setMagSub] = useState<EventSubscription>();

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value + pos.x * AV },
      { translateY: translationY.value + pos.y * AV },
    ],
  }));

  const askPermissions = async () => {
    await Accelerometer.requestPermissionsAsync();
    await Magnetometer.requestPermissionsAsync();

    const isAccel = await Accelerometer.isAvailableAsync();
    const isMag = await Magnetometer.isAvailableAsync();

    if (isAccel) {
      setAccelSub(Accelerometer.addListener(data => setAccel(data)));
    }
    if (isMag) {
      setMagSub(Magnetometer.addListener(data => setMag(data)));
    }
  }

  const remove = () => {
    if (accelSub) accelSub.remove();
    if (magSub) magSub.remove();
  }

  useEffect(() => {
    if (lastStamp === 0) return;

    setGrav(accel);
  }, [mag.x, mag.y, mag.z]);

  useEffect(() => {
    if (lastStamp === 0) {
      setGrav(accel);
      setLastStamp(accel.timestamp);
      return;
    }

    const deltaT = (accel.timestamp - lastStamp);
    setLastStamp(accel.timestamp);

    let vX = velocity.x + (accel.x - grav.x) * deltaT;
    let vY = velocity.y + (accel.y - grav.y) * deltaT;
    let vZ = velocity.z + (accel.z - grav.z) * deltaT;

    if (Math.abs(vX - velocity.x) < 1e-6) {
      vX = 0;
    }
    if (Math.abs(vY - velocity.y) < 1e-6) {
      vY = 0;
    }
    if (Math.abs(vZ - velocity.z) < 1e-6) {
      vZ = 0;
    }
    setVelocity({ x: vX, y: vY, z: vZ })

    let deltaX = vX * deltaT;
    let deltaY = vY * deltaT;
    let deltaZ = vZ * deltaT;

    setPos(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
      z: prev.z + deltaZ
    }));
  }, [accel])


  // handlers for buttons

  const onClickReset = () => {
    setStarted(prev => !prev);
    remove();
    setLastStamp(0);
    setAccel(INIT_VALUE);
    setGrav(INIT_VALUE);
    setMag(INIT_VALUE);
    setPos({ x: 0, y: 0, z: 0 });
  }

  const onClickStart = () => {
    setStarted(prev => !prev);
    askPermissions();
  }

  useEffect(() => {
    return () => {
      remove();
    }
  });


  return (
    <GestureHandlerRootView style={styles.container}>

      <Animated.Image style={[styles.compass, { transform: [{ rotate: `0deg` }] }]} source={require('@/assets/images/compass.png')} />
      <View style={styles.button_panel} >
        <Button variant='success' disabled={started} style={styles.btn} onPress={onClickStart}>Turn</Button>
        <Button variant='destructive' disabled={!started} style={styles.btn} onPress={onClickReset}>Reset</Button>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
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
    margin: 'auto', position: 'absolute', top: 10, left: 10, width: 100, height: 100, zIndex: 1
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
