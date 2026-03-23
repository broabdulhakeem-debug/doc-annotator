import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Note, Page, useDocuments } from "@/context/DocumentsContext";

const NOTE_COLORS = [
  { bg: "#FFFBEB", border: "#FDE68A", pin: "#F59E0B", label: "Amber" },
  { bg: "#EFF6FF", border: "#BFDBFE", pin: "#3B82F6", label: "Blue" },
  { bg: "#F0FDF4", border: "#BBF7D0", pin: "#10B981", label: "Green" },
  { bg: "#FDF2F8", border: "#F5D0FE", pin: "#A855F7", label: "Purple" },
  { bg: "#FFF1F2", border: "#FECDD3", pin: "#EF4444", label: "Red" },
];

function DocumentPage({
  page,
  pageIndex,
  docColor,
  onTap,
  onNotePress,
}: {
  page: Page;
  pageIndex: number;
  docColor: string;
  onTap: (x: number, y: number) => void;
  onNotePress: (note: Note) => void;
}) {
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const lineCount = 18;

  return (
    <View style={styles.pageContainer}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageLabel}>Page {pageIndex + 1}</Text>
        {page.notes.length > 0 && (
          <View style={styles.pageNoteBadge}>
            <Feather name="message-square" size={10} color={Colors.light.tintDim} />
            <Text style={styles.pageNoteBadgeText}>{page.notes.length}</Text>
          </View>
        )}
      </View>

      <TouchableWithoutFeedback
        onPress={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          const x = locationX / layout.width;
          const y = locationY / layout.height;
          onTap(x, y);
        }}
      >
        <View
          style={styles.pageContent}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setLayout({ width, height });
          }}
        >
          <View style={[styles.pageStripe, { backgroundColor: docColor }]} />

          {Array.from({ length: lineCount }, (_, i) => (
            <View
              key={i}
              style={[
                styles.docLine,
                {
                  width: i === 0 ? "60%" : i % 5 === 4 ? "40%" : "100%",
                  backgroundColor:
                    i === 0 ? Colors.light.navyLight + "20" : Colors.light.documentLines,
                  height: i === 0 ? 10 : 6,
                  marginBottom: i === 0 ? 12 : 8,
                },
              ]}
            />
          ))}

          {page.notes.map((note) => {
            const colorScheme =
              NOTE_COLORS.find((c) => c.pin === note.color) || NOTE_COLORS[0];
            return (
              <Pressable
                key={note.id}
                style={[
                  styles.notePin,
                  {
                    left: note.x * layout.width,
                    top: note.y * layout.height,
                    backgroundColor: colorScheme.bg,
                    borderColor: colorScheme.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onNotePress(note);
                }}
              >
                <View style={[styles.notePinDot, { backgroundColor: note.color }]} />
                <Text style={styles.notePinText} numberOfLines={2}>
                  {note.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

function NoteDetailModal({
  note,
  pageId,
  docId,
  onClose,
}: {
  note: Note;
  pageId: string;
  docId: string;
  onClose: () => void;
}) {
  const { deleteNote } = useDocuments();
  const colorScheme = NOTE_COLORS.find((c) => c.pin === note.color) || NOTE_COLORS[0];

  async function handleDelete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteNote(docId, pageId, note.id);
    onClose();
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.noteModalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.noteModalCard, { borderTopColor: note.color }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.noteModalHeader}>
            <View style={[styles.noteModalPinDot, { backgroundColor: note.color }]} />
            <Text style={styles.noteModalTitle}>Annotation</Text>
            <Pressable onPress={onClose} style={styles.noteModalClose}>
              <Feather name="x" size={18} color={Colors.light.textSecondary} />
            </Pressable>
          </View>
          <View style={[styles.noteModalBody, { backgroundColor: colorScheme.bg, borderColor: colorScheme.border }]}>
            <Text style={styles.noteModalText}>{note.text}</Text>
          </View>
          <Text style={styles.noteModalMeta}>
            Added {new Date(note.createdAt).toLocaleString()}
          </Text>
          <Pressable style={styles.noteDeleteBtn} onPress={handleDelete}>
            <Feather name="trash-2" size={14} color={Colors.light.destructive} />
            <Text style={styles.noteDeleteText}>Remove annotation</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddNoteModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (text: string, color: string) => void;
}) {
  const [text, setText] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].pin);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setText("");
      setSelectedColor(NOTE_COLORS[0].pin);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  function handleAdd() {
    if (!text.trim()) return;
    onAdd(text.trim(), selectedColor);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.addNoteOverlay} onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <Pressable style={styles.addNoteCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.addNoteHandle} />
          <Text style={styles.addNoteTitle}>Add Annotation</Text>

          <Text style={styles.addNoteColorLabel}>Color</Text>
          <View style={styles.colorRow}>
            {NOTE_COLORS.map((c) => (
              <Pressable
                key={c.pin}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.bg, borderColor: c.border },
                  selectedColor === c.pin && styles.colorSwatchSelected,
                ]}
                onPress={() => {
                  setSelectedColor(c.pin);
                  Haptics.selectionAsync();
                }}
              >
                {selectedColor === c.pin && (
                  <View style={[styles.colorSwatchDot, { backgroundColor: c.pin }]} />
                )}
              </Pressable>
            ))}
          </View>

          <TextInput
            ref={inputRef}
            style={styles.addNoteInput}
            placeholder="Type your annotation here..."
            placeholderTextColor={Colors.light.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={200}
            returnKeyType="done"
          />

          <View style={styles.addNoteActions}>
            <Pressable style={styles.addNoteCancelBtn} onPress={onClose}>
              <Text style={styles.addNoteCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.addNoteAddBtn, !text.trim() && styles.addNoteAddBtnDisabled]}
              onPress={handleAdd}
              disabled={!text.trim()}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.addNoteAddText}>Add Note</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, addNote } = useDocuments();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const doc = documents.find((d) => d.id === id);

  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [pendingTap, setPendingTap] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const [selectedNote, setSelectedNote] = useState<{ note: Note; pageId: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useLayoutEffect(() => {
    if (!doc) return;
    navigation.setOptions({
      title: doc.title,
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 16, marginRight: 4 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          />
        </View>
      ),
    });
  }, [doc, navigation]);

  const handlePageTap = useCallback(
    (pageId: string, x: number, y: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPendingTap({ pageId, x, y });
      setAddNoteVisible(true);
    },
    []
  );

  async function handleAddNote(text: string, color: string) {
    if (!pendingTap || !doc) return;
    await addNote(doc.id, pendingTap.pageId, {
      text,
      x: pendingTap.x,
      y: pendingTap.y,
      color,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPendingTap(null);
  }

  if (!doc) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Feather name="alert-circle" size={40} color={Colors.light.textTertiary} />
        <Text style={styles.notFoundText}>Document not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const totalNotes = doc.pages.reduce((sum, p) => sum + p.notes.length, 0);

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.documentBackground }]}>
      <View style={[styles.docInfoBar, { paddingTop: insets.top + 56 }]}>
        <View style={styles.docInfoContent}>
          <View style={[styles.docColorDot, { backgroundColor: doc.color }]} />
          <Text style={styles.docInfoTitle} numberOfLines={1}>{doc.title}</Text>
          <Text style={styles.docInfoMeta}>
            {doc.pageCount} pages · {totalNotes} note{totalNotes !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.docPageIndicator}>
          <Text style={styles.docPageText}>{currentPage + 1} / {doc.pageCount}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pagesScroll}
        contentContainerStyle={styles.pagesContent}
        onScroll={(e) => {
          const page = Math.round(
            e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
          );
          setCurrentPage(page);
        }}
        scrollEventThrottle={16}
      >
        {doc.pages.map((page, i) => (
          <View
            key={page.id}
            style={{ width: Platform.OS === "web" ? "100%" : undefined }}
          >
            <DocumentPage
              page={page}
              pageIndex={i}
              docColor={doc.color}
              onTap={(x, y) => handlePageTap(page.id, x, y)}
              onNotePress={(note) => setSelectedNote({ note, pageId: page.id })}
            />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.pageDotsRow}>
          {doc.pages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.pageDot,
                i === currentPage && styles.pageDotActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.tapHint}>
          <Feather name="crosshair" size={12} color={Colors.light.textTertiary} />
          {"  "}Tap anywhere on the page to add an annotation
        </Text>
      </View>

      <AddNoteModal
        visible={addNoteVisible}
        onClose={() => {
          setAddNoteVisible(false);
          setPendingTap(null);
        }}
        onAdd={handleAddNote}
      />

      {selectedNote && (
        <NoteDetailModal
          note={selectedNote.note}
          pageId={selectedNote.pageId}
          docId={doc.id}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </View>
  );
}

const PAGE_WIDTH = Platform.OS === "web" ? 600 : 320;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFoundText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  backBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.navy,
  },
  backBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  docInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.headerBackground,
  },
  docInfoContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  docColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  docInfoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    flex: 1,
  },
  docInfoMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  docPageIndicator: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  docPageText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  pagesScroll: {
    flex: 1,
  },
  pagesContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 20,
    alignItems: "center",
  },
  pageContainer: {
    width: PAGE_WIDTH,
    marginHorizontal: 0,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  pageLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pageNoteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pageNoteBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.tintDim,
  },
  pageContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    paddingLeft: 24,
    minHeight: 480,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
    position: "relative",
  },
  pageStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  docLine: {
    borderRadius: 3,
  },
  notePin: {
    position: "absolute",
    maxWidth: 130,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  notePinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 3,
    flexShrink: 0,
  },
  notePinText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.text,
    lineHeight: 15,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  pageDotsRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.border,
  },
  pageDotActive: {
    width: 20,
    backgroundColor: Colors.light.navy,
  },
  tapHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  noteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  noteModalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    gap: 12,
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  noteModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteModalPinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noteModalTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  noteModalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  noteModalBody: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
  },
  noteModalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  noteModalMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  noteDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.destructiveLight,
  },
  noteDeleteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.destructive,
  },
  addNoteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  addNoteCard: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  addNoteHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  addNoteTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  addNoteColorLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    transform: [{ scale: 1.15 }],
  },
  colorSwatchDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  addNoteInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 90,
    textAlignVertical: "top",
  },
  addNoteActions: {
    flexDirection: "row",
    gap: 12,
  },
  addNoteCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
  },
  addNoteCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  addNoteAddBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.navy,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  addNoteAddBtnDisabled: {
    opacity: 0.4,
  },
  addNoteAddText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
