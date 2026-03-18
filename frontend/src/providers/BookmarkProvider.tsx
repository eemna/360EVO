import { useState, useEffect, useCallback } from "react";
import { BookmarkContext } from "../context/bookmarkContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import api from "../services/axios";

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    api.get("/bookmarks/ids")
      .then(({ data }) => setBookmarkedIds(new Set(data)))
      .catch(() => {});
  }, [user]);

  const toggle = useCallback(async (projectId: string) => {
    const isBookmarked = bookmarkedIds.has(projectId);

    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(projectId);
      else next.add(projectId);
      return next;
    });

    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${projectId}`);
        showToast({ type: "success", title: "Bookmark removed", message: "" });
      } else {
        await api.post(`/bookmarks/${projectId}`);
        showToast({ type: "success", title: "Project bookmarked!", message: "" });
      }
    } catch {
      showToast({ type: "error", title: "Action failed", message: "" });
    }
  }, [bookmarkedIds, showToast]);

  return (
    <BookmarkContext.Provider value={{ bookmarkedIds, toggle }}>
      {children}
    </BookmarkContext.Provider>
  );
}