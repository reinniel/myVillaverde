import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import { NativeDirectionsBridge } from './components/NativeDirectionsBridge.tsx';
import './index.css';
import './styles/directions-modal.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <NativeDirectionsBridge>
        <App />
      </NativeDirectionsBridge>
    </AppErrorBoundary>
  </StrictMode>,
);
