import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import WifiManager from 'react-native-wifi-reborn';

export const WIFI_SCAN = "REAL_TIME_WIFI_SCAN";
export const SCAN_INTERVAL = 3000;

TaskManager.defineTask(WIFI_SCAN, async ({ data, error }) => {
    if (error) {
        console.error("Task error:", error);
        return;
    }

    try {
        // 1. Force the scan to refresh the data
        let freshData = await WifiManager.reScanAndLoadWifiList();

        // 2. Process Data: Perform your positioning logic here
        // This is where you calculate:
        // let point = getSimilarPoint(freshData, yourPointsArray); 

        // Example output for demonstration:
        if (freshData.length > 0) {
            const strongestAP = freshData[0];
            console.log(`[FG Scan] Strongest AP: ${strongestAP.SSID} (${strongestAP.level} dBm)`);
        }

        await AsyncStorage.setItem("wifi_list", JSON.stringify(freshData));

    } catch (e) {
        console.error("WIFI SCAN Task failed:", e);
    }

});