import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { theme } from "../theme";

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "shoppingItems"),
      (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by creation time
        itemsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        setItems(itemsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching items:", error);
        Alert.alert("Error", "Failed to load shopping list");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const addItem = async () => {
    if (inputText.trim()) {
      try {
        await addDoc(collection(db, "shoppingItems"), {
          text: inputText.trim(),
          completed: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setInputText("");
      } catch (error) {
        console.error("Error adding item:", error);
        Alert.alert("Error", "Failed to add item");
      }
    }
  };

  const toggleItem = async (id, currentCompleted) => {
    try {
      const itemRef = doc(db, "shoppingItems", id);
      await updateDoc(itemRef, {
        completed: !currentCompleted,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, "shoppingItems", id));
    } catch (error) {
      console.error("Error deleting item:", error);
      Alert.alert("Error", "Failed to delete item");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemText}
        onPress={() => toggleItem(item.id, item.completed)}
      >
        <Text style={[styles.text, item.completed && styles.completedText]}>
          {item.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => deleteItem(item.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading shopping list...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add item..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={addItem}
        />
        <TouchableOpacity onPress={addItem} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {items.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items yet. Add something!</Text>
        </View>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colorSage,
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: theme.colorBlue,
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
  },
  itemText: {
    flex: 1,
  },
  text: {
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: theme.colorGrey,
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    color: "red",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: theme.colorLightGrey,
  },
});
