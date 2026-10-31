import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App.js';
import './styles/index.css';

const rootElement = document.querySelector<HTMLDivElement>('#root');

if (rootElement === null) {
  throw new Error('No se encontró el elemento #root requerido por la aplicación web.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
