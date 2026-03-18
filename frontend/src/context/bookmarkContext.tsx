import { createContext } from "react";

export interface BookmarkContextType {
  bookmarkedIds: Set<string>;
  toggle: (projectId: string) => Promise<void>;
}

export const BookmarkContext = createContext<BookmarkContextType>({
  bookmarkedIds: new Set(),
  toggle: async () => {},
});
