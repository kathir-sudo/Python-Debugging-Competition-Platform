import React, { useEffect } from 'react';
import AceEditor from 'react-ace';

// These imports are for type declarations and bundler awareness, 
// but Ace is loaded from a script tag in index.html, making it globally available.
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-cobalt';
import 'ace-builds/src-noconflict/ext-language_tools';

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  problemId: string;
  readOnly?: boolean;
}

const DRAFT_PREFIX = 'pycompete-draft-';

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, problemId, readOnly = false }) => {
  const draftKey = `${DRAFT_PREFIX}${problemId}`;

  // Auto-save code to localStorage on change
  const handleChange = (newCode: string) => {
    onCodeChange(newCode);
    if (!readOnly) {
      localStorage.setItem(draftKey, newCode);
    }
  };

  return (
    <div className="flex-grow h-full w-full">
      <AceEditor
        mode="python"
        theme="cobalt"
        onChange={handleChange}
        value={code}
        name={`ace-editor-${problemId}`}
        // FIX: The `editorProps` property was causing an error due to an invalid key '$block Scrolling'.
        // This property is also deprecated and no longer needed, so it has been removed.
        width="100%"
        height="100%"
        fontSize={14}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        readOnly={readOnly}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 4,
        }}
      />
    </div>
  );
};

export default CodeEditor;