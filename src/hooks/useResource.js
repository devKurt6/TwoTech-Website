import { useState, useEffect, useCallback, useRef } from "react";
export function useResource(loader, initial = []) {
  const [data, setData] = useState(initial),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [version, setVersion] = useState(0),
    [loaded, setLoaded] = useState(false);
  const lastLoader = useRef(loader);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let alive = true;
    if (lastLoader.current !== loader) {
      setLoaded(false);
      lastLoader.current = loader;
    }
    setLoading(true);
    setError(null);
    loader()
      .then((d) => {
        if (alive) {
          setData(d);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loader, version]);
  useEffect(() => {
    window.addEventListener("tt-refresh", reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener("tt-refresh", reload);
      window.removeEventListener("focus", reload);
    };
  }, [reload]);
  return { data, loading, loaded, error, reload };
}
