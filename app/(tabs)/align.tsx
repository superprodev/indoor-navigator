import { StyleSheet, Dimensions, PermissionsAndroid } from 'react-native';
import { useState, useEffect, useCallback } from "react";
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

import { View } from "@/components/ui/view";
import { Button } from "@/components/ui/button";
import { shallowEqual, useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { ProfileState, profileSlice, Fingerprint } from '@/store/profileSlice';
import { RootState, AppDispatch } from '@/store';
import Svg, { Polyline } from 'react-native-svg';
import WifiManager, { WifiEntry, WiFiObject } from 'react-native-wifi-reborn';

const { actions } = profileSlice;

const { width, height } = Dimensions.get('window');

const cwidth = width - 80;
const cheight = height - 80;

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function getSqrt(apArr: WifiEntry[], detail: string): number {
  let json = JSON.parse(detail);
  let result = 0;
  for (let i = 0; i < apArr.length && json[apArr[i].BSSID]; i++) {
    result += (json[apArr[i].BSSID] - apArr[i].level) * (json[apArr[i].BSSID] - apArr[i].level);
  }
  return result;
}

function getSimilarPoint(apArr: WifiEntry[], points: Fingerprint[]): Fingerprint {
  let result = points[0];
  let diff = 1e8;
  for (let i = 0; i < points.length; i++) {
    let sqrt = getSqrt(apArr, points[i].detail);
    if (diff > sqrt) {
      diff = sqrt;
      result = points[i];
    }
  }
  return result;
}
export default function () {

  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
  const profile = useAppSelector(state => state.profile, shallowEqual);

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const prevTranslationX = useSharedValue(0);
  const prevTranslationY = useSharedValue(0);

  const [id, setId] = useState(0);
  const [count, setCount] = useState(0);
  const { points } = profile;

  const [started, setStarted] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [entryList, setEntryList] = useState<WifiEntry[]>([]);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (started) {
      setId(setTimeout(async () => {
        setCount(prev => prev + 1);
        let newEntryList = await WifiManager.reScanAndLoadWifiList();
        setEntryList(newEntryList);

        if (points.length === 0 || !tracking) return;

        let point = getSimilarPoint(newEntryList, points);
        translationX.value = point.x;
        translationY.value = point.y;
      }, 1000));
    } else {
      clearTimeout(id);
      setId(0);
    }
  }, [count, started, tracking]);


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

    })
    .runOnJS(true);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
    ],
  }));

  const onToggle = async () => {
    if (started) {
      clearInterval(id);
      setId(0);
    } else {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
    setStarted(prev => !prev);
  }

  const onTrack = () => {
    setTracking(prev => !prev);
  }

  const onAdd = () => {
    let detail: any = {};
    for (let i = 0; i < entryList.length; i++) {
      detail[entryList[i].BSSID] = entryList[i].level;
    }
    dispatch(actions.insert({ points: [{ x: parseInt(translationX.value.toFixed(0)), y: parseInt(translationY.value.toFixed(0)), detail: JSON.stringify(detail) }] }))
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.Image style={styles.compass} source={require('@/assets/images/compass.png')} />
      <View style={styles.button_panel}>
        <Button variant={started ? 'destructive' : 'success'} style={styles.btn} onPress={onToggle}>{started ? 'Stop' : 'Start'}</Button>
        {id != 0 && <Button variant={tracking ? 'outline' : 'default'} style={styles.btn} onPress={onTrack}>{tracking ? 'Stop' : 'Track'}</Button>}

        {id != 0 && <Button variant='success' style={styles.btn} onPress={onAdd}>Add</Button>}
      </View>
      <Animated.Image source={require('@/assets/images/floor-map1.png')} style={[styles.img]} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.point, animatedStyles]} />
      </GestureDetector>
      <Svg width={width} height={height} style={{ position: 'absolute', zIndex: -1 }}>
        <Polyline points={points.map((value, index) => (`${width / 2 + value.x + 16},${height / 2 + value.y + 16}`)).join(" ")}
          stroke="red"
          strokeWidth="4"
          fill="none" />
      </Svg>
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
    flex: 1
  },
  img: {
    margin: 'auto',
    width: cwidth,
    height: cheight,
    objectFit: 'contain'
  },
  compass: {
    position: 'absolute',
    right: 10, top: 20,
    width: 100, height: 100,
    zIndex: 2
  },
  point: {
    height: 32,
    width: 32,
    left: '50%',
    top: '50%',
    position: 'absolute',
    backgroundColor: '#0066ffff',
    borderRadius: 10
  },
  button_panel: {
    position: 'absolute',
    top: 20,
    zIndex: 2,
    left: 10,
  },
  btn: {
    margin: 5,
    width: 120,
    height: 30,
  }
});
