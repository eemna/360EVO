import { useContext } from "react";
import { BookmarkContext } from "../context/bookmarkContext";

export const useBookmarks = () => {
  return useContext(BookmarkContext);
};