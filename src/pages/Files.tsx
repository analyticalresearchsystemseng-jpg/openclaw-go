import { useState, useEffect } from 'react'
import { FileText, Folder, ChevronRight, ChevronDown, Save, RefreshCw, ArrowLeft, Edit3, X } from 'lucide-react'
import { api } from '../api/gateway'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

export default function FileEditor() {
  const [currentPath, setCurrentPath] = useState('~/.openclaw')
  const [files, setFiles] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingFile, setEditingFile] = useState<{ path: string; content: string; original: string } | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['~/.openclaw']))

  const quickPaths = [
    { label: 'OpenClaw Config', path: '~/.openclaw' },
    { label: 'Agent Config', path: '~/.openclaw/agents' },
    { label: 'Skills', path: '~/.openclaw/workspace/skills' },
    { label: 'Projects', path: '~/.openclaw/workspace/projects' },
    { label: 'Memory', path: '~/.openclaw/workspace/memory' },
  ]

  useEffect(() => {
    loadDirectory(currentPath)
  }, [currentPath])

  async function loadDirectory(path: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await api.fileList(path)
      setFiles(result || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function openFile(path: string) {
    setLoading(true)
    try {
      const content = await api.fileRead(path)
      setEditingFile({ path, content, original: content })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveFile() {
    if (!editingFile) return
    setLoading(true)
    try {
      await api.fileWrite(editingFile.path, editingFile.content)
      setEditingFile({ ...editingFile, original: editingFile.content })
      alert('Saved!')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function navigateUp() {
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.join('/') || '~')
  }

  function toggleDir(path: string) {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  if (editingFile) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-3 border-b border-gray-200">
          <button onClick={() => setEditingFile(null)} className="p-2">
            <ArrowLeft size={20} />
          </button>
          <span className="flex-1 font-mono text-sm truncate">{editingFile.path}</span>
          <button 
            onClick={saveFile}
            disabled={editingFile.content === editingFile.original}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm disabled:opacity-50"
          >
            <Save size={16} /> Save
          </button>
        </div>

        <textarea
          value={editingFile.content}
          onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
          className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />

        {editingFile.content !== editingFile.original && (
          <div className="p-2 bg-yellow-50 text-yellow-800 text-sm flex items-center gap-2">
            <Edit3 size={16} />
            Unsaved changes
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={24} className="text-claw-primary" />
          <h2 className="text-xl font-bold">File Editor</h2>
        </div>
        <button onClick={() => loadDirectory(currentPath)} className="p-2">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 text-red-600 text-sm p-3">{error}</div>
      )}

      {/* Quick paths */}
      <div className="flex flex-wrap gap-2">
        {quickPaths.map(p => (
          <button
            key={p.path}
            onClick={() => setCurrentPath(p.path)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              currentPath === p.path 
                ? 'bg-claw-primary text-white' 
                : 'bg-claw-card text-claw-muted'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Current path */}
      <div className="flex items-center gap-2 p-2 bg-claw-card rounded-lg">
        <button onClick={navigateUp} className="p-1 text-claw-muted">
          <ArrowLeft size={16} />
        </button>
        <span className="font-mono text-sm flex-1 truncate">{currentPath}</span>
      </div>

      {/* File list */}
      <div className="space-y-1">
        {files.map(file => (
          <div key={file.path}>
            {file.type === 'dir' ? (
              <button
                onClick={() => {
                  toggleDir(file.path)
                  setCurrentPath(file.path)
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-claw-card text-left"
              >
                <Folder size={18} className="text-yellow-500" />
                <span className="flex-1">{file.name}</span>
                <ChevronRight size={16} className="text-claw-muted" />
              </button>
            ) : (
              <button
                onClick={() => openFile(file.path)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-claw-card text-left"
              >
                <FileText size={18} className="text-blue-500" />
                <span className="flex-1 text-sm">{file.name}</span>
                <span className="text-xs text-claw-muted">Edit</span>
              </button>
            )}
          </div>
        ))}

        {files.length === 0 && !loading && (
          <div className="text-center text-claw-muted py-8">Empty directory</div>
        )}
      </div>
    </div>
  )
}
