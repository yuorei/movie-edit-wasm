import React from 'react';

interface HeaderProps {
  onNewProject: () => void;
  onExport: () => void;
  exporting: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNewProject, onExport, exporting }) => (
  <header>
    <h1>FFmpeg.wasm ムービーエディタ</h1>
    <nav>
      <button type="button" onClick={onNewProject}>
        新規
      </button>
      <button type="button" onClick={onExport} disabled={exporting}>
        {exporting ? '書き出し中…' : '書き出し'}
      </button>
    </nav>
  </header>
);

export default Header;
