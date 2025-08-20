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

  const TIMER_DURATION = 300; // 5 minutes in seconds

  const alarmPlayer = useAudioPlayer(
    "/System/Library/Audio/UISounds/alarm.caf",
  );

  // Request notification permissions on component mount
  useEffect(() => {
    setupNotifications();
  }, []);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const pauseTimer = () => {
    setIsPlaying(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetTimer = () => {
    setIsPlaying(false);
    setIsFinished(false);
    setKey((prev) => prev + 1); // Restart the countdown circle
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  // Determine button style based on state
  const getButtonStyle = () => {
    if (isFinished) return [styles.button, styles.finishedButton];
    if (isPlaying) return [styles.button, styles.pauseButton];
    return [styles.button, styles.startButton];
  };

  const getButtonText = () => {
    if (isFinished) return "Start New Timer";
    if (isPlaying) return "Pause";
    return "Start";
  };

  const handleMainButtonPress = () => {
    if (isFinished || !isPlaying) {
      startTimer();
    } else {
      pauseTimer();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timer</Text>

      <TimerDisplay
        isPlaying={isPlaying}
        duration={TIMER_DURATION}
        timerKey={key}
        onComplete={handleTimerComplete}
      />

      {isFinished && <Text style={styles.finishedText}>Time's Up!</Text>}

      <TouchableOpacity
        style={getButtonStyle()}
        activeOpacity={0.7}
        onPress={handleMainButtonPress}
      >
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>

      {(isPlaying || (!isPlaying && !isFinished)) && (
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          activeOpacity={0.7}
          onPress={resetTimer}
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
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
