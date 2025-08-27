import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Animated,
} from "react-native";
import { theme } from "../theme";
import { useEffect, useState, useRef } from "react";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";

type Props = {
  dishStatus: "dirty" | "clean";
};

export default function DishwasherStatus({ dishStatus }: Props) {
  const [currentStatus, setCurrentStatus] = useState(dishStatus);
  const [isConnected, setIsConnected] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const backgroundColorAnim = useRef(
    new Animated.Value(dishStatus === "clean" ? 1 : 0),
  ).current;

  const warningPlayer = useAudioPlayer(
    "/System/Library/Audio/UISounds/jbl_cancel.caf",
  );
  const successPlayer = useAudioPlayer(
    "/System/Library/Audio/UISounds/jbl_confirm.caf",
  );
  const ESP32_BASE_URL = "http://10.0.0.122";

  // Background color animation
  const animateBackgroundColor = (toClean: boolean) => {
    Animated.timing(backgroundColorAnim, {
      toValue: toClean ? 1 : 0,
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  // Button press animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Listen for ESP32 button presses
  useEffect(() => {
    let lastKnownState = { greenLight: "off", redLight: "off" };

    const checkForButtonChanges = async () => {
      try {
        const response = await fetch(`${ESP32_BASE_URL}/api/lights`);
        const data = await response.json();

        setIsConnected(true);

        if (data.status === "success") {
          const currentState = data.lights;

          if (JSON.stringify(currentState) != JSON.stringify(lastKnownState)) {
            if (
              currentState["redLight"] === "on" &&
              currentState["greenLight"] === "off"
            ) {
              setCurrentStatus("dirty");
              animateBackgroundColor(false);
              console.log(
                "ESP32 change detected: Set to DIRTY (Red light GPIO 18)",
              );
            } else if (
              currentState["greenLight"] === "on" &&
              currentState["redLight"] === "off"
            ) {
              setCurrentStatus("clean");
              animateBackgroundColor(true);
              console.log(
                "ESP32 change detected: Set to CLEAN (Green light (GPIO 19)",
              );
            }

            lastKnownState = currentState;
          }
        }
      } catch (error) {
        console.error("ESP32 polling error:", error);
        setIsConnected(false);
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
    animateButton();

    // Toggle clean to dirty
    if (currentStatus === "clean") {
      fetch(`${ESP32_BASE_URL}/api/lights/greenLight/off`, {
        method: "POST",
      });
      fetch(`${ESP32_BASE_URL}/api/lights/redLight/on`, {
        method: "POST",
      });
      // Delay to feel smooth with haptics
      setTimeout(() => {
        setCurrentStatus("dirty");
        animateBackgroundColor(false);
      }, 100);
      warningPlayer.seekTo(0);
      warningPlayer.play();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } // Toggle dirty to clean
    else if (currentStatus === "dirty") {
      fetch(`${ESP32_BASE_URL}/api/lights/redLight/off`, {
        method: "POST",
      });
      fetch(`${ESP32_BASE_URL}/api/lights/greenLight/on`, {
        method: "POST",
      });
      // Delay to feel smooth with haptics
      setTimeout(() => {
        setCurrentStatus("clean");
        animateBackgroundColor(true);
      }, 50);
      successPlayer.seekTo(0);
      successPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const cardBackgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#fbd8d8", theme.colorMint], //
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.statusCard, { backgroundColor: cardBackgroundColor }]}
      >
        <Animated.View style={[styles.statusContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Dishwasher</Text>
          <Text style={styles.statusText}>{currentStatus}</Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.button, !isConnected && styles.disconnectedButton]}
            activeOpacity={0.7}
            onPress={toggleDishStatus}
            disabled={!isConnected}
          >
            <Text style={styles.buttonText}>
              {isConnected ? "Toggle" : "Offline"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {!isConnected && (
          <Text style={styles.connectionStatus}>Device disconnected</Text>
        )}
      </Animated.View>
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
  statusCard: {
    alignItems: "center",
    borderRadius: 16,
    padding: 40,
    minWidth: 200,
    elevation: 1,
    shadowColor: theme.colorBlack,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    color: theme.colorDarkGrey,
    marginBottom: 8,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 32,
    fontWeight: "600",
    color: theme.colorBlack,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: theme.colorBlack,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    elevation: 2,
    shadowColor: theme.colorBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  disconnectedButton: {
    backgroundColor: theme.colorGrey,
  },
  buttonText: {
    color: theme.colorWhite,
    fontSize: 16,
    fontWeight: "500",
  },
  connectionStatus: {
    fontSize: 12,
    color: theme.colorGrey,
    marginTop: 16,
    fontStyle: "italic",
  },
});
