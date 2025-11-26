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

  const dispatch = useDispatch<AppDispatch>();

  const [accel, setAccel] = useState(INIT_VALUE);
  const [mag, setMag] = useState(INIT_VALUE);
  const [grav, setGrav] = useState(INIT_VALUE);
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [lastStamp, setLastStamp] = useState(0);

  const [started, setStarted] = useState(false);

  const [accelSub, setAccelSub] = useState<EventSubscription>();
  const [magSub, setMagSub] = useState<EventSubscription>();

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
    <View style={styles.container}>
      <Animated.Image style={[styles.compass, { transform: [{ rotate: `0deg` }] }]} source={require('@/assets/images/compass.png')} />
      <View style={styles.button_panel} >
        <Button variant='success' disabled={started} style={styles.btn} onPress={onClickStart}>Turn</Button>
        <Button variant='destructive' disabled={!started} style={styles.btn} onPress={onClickReset}>Reset</Button>
      </View>
      <Animated.Image source={require('@/assets/images/floor-map.png')} style={[styles.img]} />
      <Animated.View style={[styles.point]} />
    </View>
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
