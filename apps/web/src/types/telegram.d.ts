export {}; // ensure this is a module

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData?: string;
        initDataUnsafe?: any;
        ready?: () => void;
        expand?: () => void;
        setBackgroundColor?: (color: string) => void;
        [key: string]: any;
      };
    };
  }
}
