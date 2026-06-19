import { useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useEditorStore } from '../../state/editorStore.js';

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file. Uses the server when a project exists there; otherwise (or on
 * failure) falls back to an inline data URL so uploads work offline too.
 * Calls onUpload(url, { filename, mime }).
 */
export default function UploadButton({ accept, onUpload, label = 'Upload' }) {
  const [busy, setBusy] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const meta = { filename: file.name, mime: file.type };
    try {
      const serverId = useEditorStore.getState().serverId;
      if (serverId) {
        const asset = await api.uploadAsset(serverId, file);
        onUpload(asset.url, meta);
      } else {
        onUpload(await fileToDataURL(file), meta);
      }
    } catch {
      onUpload(await fileToDataURL(file), meta);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <label className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-300 px-2 py-1.5 text-xs text-neutral-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-600">
      <Upload size={13} />
      {busy ? 'Uploading…' : label}
      <input type="file" accept={accept} onChange={handle} className="hidden" />
    </label>
  );
}
