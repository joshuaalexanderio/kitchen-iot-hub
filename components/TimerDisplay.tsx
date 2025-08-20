import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { theme } from "../theme";

type Props = {
  isPlaying: boolean;
  duration: number;
  timerKey: number;
  onComplete: () => void;
};

export default function TimerDisplay({
  isPlaying,
  duration,
  timerKey,
  onComplete,
}: Props) {
  // Format time display (mm:ss)
  const formatTime = (remainingTime: number) => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <View style={styles.timerContainer}>
      <CountdownCircleTimer
        key={timerKey}
        isPlaying={isPlaying}
        duration={duration}
        colors={[
          theme.colorLightBlue,
          theme.colorSoftPurple,
          theme.colorCoral,
          theme.colorSalmonRed,
        ]}
        colorsTime={[300, 180, 60, 0]}
        onComplete={onComplete}
        size={250}
        strokeWidth={12}
        trailColor="#E0E0E0"
      >
        {({ remainingTime }) => (
          <View style={styles.timerContent}>
            <Text style={styles.timeText}>{formatTime(remainingTime)}</Text>
            <Text style={styles.timeLabel}>
              {remainingTime > 60 ? "minutes" : "seconds"}
            </Text>
          </View>
        )}
      </CountdownCircleTimer>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    marginBottom: 40,
  },
  timerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
    color: theme.colorBlack,
    fontFamily: "monospace",
  },
  timeLabel: {
    fontSize: 16,
    color: theme.colorDarkGrey,
    marginTop: 4,
  },
});
