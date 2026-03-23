import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Document, useDocuments } from "@/context/DocumentsContext";

function formatDate(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function DocumentCard({ doc, onDelete }: { doc: Document; onDelete: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  }

  const totalNotes = doc.pages.reduce((sum, p) => sum + p.notes.length, 0);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={styles.card}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/document/[id]", params: { id: doc.id } });
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }}
      >
        <View style={[styles.cardAccent, { backgroundColor: doc.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.docIconBg, { backgroundColor: doc.color + "22" }]}>
              <Feather name="file-text" size={20} color={doc.color} />
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {doc.title}
              </Text>
              <Text style={styles.cardDate}>{formatDate(doc.updatedAt)}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.cardStat}>
              <Feather name="layers" size={12} color={Colors.light.textTertiary} />
              <Text style={styles.cardStatText}>{doc.pageCount} pages</Text>
            </View>
            {totalNotes > 0 && (
              <View style={[styles.noteBadge, { backgroundColor: Colors.light.tintLight }]}>
                <Feather name="message-square" size={11} color={Colors.light.tintDim} />
                <Text style={styles.noteBadgeText}>{totalNotes} note{totalNotes !== 1 ? "s" : ""}</Text>
              </View>
            )}
          </View>
        </View>

        <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} style={styles.cardChevron} />
      </Pressable>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="folder" size={40} color={Colors.light.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Documents Yet</Text>
      <Text style={styles.emptyText}>
        Tap the + button to add your first document
      </Text>
    </View>
  );
}

function DeleteConfirmModal({
  doc,
  onConfirm,
  onCancel,
}: {
  doc: Document;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Pressable style={styles.modalOverlay} onPress={onCancel}>
      <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
        <View style={styles.modalIconRow}>
          <View style={styles.modalIconBg}>
            <Feather name="trash-2" size={24} color={Colors.light.destructive} />
          </View>
        </View>
        <Text style={styles.modalTitle}>Delete Document?</Text>
        <Text style={styles.modalText}>
          "{doc.title}" and all its annotations will be permanently deleted.
        </Text>
        <View style={styles.modalButtons}>
          <Pressable style={styles.modalCancel} onPress={onCancel}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.modalDelete} onPress={onConfirm}>
            <Text style={styles.modalDeleteText}>Delete</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

export default function DocumentsScreen() {
  const { documents, isLoading, deleteDocument } = useDocuments();
  const insets = useSafeAreaInsets();
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  async function handleDelete() {
    if (!docToDelete) return;
    await deleteDocument(docToDelete.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDocToDelete(null);
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Feather name="folder" size={14} color={Colors.light.textTertiary} />
            <Text style={styles.sectionLabel}>
              {documents.length} Document{documents.length !== 1 ? "s" : ""}
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <DocumentCard
            doc={item}
            onDelete={() => setDocToDelete(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/new-document");
        }}
      >
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>

      {docToDelete && (
        <DeleteConfirmModal
          doc={docToDelete}
          onConfirm={handleDelete}
          onCancel={() => setDocToDelete(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  docIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 2,
  },
  cardDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  noteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  noteBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.tintDim,
  },
  cardChevron: {
    marginRight: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.navy,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 32,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconRow: {
    marginBottom: 4,
  },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.light.destructiveLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  modalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  modalDelete: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.light.destructive,
    alignItems: "center",
  },
  modalDeleteText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
