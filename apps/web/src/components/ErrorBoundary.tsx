import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; err?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: any) { return { hasError: true, err }; }
  componentDidCatch(error: any, info: any) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 16, color: '#e8eef5' }}>
          <b>Р§С‚Рѕ-С‚Рѕ РїРѕС€Р»Рѕ РЅРµ С‚Р°Рє.</b>
          <div style={{ opacity: 0.8, fontSize: 12, marginTop: 8 }}>
            РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РїРµСЂРµР·Р°РїСѓСЃС‚РёС‚Рµ РїСЂРёР»РѕР¶РµРЅРёРµ РёР»Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

