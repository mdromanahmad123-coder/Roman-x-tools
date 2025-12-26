import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit2, Save, X, Trash2, Plus, Copy, Check, Link, MoreHorizontal } from 'lucide-react';
import { FirebaseValue, NodeProps } from '../types';
import { writeData, deleteData } from '../services/firebaseService';

const DataNode: React.FC<NodeProps> = ({ path, name, value, dbUrl, onRefresh, depth = 0 }) => {
  const [expanded, setExpanded] = useState<boolean>(depth < 1); 
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  
  const [editValue, setEditValue] = useState<string>('');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<boolean>(false);

  const isObject = value !== null && typeof value === 'object';
  const displayPath = path ? `${path}/${name}` : name;
  
  // Brighter, high-contrast colors
  const getValueColor = (val: FirebaseValue) => {
    if (val === null) return 'text-slate-500 italic';
    if (typeof val === 'string') return 'text-emerald-400';
    if (typeof val === 'number') return 'text-cyan-400 font-bold';
    if (typeof val === 'boolean') return 'text-fuchsia-400 font-bold';
    return 'text-slate-100';
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = isObject ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(isObject ? JSON.stringify(value, null, 2) : String(value));
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      let parsedValue: any = editValue;
      
      // Smart parsing
      if (editValue === 'true') parsedValue = true;
      else if (editValue === 'false') parsedValue = false;
      else if (editValue === 'null') parsedValue = null;
      else if (!isNaN(Number(editValue)) && editValue.trim() !== '') parsedValue = Number(editValue);
      else {
        try {
          parsedValue = JSON.parse(editValue);
        } catch {
          parsedValue = editValue;
        }
      }

      await writeData(dbUrl, displayPath, parsedValue);
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      alert('Failed to save data. Check your format.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newKey.trim()) return;
    setLoading(true);
    try {
       const childPath = displayPath ? `${displayPath}/${newKey}` : newKey;
       
       let parsedValue: any = newValue;
       if (newValue === 'true') parsedValue = true;
       else if (newValue === 'false') parsedValue = false;
       else if (!isNaN(Number(newValue)) && newValue.trim() !== '') parsedValue = Number(newValue);
       
       // Attempt JSON parse for values like {"a":1}
       if (newValue.startsWith('{') || newValue.startsWith('[')) {
          try { parsedValue = JSON.parse(newValue); } catch {}
       }

       await writeData(dbUrl, childPath, parsedValue);
       setIsAdding(false);
       setNewKey('');
       setNewValue('');
       if (!expanded) setExpanded(true);
       onRefresh();
    } catch(error) {
      alert('Failed to add data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`⚠️ Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      setLoading(true);
      try {
        await deleteData(dbUrl, displayPath);
        onRefresh();
      } catch (error) {
        alert('Failed to delete node.');
      } finally {
        setLoading(false);
      }
    }
  };

  const paddingLeft = `${depth * 1.5}rem`;

  return (
    <div 
      className="flex flex-col border-b border-slate-700/50 last:border-b-0 hover:bg-slate-800/40 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`flex items-center py-2.5 px-2 transition-all ${
          isEditing ? 'bg-indigo-900/30 ring-1 ring-inset ring-indigo-500/50' : ''
        }`}
        style={{ paddingLeft }}
      >
        {/* Toggle */}
        {isObject ? (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="mr-2 text-indigo-400 hover:text-white p-0.5 rounded transition-transform active:scale-90"
          >
            {expanded ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
          </button>
        ) : (
          <div className="w-8 flex justify-center opacity-30 mr-1">
             <div className="w-1 h-1 rounded-full bg-slate-400"></div>
          </div>
        )}

        {/* Key & Value */}
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
          <span className="font-mono text-indigo-300 font-bold text-sm whitespace-nowrap drop-shadow-sm">{name}</span>
          
          {!isEditing && (
            <>
              <span className="text-slate-600 font-bold mx-1">:</span>
              <span className={`font-mono text-sm truncate select-text ${getValueColor(value)}`}>
                {isObject ? (
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {Array.isArray(value) ? `Array [${value.length}]` : `Object {${Object.keys(value).length}}`}
                  </span>
                ) : (
                  typeof value === 'string' ? `"${value}"` : String(value)
                )}
              </span>
            </>
          )}

          {/* Edit Input */}
          {isEditing && (
            <div className="flex-1 ml-2">
               <input
                 className="w-full bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg"
                 value={editValue}
                 onChange={(e) => setEditValue(e.target.value)}
                 autoFocus
                 onKeyDown={(e) => { if (e.key === 'Enter') handleSave(e as any); if (e.key === 'Escape') setIsEditing(false); }}
               />
            </div>
          )}
        </div>

        {/* Actions Toolbar - Always show some, show more on hover */}
        <div className={`flex items-center gap-1 ml-4 ${isHovered || isEditing ? 'opacity-100' : 'opacity-60 md:opacity-0 md:group-hover:opacity-100'} transition-opacity duration-200`}>
           {isEditing ? (
             <>
               <button onClick={handleSave} className="p-1.5 bg-emerald-600 text-white rounded shadow hover:bg-emerald-500" title="Save (Enter)">
                 <Check size={14} strokeWidth={3} />
               </button>
               <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600" title="Cancel (Esc)">
                 <X size={14} strokeWidth={3} />
               </button>
             </>
           ) : (
             <>
               {isObject && (
                 <button 
                   onClick={() => { setExpanded(true); setIsAdding(true); }}
                   className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-600 rounded transition-colors" 
                   title="Add Child"
                 >
                   <Plus size={16} />
                 </button>
               )}
                <button 
                 onClick={handleCopyPath} 
                 className={`p-1.5 rounded transition-colors ${copiedPath ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                 title="Copy Path"
               >
                 {copiedPath ? <Check size={16} /> : <Link size={16} />}
               </button>
               <button 
                 onClick={handleCopy} 
                 className={`p-1.5 rounded transition-colors ${copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                 title="Copy Value"
               >
                 {copied ? <Check size={16} /> : <Copy size={16} />}
               </button>
               <button 
                 onClick={handleEditStart}
                 className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                 title="Edit"
               >
                 <Edit2 size={16} />
               </button>
               <button 
                 onClick={handleDelete}
                 className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                 title="Delete"
               >
                 <Trash2 size={16} />
               </button>
             </>
           )}
        </div>
      </div>

      {/* Add Child Form */}
      {isAdding && (
        <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border-y border-indigo-500/30 py-3 px-4 flex flex-col gap-3 animate-in slide-in-from-left-4" style={{ paddingLeft: `${(depth + 1) * 1.5}rem` }}>
           <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
             <Plus size={12} /> Add to /{name}
           </div>
           <div className="flex items-center gap-2">
             <div className="flex-1 flex gap-2">
                <input 
                    placeholder="Key Name" 
                    className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-inner"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    autoFocus
                />
                <input 
                    placeholder="Value (String, Number, JSON)" 
                    className="flex-[2] bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-inner"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddChild(); }}
                />
             </div>
             <button 
               onClick={handleAddChild}
               disabled={!newKey}
               className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50 shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
             >
               Add
             </button>
             <button 
               onClick={() => setIsAdding(false)}
               className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg text-sm active:scale-95 transition-all"
             >
               Close
             </button>
           </div>
        </div>
      )}

      {/* Children */}
      {isObject && expanded && value && (
        <div className="w-full">
          {Object.entries(value).map(([childKey, childValue]) => (
            <DataNode
              key={childKey}
              name={childKey}
              path={displayPath}
              value={childValue}
              dbUrl={dbUrl}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DataNode;