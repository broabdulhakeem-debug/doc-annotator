import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useDocuments } from "@/context/DocumentsContext";

const TEMPLATES = [
  { label: "Meeting Notes", icon: "users" as const },
  { label: "Project Brief", icon: "briefcase" as const },
  { label: "Research Report", icon: "book-open" as const },
  { label: "Design Spec", icon: "pen-tool" as const },
  { label: "Technical Docs", icon: "code" as const },
  { label: "Review Notes", icon: "check-square" as const },
];

export default function NewDocumentScreen() {
  const insets = useSafeAreaInsets();
  const { addDocument } = useDocuments();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    setIsCreating(true);
    Keyboard.dismiss();
    try {
      const doc = await addDocument(trimmed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.dismiss();
      setTimeout(() => {
        router.push({ pathname: "/document/[id]", params: { id: doc.id } });
      }, 300);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.handle} />

      <Text style={styles.heading}>New Document</Text>
      <Text style={styles.subheading}>Give your document a name</Text>

      <View style={styles.inputWrapper}>
        <Feather name="file-text" size={18} color={Colors.light.textTertiary} style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Document title..."
          placeholderTextColor={Colors.light.textTertiary}
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
          maxLength={60}
        />
        {title.length > 0 && (
          <Pressable onPress={() => setTitle("")}>
            <Feather name="x-circle" size={18} color={Colors.light.textTertiary} />
          </Pressable>
        )}
      </View>

      <Text style={styles.templateLabel}>Or pick a template</Text>
      <View style={styles.templates}>
        {TEMPLATES.map((t) => (
          <Pressable
            key={t.label}
            style={({ pressed }) => [
              styles.templateChip,
              title === t.label && styles.templateChipActive,
              pressed && styles.templateChipPressed,
            ]}
            onPress={() => {
              setTitle(t.label);
              Haptics.selectionAsync();
            }}
          >
            <Feather
              name={t.icon}
              size={13}
              color={title === t.label ? Colors.light.navy : Colors.light.textSecondary}
            />
            <Text
              style={[
                styles.templateText,
                title === t.label && styles.templateTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.cancelBtn} onPress={() => router.dismiss()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.createBtn, (!title.trim() || isCreating) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!title.trim() || isCreating}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.createText}>
            {isCreating ? "Creating..." : "Create Document"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.light.text,
    marginBottom: 2,
  },
  subheading: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 14,
  },
  templateLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  templates: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  templateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  templateChipActive: {
    backgroundColor: Colors.light.tintLight,
    borderColor: Colors.light.tint,
  },
  templateChipPressed: {
    opacity: 0.7,
  },
  templateText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  templateTextActive: {
    color: Colors.light.navy,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  createBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.navy,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
