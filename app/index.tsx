import { StyleSheet, Text, View } from "react-native";
import DishwasherStatus from "../components/DishwasherStatus";

export default function Index() {
  return (
    <View style={styles.container}>
      <DishwasherStatus dishStatus={"dirty"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
