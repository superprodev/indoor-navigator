import { useState, useEffect } from "react";
import { DeviceMotion, DeviceMotionMeasurement, Magnetometer, MagnetometerMeasurement } from 'expo-sensors';
import { EventSubscription } from "expo-modules-core";
import { StyleSheet,Dimensions } from "react-native";
import Svg, { Polyline } from "react-native-svg";

import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from '@/components/ui/icon';
import Animated from "react-native-reanimated";
import { ArrowBigUp, Triangle } from "lucide-react-native";

const { width, height } = Dimensions.get('screen');

const INIT_VALUE = { x: 0, y: 0, z: 0, timestamp: 0 }
DeviceMotion.setUpdateInterval(20);
Magnetometer.setUpdateInterval(20);

const FILTER = 0.007;
const AV = 200;

export default function Sensors() {

    const [motion, setMotion] = useState<DeviceMotionMeasurement>();
    const [mag, setMag] = useState<MagnetometerMeasurement>(INIT_VALUE);
    const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 })
    const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
    const [lastStamp, setLastStamp] = useState(0);
    const [heading, setHeading] = useState(0);
    const [points, setPoints] = useState<{x: number, y: number, z: number}[]>([]);
    
    const [started, setStarted] = useState(false);

    const [magSub, setMagSub] = useState<EventSubscription>();
    const [devSub, setDevSub] = useState<EventSubscription>();

    const askPermissions = async () => {
        await DeviceMotion.requestPermissionsAsync();
        await Magnetometer.requestPermissionsAsync();

        const isEnable = await DeviceMotion.isAvailableAsync();
        const isMag = await Magnetometer.isAvailableAsync();

        if (isEnable) {
            setDevSub(DeviceMotion.addListener(data => setMotion(data)));
        }
        if (isMag) {
            setMagSub(Magnetometer.addListener(data => setMag(data)));
        }
    }

    const remove = () => {
        if(devSub) devSub.remove();
        if(magSub) magSub.remove();
    }

    useEffect(() => {
        if( !motion ) return;
        
        let accel = motion.acceleration;
        if( !accel ) return;

        if (lastStamp === 0) {
            setLastStamp(accel.timestamp);
            return;
        }

        const deltaT = (accel.timestamp - lastStamp);
        setLastStamp(accel.timestamp);

        let ax = Math.abs(accel.x) < FILTER ? 0 : accel.x;
        let ay = Math.abs(accel.y) < FILTER ? 0 : accel.y;
        let az = Math.abs(accel.z) < FILTER ? 0 : accel.z;

        let vX = ax === 0 ? 0 : velocity.x + ax * deltaT;
        let vY = ay === 0 ? 0 : velocity.y + ay * deltaT;
        let vZ = az === 0 ? 0 : velocity.z + az * deltaT;

        // if (Math.abs(vX - velocity.x) < 1e-3) {
        //     vX = 0;
        // }
        // if (Math.abs(vY - velocity.y) < 1e-3) {
        //     vY = 0;
        // }
        // if (Math.abs(vZ - velocity.z) < 1e-3) {
        //     vZ = 0;
        // }
        setVelocity({ x: vX, y: vY, z: vZ })

        let deltaX = vX * deltaT;
        let deltaY = vY * deltaT;
        let deltaZ = vZ * deltaT;

        setPos(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
            z: prev.z + deltaZ
        }));

        setPoints(prev => {
            prev.push(pos);
            return prev;
        })


    }, [motion])

    useEffect(() => {
        let angle = 90 - Math.atan2(mag.y, mag.x) * (180 / Math.PI);
        setHeading(angle < 0 ? angle + 360 : angle);
    }, [mag]);

    // handlers for buttons

    const onClickReset = () => {
        setStarted(prev => !prev);
        remove();
        setLastStamp(0);
        setPoints([]);
        setHeading(0);
        setPos({x: 0, y: 0, z: 0});
    }

    const onClickStart = () => {
        setStarted(prev => !prev);
        askPermissions();
    }

    return (
        <View style={styles.container}>
            {/* <Animated.Image style={{margin: 'auto', transform: [{ rotate: `${heading}deg`}]}} source={require('@/assets/images/compass.png')}/> */}

            <View style={styles.button_panel} >
                <Button variant='success' disabled={started} style={styles.btn} onPress={onClickStart}>Start</Button>
                <Button variant='destructive' disabled={!started} style={styles.btn} onPress={onClickReset}>Reset</Button>
            </View>
            <Icon name={ArrowBigUp} size={36} color='black' style={{zIndex: 2, position:'absolute', left: width/2 + pos.x*AV - 18, top: height/2 + pos.z*AV - 18, transform: [{ rotate: `${-heading}deg`}] }}/>
            <Text> Position:  {JSON.stringify(pos, null, 2)} </Text>
            <Svg width={width} height={height} style={{position: 'absolute', zIndex: -1}}>
                <Polyline points={points.map((value, index) => (`${width/2 + value.x*AV},${height/2 + value.z*AV}`)).join(" ")}
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
        alignContent: 'center'
    },
    button_panel: {
        marginTop: 30,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    btn: {
        margin: 10
    }
})