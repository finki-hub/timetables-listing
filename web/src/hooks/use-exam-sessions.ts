import { useEffect, useState } from 'react';

import {
  type ExamSessionYear,
  fetchExamSessions,
  groupSessionsByYear,
} from '@/lib/sessions';

type ExamSessionsState = {
  error: null | string;
  isLoading: boolean;
  years: ExamSessionYear[];
};

const initialState: ExamSessionsState = {
  error: null,
  isLoading: true,
  years: [],
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const useExamSessions = () => {
  const [state, setState] = useState<ExamSessionsState>(initialState);

  useEffect(() => {
    const controller = new AbortController();

    const loadSessions = async () => {
      setState(initialState);
      try {
        const payload = await fetchExamSessions(controller.signal);
        if (!controller.signal.aborted) {
          setState({
            error: null,
            isLoading: false,
            years: groupSessionsByYear(payload),
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            error: errorMessage(error, 'Could not load exam sessions'),
            isLoading: false,
            years: [],
          });
        }
      }
    };

    void loadSessions();
    return () => {
      controller.abort();
    };
  }, []);

  return state;
};

export { useExamSessions };
