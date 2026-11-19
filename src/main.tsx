import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => {
      if (reg.active?.scriptURL.includes('dev-sw.js')) {
        void reg.unregister();
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
