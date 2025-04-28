import { useState, useEffect, useMemo } from "react";

export function usePagination(items, itemsPerPage) {
  const [currentPage, setCurrentPage] = useState(() => {
    const storedPage = localStorage.getItem("page");
    return storedPage ? parseInt(storedPage, 10) : 1;
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
    [items.length, itemsPerPage]
  );

  const currentItems = useMemo(() => {
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (newPage) => {
    const validatedPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(validatedPage);
    localStorage.setItem("page", validatedPage.toString());

    localStorage.setItem("position", "0");
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      goToPage(totalPages);
    }
  }, [totalPages]);

  useEffect(() => {
    const storedPosition = localStorage.getItem("position");
    if (storedPosition) {
      window.scrollTo(0, parseInt(storedPosition, 10));
    }

    const handleScroll = () => {
      localStorage.setItem("position", window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
  };
}
