import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Link, useRouter} from "expo-router";

export default function Timer() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.navigate('/')}>
                 <Text style={{ textAlign: "center", marginBottom: 18, fontSize: 24 }}>
                Go to /index
                </Text>
                </TouchableOpacity>
            <Text>This is the timer screen!</Text>
        </View>


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
