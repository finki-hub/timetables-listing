import { useEffect, useState } from 'react';

const REFRESH_MS = 30_000;

const useNow = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, REFRESH_MS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return now;
};

export { useNow };
