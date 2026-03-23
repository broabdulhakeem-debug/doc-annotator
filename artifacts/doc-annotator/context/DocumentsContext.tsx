import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Note = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
};

export type Page = {
  id: string;
  notes: Note[];
  scanUri?: string;
};

export type Document = {
  id: string;
  title: string;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
  pageCount: number;
  color: string;
};

type DocumentsContextType = {
  documents: Document[];
  isLoading: boolean;
  addDocument: (title: string) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  updateDocument: (doc: Document) => Promise<void>;
  addNote: (docId: string, pageId: string, note: Omit<Note, "id" | "createdAt">) => Promise<void>;
  deleteNote: (docId: string, pageId: string, noteId: string) => Promise<void>;
  updatePageScan: (docId: string, pageId: string, uri: string | undefined) => Promise<void>;
};

const DocumentsContext = createContext<DocumentsContextType | null>(null);

const STORAGE_KEY = "@doc_annotator/documents";

const DOC_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#6366F1",
];

const DOC_TEMPLATES = [
  { title: "Project Brief", pageCount: 4 },
  { title: "Meeting Notes", pageCount: 2 },
  { title: "Research Report", pageCount: 8 },
  { title: "Design Spec", pageCount: 6 },
  { title: "Technical Docs", pageCount: 12 },
  { title: "Quarterly Review", pageCount: 5 },
];

function generatePages(count: number): Page[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `page-${i + 1}`,
    notes: [],
  }));
}

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setDocuments(JSON.parse(raw));
      } else {
        const seedDocs: Document[] = DOC_TEMPLATES.map((t, i) => ({
          id: `doc-${Date.now()}-${i}`,
          title: t.title,
          pages: generatePages(t.pageCount),
          pageCount: t.pageCount,
          createdAt: Date.now() - i * 86400000,
          updatedAt: Date.now() - i * 43200000,
          color: DOC_COLORS[i % DOC_COLORS.length],
        }));
        setDocuments(seedDocs);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedDocs));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function persist(docs: Document[]) {
    setDocuments(docs);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }

  const addDocument = useCallback(async (title: string): Promise<Document> => {
    const pageCount = Math.floor(Math.random() * 8) + 2;
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title,
      pages: generatePages(pageCount),
      pageCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: DOC_COLORS[Math.floor(Math.random() * DOC_COLORS.length)],
    };
    const updated = [newDoc, ...documents];
    await persist(updated);
    return newDoc;
  }, [documents]);

  const deleteDocument = useCallback(async (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    await persist(updated);
  }, [documents]);

  const updateDocument = useCallback(async (doc: Document) => {
    const updated = documents.map((d) => (d.id === doc.id ? { ...doc, updatedAt: Date.now() } : d));
    await persist(updated);
  }, [documents]);

  const addNote = useCallback(
    async (docId: string, pageId: string, note: Omit<Note, "id" | "createdAt">) => {
      const newNote: Note = {
        ...note,
        id: `note-${Date.now()}`,
        createdAt: Date.now(),
      };
      const updated = documents.map((doc) => {
        if (doc.id !== docId) return doc;
        return {
          ...doc,
          updatedAt: Date.now(),
          pages: doc.pages.map((page) => {
            if (page.id !== pageId) return page;
            return { ...page, notes: [...page.notes, newNote] };
          }),
        };
      });
      await persist(updated);
    },
    [documents]
  );

  const deleteNote = useCallback(
    async (docId: string, pageId: string, noteId: string) => {
      const updated = documents.map((doc) => {
        if (doc.id !== docId) return doc;
        return {
          ...doc,
          updatedAt: Date.now(),
          pages: doc.pages.map((page) => {
            if (page.id !== pageId) return page;
            return { ...page, notes: page.notes.filter((n) => n.id !== noteId) };
          }),
        };
      });
      await persist(updated);
    },
    [documents]
  );

  const updatePageScan = useCallback(
    async (docId: string, pageId: string, uri: string | undefined) => {
      const updated = documents.map((doc) => {
        if (doc.id !== docId) return doc;
        return {
          ...doc,
          updatedAt: Date.now(),
          pages: doc.pages.map((page) => {
            if (page.id !== pageId) return page;
            return { ...page, scanUri: uri };
          }),
        };
      });
      await persist(updated);
    },
    [documents]
  );

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        isLoading,
        addDocument,
        deleteDocument,
        updateDocument,
        addNote,
        deleteNote,
        updatePageScan,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentsProvider");
  return ctx;
}
