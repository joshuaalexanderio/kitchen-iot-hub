import {StyleSheet, TouchableOpacity, Text, View} from "react-native";
import {theme} from "../theme";
import {useEffect, useState} from "react";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from 'expo-audio';
type Props = {
    dishStatus: 'dirty' | 'clean';
};
export default function DishwasherStatus({ dishStatus}: Props) {

    const [currentStatus, setCurrentStatus] = useState(dishStatus);
    const warningPlayer = useAudioPlayer('/System/Library/Audio/UISounds/jbl_cancel.caf');
    const successPlayer = useAudioPlayer('/System/Library/Audio/UISounds/jbl_confirm.caf');
    const ESP32_URL = "http://myesp32.local";

    // Listen for ESP32 button presses
    useEffect(() => {
        let lastKnownState = {'18': 'off', '19': 'off'};

        const checkForButtonChanges = async () => {
            try {
                const response = await fetch('http://myesp32.local/api/lights');
                const data = await response.json();

                if (data.status === 'success') {
                    const currentState = data.lights;

                    if (JSON.stringify(currentState) != JSON.stringify(lastKnownState)) {
                        if (currentState['18'] === 'on' && currentState['19'] === 'off') {
                            setCurrentStatus('dirty');
                            console.log('ESP32 change detected: Set to DIRTY (GPIO 18)');
                        } else if (currentState['19'] === 'on' && currentState['18'] === 'off') {
                            setCurrentStatus('clean');
                            console.log('ESP32 change detected: Set to CLEAN (GPIO 19)');
                        }

                        lastKnownState = currentState;
                    }
                }
            } catch (error) {
                console.error('ESP32 polling error:', error);
            }
        };

        // Poll every 500ms for button changes
        const interval = setInterval(checkForButtonChanges, 500);

        // Initial state check
        checkForButtonChanges();

        // Cleanup on component unmount
        return () => {
            clearInterval(interval);
        };
    }, []);

    const toggleDishStatus = () => {
        if (currentStatus === 'clean') {
            fetch('http://myesp32.local/api/lights/19/off', {
                method: 'POST'
            });
            fetch('http://myesp32.local/api/lights/18/on', {
                method: 'POST'
            });
            // Delay to feel smooth with haptics
            setTimeout(() => {
                setCurrentStatus('dirty');
            }, 100);
            warningPlayer.seekTo(0);
            warningPlayer.play();

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        else if (currentStatus === 'dirty') {
            fetch('http://myesp32.local/api/lights/18/off', {
                method: 'POST'
            });
            fetch('http://myesp32.local/api/lights/19/on', {
                method: 'POST'
            });
            // Delay to feel smooth with haptics
            setTimeout(() => {
                 setCurrentStatus('clean');
            }, 50);
            successPlayer.seekTo(0);
            successPlayer.play();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.mediumText}>Dishwasher Status:</Text>
            <Text style={styles.mediumText}>{currentStatus}</Text>
            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => {
                  toggleDishStatus();
                }}>
                <Text style={styles.buttonText}>Toggle</Text>
            </TouchableOpacity>


        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        backgroundColor:
            theme.colorBlack,
        padding: 8,
        marginTop: 6,
        borderRadius: 10,

    },
    buttonText: {
        color: theme.colorWhite,
    },
    smallText: {
        fontSize: 12, // Small font size
    },
    mediumText: {
        fontSize: 18, // Medium font size
    },
    largeText: {
        fontSize: 24, // Large font size
    },
});
