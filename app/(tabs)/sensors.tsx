import { useState, useEffect } from "react";
import { DeviceMotion, DeviceMotionMeasurement, Magnetometer, MagnetometerMeasurement } from 'expo-sensors';
import { EventSubscription } from "expo-modules-core";
import { StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import * as Location from 'expo-location';

import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from '@/components/ui/icon';
import Animated from "react-native-reanimated";
import { ArrowBigUp, ArrowUp, ArrowUpCircle, ArrowUpIcon, ArrowUpSquare, Triangle } from "lucide-react-native";

const { width, height } = Dimensions.get('screen');

const INIT_VALUE = { x: 0, y: 0, z: 0, timestamp: 0 }
DeviceMotion.setUpdateInterval(200);
Magnetometer.setUpdateInterval(200);

const FILTER = 0.1;
const AV = 20;

export default function Sensors() {

    const [motion, setMotion] = useState<DeviceMotionMeasurement>();
    const [mag, setMag] = useState<MagnetometerMeasurement>(INIT_VALUE);
    const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
    const [location, setLocation] = useState<Location.LocationObject>();
    const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
    const [lastStamp, setLastStamp] = useState(0);
    const [locSub, setLocSub] = useState<Location.LocationSubscription>();
    const [heading, setHeading] = useState(0);
    const [points, setPoints] = useState<{ x: number, y: number, z: number }[]>([]);

    const [started, setStarted] = useState(false);

    const [devSub, setDevSub] = useState<EventSubscription>();
    const [magSub, setMagSub] = useState<EventSubscription>();

    const askPermissions = async () => {
        await DeviceMotion.requestPermissionsAsync();
        await Magnetometer.requestPermissionsAsync();
        await Location.requestForegroundPermissionsAsync();

        const isMag = await Magnetometer.isAvailableAsync();
        const isEnable = await DeviceMotion.isAvailableAsync();

        if (isEnable) {
            setDevSub(DeviceMotion.addListener(data => setMotion(data)));
        }
        if (isMag) {
            setMagSub(Magnetometer.addListener(data => setMag(data)));
        }

        let locSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 200 }, (data) => {
            setLocation(data);
        })
        setLocSub(locSub);
    }

    const remove = () => {
        if (devSub) devSub.remove();
        if (magSub) magSub.remove();
        if (locSub) locSub.remove();
    }

    // useEffect(() => {
        
    //     if (!motion) return;

    //     let accel = motion.acceleration;
    //     let rotation = motion.rotation;
    //     if (!accel || !rotation) return;

    //     if (lastStamp === 0) {
    //         setLastStamp(accel.timestamp);
    //         return;
    //     }

    //     const deltaT = (accel.timestamp - lastStamp);
    //     setLastStamp(accel.timestamp);

    //     // const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
    //     // if (magnitude > 1.2) {
    //     //     const stepLength = 0.7; // meters per step (tweak later)
    //     //     const rad = 90 - heading * (Math.PI / 180);


    //     // }

    //     let ax = Math.abs(accel.x) < FILTER ? 0 : accel.x;
    //     let ay = Math.abs(accel.y) < FILTER ? 0 : accel.y;
    //     let az = Math.abs(accel.z) < FILTER ? 0 : accel.z;

    //     let vX = ax === 0 ? 0 : velocity.x + ax * deltaT;
    //     let vY = ay === 0 ? 0 : velocity.y + ay * deltaT;
    //     let vZ = az === 0 ? 0 : velocity.z + az * deltaT;

    //     // if (Math.abs(vX - velocity.x) < 1e-3) {
    //     //     vX = 0;
    //     // }
    //     // if (Math.abs(vY - velocity.y) < 1e-3) {
    //     //     vY = 0;
    //     // }
    //     // if (Math.abs(vZ - velocity.z) < 1e-3) {
    //     //     vZ = 0;
    //     // }
    //     setVelocity({ x: vX, y: vY, z: vZ })

    //     let deltaX = vX * deltaT * AV;
    //     let deltaY = vY * deltaT * AV;
    //     let deltaZ = vZ * deltaT * AV;

    //     let rad = heading * Math.PI / 180;
    //     let cos = -Math.cos(rad);
    //     let sin = -Math.sin(rad);

    //     setPos(prev => ({
    //         x: prev.x + deltaX * cos - deltaY * sin,
    //         y: prev.y + deltaX * sin + deltaY * cos,
    //         z: prev.z + deltaZ
    //     }));

    //     if (deltaX == 0 && deltaY == 0) return;

    //     setPoints(prev => {
    //         prev.push(pos);
    //         return prev;
    //     })

    // });


    useEffect(() => {
        if (mag.x == 0 && mag.y == 0) return;

        let angle = 90 - Math.atan2(mag.y, mag.x) * (180 / Math.PI);
        setHeading(angle < 0 ? angle + 360 : angle);
    }, [mag]);

    // handlers for buttons

    const onClickReset = () => {
        setStarted(prev => !prev);
        remove();
        setLastStamp(0);
        setPoints([]);
        setVelocity({ x: 0, y: 0, z: 0 })
        setHeading(0);
        setPos({ x: 0, y: 0, z: 0 });
    }

    const onClickStart = () => {
        setStarted(prev => !prev);
        askPermissions();
    }

    return (
        <View style={styles.container}>
            <Animated.Image style={{ marginHorizontal: 'auto', width: 150, height: 150 }} source={require('@/assets/images/compass.png')} />

            <Icon name={ArrowBigUp} size={36} color='black' style={{ zIndex: 2, position: 'absolute', left: width / 2 - pos.x - 18, top: height / 2 - pos.y - 18, transform: [{ rotate: `${-heading}deg` }] }} />
            <Text> Position:  {JSON.stringify(location?.coords, null, 2)} </Text>
            <View style={styles.button_panel} >
                <Button variant='success' disabled={started} style={styles.btn} onPress={onClickStart}>Start</Button>
                <Button variant='destructive' disabled={!started} style={styles.btn} onPress={onClickReset}>Reset</Button>
            </View>
            <Svg width={width} height={height} style={{ position: 'absolute', zIndex: -1 }}>
                <Polyline points={points.map((value, index) => (`${width / 2 - value.x},${height / 2 - value.y}`)).join(" ")}
                    stroke="red"
                    strokeWidth="4"
                    fill="none" />
            </Svg>
        </View>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignContent: 'center',
        color: 'grey'
    },
    button_panel: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    btn: {
        margin: 10
    }
})