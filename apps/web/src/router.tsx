import React from 'react';
import { createHashRouter } from 'react-router-dom';
import App from './App';

// Data router with v7 future flags enabled to silence warnings
export const router = createHashRouter(
  [
    {
      path: '/*',
      element: <App />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

export default router;

