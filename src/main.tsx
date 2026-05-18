import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';
import '@/index.css';

const root = document.querySelector('#root');

if (!(root instanceof HTMLElement)) {
  throw new TypeError('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
