import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, Text, View, Alert } from "react-native";
import { theme } from "../theme";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import { useAudioPlayer } from "expo-audio";
import TimerDisplay from "../components/TimerDisplay";

// Configure notifications to show alerts even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function Timer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [key, setKey] = useState(0); // Used to restart the timer
  const [isFinished, setIsFinished] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const TIMER_DURATION = 300; // 5 minutes in seconds
  const ESP32_BASE_URL = "http://10.0.0.122";

  const alarmPlayer = useAudioPlayer(
    "/System/Library/Audio/UISounds/alarm.caf",
  );

  // Request notification permissions on component mount
  useEffect(() => {
    setupNotifications();
  }, []);

  // Listen for ESP32 timer button presses
  useEffect(() => {
    let lastKnownTimerState = "stopped";

    const checkForTimerButtonChanges = async () => {
      try {
        const response = await fetch(`${ESP32_BASE_URL}/api/timer`);
        const data = await response.json();

        setIsConnected(true);

        if (data.status === "success") {
          const currentTimerState = data.timer;

          // Only act if state changed from ESP32 button press
          if (currentTimerState !== lastKnownTimerState) {
            console.log(`ESP32 timer button pressed: ${currentTimerState}`);

            if (currentTimerState === "running") {
              if (isFinished) {
                // Reset if timer was finished, then start
                resetTimer();
                setTimeout(() => setIsPlaying(true), 100);
              } else {
                setIsPlaying(true);
                setIsFinished(false);
              }
            } else if (currentTimerState === "paused") {
              setIsPlaying(false);
            }

            lastKnownTimerState = currentTimerState;
          }
        }
      } catch (error) {
        console.error("ESP32 timer polling error:", error);
        setIsConnected(false);
      }
    };

    // Poll every 300ms for timer button changes (faster than dishwasher)
    const interval = setInterval(checkForTimerButtonChanges, 300);
    checkForTimerButtonChanges(); // Initial check

    return () => clearInterval(interval);
  }, [isFinished]);

  const setupNotifications = async () => {
    const status = await registerForPushNotificationsAsync();
    if (status !== "granted" && status !== null) {
      Alert.alert(
        "Permission Required",
        "Please enable notifications to receive timer alerts.",
      );
    }
  };

  const handleTimerComplete = () => {
    setIsPlaying(false);
    setIsFinished(true);

    // Notify ESP32 that timer finished
    fetch(`${ESP32_BASE_URL}/api/timer/stop`, { method: "POST" }).catch(
      console.error,
    );

    alarmPlayer.seekTo(0);
    alarmPlayer.play();

    sendNotification();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Timer Finished!",
        body: "5 minute timer has completed",
        sound: true,
      },
      trigger: null, // Send immediately
    });
  };

  const startTimer = () => {
    if (isFinished) {
      // Reset if timer was finished
      resetTimer();
    } else {
      setIsPlaying(true);
      setIsFinished(false);

      // Notify ESP32 that timer started
      fetch(`${ESP32_BASE_URL}/api/timer/start`, { method: "POST" }).catch(
        console.error,
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const pauseTimer = () => {
    setIsPlaying(false);

    // Notify ESP32 that timer paused
    fetch(`${ESP32_BASE_URL}/api/timer/pause`, { method: "POST" }).catch(
      console.error,
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetTimer = () => {
    setIsPlaying(false);
    setIsFinished(false);
    setKey((prev) => prev + 1); // Restart the countdown circle

    // Notify ESP32 that timer reset
    fetch(`${ESP32_BASE_URL}/api/timer/stop`, { method: "POST" }).catch(
      console.error,
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  // Determine button style based on state
  const getButtonStyle = () => {
    if (isFinished) return [styles.button, styles.finishedButton];
    if (isPlaying) return [styles.button, styles.pauseButton];
    return [styles.button, styles.startButton];
  };

  const getButtonText = () => {
    if (!isConnected) return "Offline";
    if (isFinished) return "Start New Timer";
    if (isPlaying) return "Pause";
    return "Start";
  };

  const handleMainButtonPress = () => {
    if (!isConnected) return; // Don't do anything if offline

    if (isFinished || !isPlaying) {
      startTimer();
    } else {
      pauseTimer();
    }
  };

  return (
    <View style={styles.container}>
      <TimerDisplay
        isPlaying={isPlaying}
        duration={TIMER_DURATION}
        timerKey={key}
        onComplete={handleTimerComplete}
      />

      {isFinished && <Text style={styles.finishedText}>Time's Up!</Text>}

      {/* Connection status indicator */}
      {!isConnected && (
        <Text style={styles.connectionStatus}>ESP32 Offline</Text>
      )}

      <TouchableOpacity
        style={[getButtonStyle(), !isConnected && styles.offlineButton]}
        activeOpacity={0.7}
        onPress={handleMainButtonPress}
        disabled={!isConnected}
      >
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>

      {(isPlaying || (!isPlaying && !isFinished)) && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.resetButton,
            !isConnected && styles.offlineButton,
          ]}
          activeOpacity={0.7}
          onPress={resetTimer}
          disabled={!isConnected}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    color: theme.colorBlack,
  },
  finishedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colorSalmonRed,
    marginBottom: 20,
  },
  // Connection status style
  connectionStatus: {
    fontSize: 14,
    color: theme.colorGrey,
    marginBottom: 16,
    fontStyle: "italic",
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 150,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: theme.colorSage,
  },
  pauseButton: {
    backgroundColor: theme.colorSage,
  },
  resetButton: {
    backgroundColor: theme.colorPeach,
  },
  finishedButton: {
    backgroundColor: theme.colorLightBlue,
  },
  // Offline button style
  offlineButton: {
    backgroundColor: theme.colorGrey,
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
