import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

interface UseInfiniteScrollOptions<T> {
  initialData: T[];
  fetchMore: (page: number) => Promise<T[]>;
  hasMore: boolean;
  skipInitialFetch?: boolean;
}

export function useInfiniteScroll<T>({
  initialData,
  fetchMore,
  hasMore,
  skipInitialFetch = false
}: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!hasMore || loading || skipInitialFetch) return

    const loadMore = async () => {
      setLoading(true);
      fetchMore(page)
        .then((newData) => {
          setData((prev) => [...prev, ...newData]);
          setPage((p) => p + 1);
        })
        .finally(() => setLoading(false));
    }

    loadMore()
  }, [hasMore, loading, skipInitialFetch, page, fetchMore]);

  const reset = async (newData: T[]) => {
    setData(newData);
    setPage(2); // On commence à 2 car les premières données sont déjà chargées
  };

  return {
    data,
    loading,
    ref,
    reset,
  };
}
