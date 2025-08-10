import { StyleSheet, Text, View } from 'react-native';
import DishwasherStatus from "../components/DishwasherStatus";
import {useRouter} from "expo-router";

export default function Index() {

  return (
    <DishwasherStatus dishStatus={"dirty"}/>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
