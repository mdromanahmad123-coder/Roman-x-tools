import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, RefreshCw, LogOut, Code, ExternalLink, ShieldAlert, FileJson, Edit2, Trash2, CheckCircle2, Send, Plus, Copy, Sparkles, Terminal, X, Save, ArrowRight, Wand2, MessageSquare, ListTodo, Play } from 'lucide-react';
import { DbConnection, Notification } from './types';
import { checkConnection, readData, writeData, updateData, deleteData, cleanUrl } from './services/firebaseService';
import { generateDataWithAI, AIResponse } from './services/geminiService';
import DataNode from './components/DataNode';

function App() {
  const [dbInfo, setDbInfo] = useState<DbConnection>({ url: '', connected: false });
  const [urlInput, setUrlInput] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modes
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [rawJsonInput, setRawJsonInput] = useState('');
  
  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPath, setAiPath] = useState(''); 
  const [aiLoading, setAiLoading] = useState(false);
  
  // New AI State
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);

  // Function to add a toast notification
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setLoading(true);
    setError(null);
    const targetUrl = cleanUrl(urlInput);

    try {
      await checkConnection(targetUrl);
      setDbInfo({ url: targetUrl, connected: true });
      notify("Connected successfully!", "success");
      fetchRootData(targetUrl);
    } catch (err: any) {
      setError(err.message || "Failed to connect.");
      notify("Connection failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRootData = async (url: string = dbInfo.url) => {
    setLoading(true);
    try {
      const result = await readData(url);
      setData(result);
      if (viewMode === 'raw') {
        setRawJsonInput(JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      console.error(err);
      notify(err.message || "Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setDbInfo({ url: '', connected: false });
    setData(null);
    setUrlInput('');
    setError(null);
    setViewMode('tree');
  };

  const handleCreateRoot = async () => {
     try {
       await writeData(dbInfo.url, '', { "demo_key": "Hello World", "created_at": Date.now() });
       fetchRootData();
       notify("Database initialized", "success");
     } catch(e: any) {
       notify(e.message || "Could not write initial data", "error");
     }
  };
  
  const handleSaveRaw = async () => {
    setLoading(true);
    try {
        const parsed = JSON.parse(rawJsonInput);
        await writeData(dbInfo.url, '', parsed);
        notify("Database updated from JSON!", "success");
        fetchRootData();
        setViewMode('tree');
    } catch (e: any) {
        notify("Invalid JSON format. Please check syntax.", "error");
        setLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if(!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null); 

    try {
        let contextData = null;
        let rootKeys: string[] = [];

        // If path is provided, get that data.
        if (aiPath.trim()) {
           try {
             contextData = await readData(dbInfo.url, aiPath.trim());
           } catch(e) {
             console.warn("Could not fetch context path");
           }
        } else if (data && typeof data === 'object') {
            // If no path, give AI the list of root keys so it knows structure
            rootKeys = Object.keys(data);
        }

        const response = await generateDataWithAI(aiPrompt, {
            currentData: contextData,
            rootKeys: rootKeys,
            basePath: aiPath.trim()
        });
        
        setAiResult(response);
        
        if (response.actions.length > 0) {
             notify(`AI proposed ${response.actions.length} actions.`, "success");
        } else {
             notify("AI replied (no actions).", "info");
        }

    } catch (e: any) {
        notify(e.message, "error");
    } finally {
        setAiLoading(false);
    }
  };

  const handleExecuteAiPlan = async () => {
    if (!aiResult?.actions || aiResult.actions.length === 0) return;
    setLoading(true);
    
    try {
      let successCount = 0;
      
      for (const action of aiResult.actions) {
          // Normalize path: if user typed "delete users/1" and context was root, use path as is.
          // The AI service returns full paths relative to DB root or context.
          const fullPath = action.path.startsWith('/') ? action.path.slice(1) : action.path;

          if (action.type === 'DELETE') {
              await deleteData(dbInfo.url, fullPath);
          } else if (action.type === 'SET') {
              await writeData(dbInfo.url, fullPath, action.data);
          } else if (action.type === 'UPDATE') {
              await updateData(dbInfo.url, fullPath, action.data);
          }
          successCount++;
      }
      
      notify(`Successfully executed ${successCount} actions.`, "success");
      
      setShowAiModal(false);
      setAiPrompt('');
      setAiPath('');
      setAiResult(null);
      fetchRootData();
    } catch (e: any) {
      notify("Error executing plan: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-900 text-slate-100 relative selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in-up flex items-center gap-2 border ${
            n.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' : 
            n.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-100' : 'bg-slate-800/90 border-slate-600 text-slate-100'
          }`}>
             {n.type === 'error' && <AlertCircle size={18} />}
             {n.type === 'success' && <CheckCircle2 size={18} />}
             {n.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-40 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/40 border border-indigo-400/20">
              <Database className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                Roman crack X tools
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                <Sparkles size={10} /> Ultimate Edition
              </span>
            </div>
          </div>
          
          {dbInfo.connected && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setShowAiModal(true); setAiPath(''); setAiResult(null); }}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-fuchsia-900/20 transition-all hover:-translate-y-0.5"
              >
                <Sparkles size={16} /> AI Assistant
              </button>

              <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>
              
              <button 
                onClick={() => fetchRootData()} 
                disabled={loading}
                className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all active:scale-95 bg-slate-800 border border-slate-700"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-lg text-sm transition-all font-medium"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {!dbInfo.connected ? (
          /* Connection View */
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500 px-4">
            <div className="w-full max-w-lg bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 group-hover:h-1.5 transition-all duration-500"></div>
              
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Connect Database</h2>
                <p className="text-slate-400 text-sm">
                  Secure, Real-time Firebase Management.
                </p>
              </div>

              <form onSubmit={handleConnect} className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    Database URL or Project ID
                  </label>
                  <div className="relative group/input">
                    <input
                      type="text"
                      id="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="e.g. roman-tools-db"
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl py-4 px-4 pl-12 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder-slate-600 font-mono text-sm shadow-inner"
                      required
                    />
                    <div className="absolute left-4 top-4 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                      <Code size={20} />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-400" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 transform active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>Start Explorer <ExternalLink size={18} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Dashboard View */
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between items-start md:items-center">
                 <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button 
                      onClick={() => setViewMode('tree')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'tree' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                       <FileJson size={16} /> Tree View
                    </button>
                    <button 
                      onClick={() => { setViewMode('raw'); setRawJsonInput(JSON.stringify(data, null, 2)); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'raw' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                       <Terminal size={16} /> Raw JSON
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => { setShowAiModal(true); setAiPath(''); setAiResult(null); }}
                        className="flex-1 md:flex-none md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg text-sm font-bold shadow-lg"
                    >
                        <Sparkles size={16} /> AI Gen
                    </button>
                 </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
              {/* Toolbar */}
              <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
                 <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    <span className="text-indigo-400 font-bold">PATH:</span> {dbInfo.url.replace('https://', '').split('.')[0]} / {viewMode === 'tree' ? 'root' : ''}
                 </div>
                 <div className="text-xs text-slate-500">
                    {data ? (Array.isArray(data) ? `Array[${data.length}]` : (typeof data === 'object' ? `Object` : typeof data)) : 'Empty'}
                 </div>
              </div>
              
              {/* Content Area */}
              <div className="flex-1 bg-slate-900/50 relative overflow-hidden flex flex-col">
                {loading && !data && (
                   <div className="absolute inset-0 z-10 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
                     <RefreshCw size={40} className="animate-spin mb-4 text-cyan-500" />
                     <p className="text-cyan-100 font-medium">Syncing with Firebase...</p>
                   </div>
                )}

                {/* Tree View */}
                {viewMode === 'tree' && (
                    <div className="overflow-auto p-0 flex-1">
                        {!data ? (
                             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="p-8 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center max-w-sm text-center">
                                   <Database size={48} className="mb-4 text-slate-600" />
                                   <p className="mb-2 font-bold text-lg text-slate-300">Database is empty</p>
                                   <p className="text-sm text-slate-500 mb-6">Start by adding data manually, or use the AI Generator to create mock data.</p>
                                   <div className="flex gap-3">
                                       <button 
                                         onClick={handleCreateRoot}
                                         className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                                       >
                                         Init Demo
                                       </button>
                                       <button 
                                         onClick={() => setShowAiModal(true)}
                                         className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                       >
                                         <Sparkles size={14} /> Use AI
                                       </button>
                                   </div>
                                </div>
                             </div>
                        ) : (
                            <div className="font-mono text-sm">
                                {typeof data === 'object' ? (
                                    Object.entries(data).map(([key, val]) => (
                                    <DataNode 
                                        key={key} 
                                        name={key} 
                                        path="" 
                                        value={val as any} 
                                        dbUrl={dbInfo.url}
                                        onRefresh={fetchRootData}
                                        depth={0}
                                    />
                                    ))
                                ) : (
                                    <DataNode 
                                    name="root"
                                    path="" 
                                    value={data} 
                                    dbUrl={dbInfo.url}
                                    onRefresh={fetchRootData}
                                    depth={0}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Raw JSON View */}
                {viewMode === 'raw' && (
                    <div className="flex-1 flex flex-col h-full">
                        <textarea 
                            className="flex-1 w-full bg-slate-950 text-slate-200 font-mono text-sm p-4 outline-none resize-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50"
                            value={rawJsonInput}
                            onChange={(e) => setRawJsonInput(e.target.value)}
                            spellCheck={false}
                            placeholder="// Paste your JSON here..."
                        />
                        <div className="bg-slate-800 p-3 border-t border-slate-700 flex justify-end gap-3">
                             <button 
                               onClick={() => { setViewMode('tree'); setRawJsonInput(''); }}
                               className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                             >
                               Cancel
                             </button>
                             <button 
                               onClick={handleSaveRaw}
                               disabled={loading}
                               className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"
                             >
                               <Save size={16} /> Save Changes
                             </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 px-4">
            <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-cyan-500 animate-pulse"></div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                             <div className="bg-fuchsia-600/20 p-2 rounded-lg">
                               <Sparkles size={24} className="text-fuchsia-400" />
                             </div>
                             <div>
                               <h3 className="text-xl font-bold text-white">AI Assistant</h3>
                               <p className="text-xs text-slate-400">Generate, Edit, or Chat</p>
                             </div>
                        </div>
                        <button onClick={() => setShowAiModal(false)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 p-1 rounded-md">
                            <X size={20} />
                        </button>
                    </div>

                    {!aiResult ? (
                        /* Step 1: Input */
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 block">
                                    Target Path (Optional)
                                </label>
                                <div className="relative">
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 pl-10 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono placeholder-slate-600"
                                        placeholder="e.g. users/user_123"
                                        value={aiPath}
                                        onChange={(e) => setAiPath(e.target.value)}
                                    />
                                    <div className="absolute left-3 top-3.5 text-slate-600">
                                        <Code size={16} />
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1.5 ml-1">
                                        Leave empty to let AI decide paths based on your prompt.
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2 block">
                                    Instructions
                                </label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none resize-none h-32"
                                    placeholder="e.g. 'Delete the user Roman' or 'Add a new admin account'"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleAiGenerate}
                                disabled={aiLoading || !aiPrompt.trim()}
                                className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
                            >
                                {aiLoading ? (
                                    <>
                                    <RefreshCw size={18} className="animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                    <Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> 
                                    Generate Plan
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Step 2: Result */
                        <div className="flex flex-col h-full gap-4">
                             {/* AI Message Bubble */}
                             <div className="flex gap-3 items-start">
                                <div className="p-2 rounded-full bg-fuchsia-600/20 text-fuchsia-400 mt-1 shrink-0">
                                    <MessageSquare size={16} />
                                </div>
                                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none text-slate-200 text-sm leading-relaxed border border-slate-700/50">
                                    {aiResult.message}
                                </div>
                             </div>

                             {/* Action Plan List */}
                             {aiResult.actions.length > 0 && (
                                 <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-auto max-h-[250px] text-slate-300 relative group flex-1">
                                    <div className="flex items-center gap-2 mb-3 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2">
                                        <ListTodo size={14} /> Proposed Actions
                                    </div>
                                    <div className="space-y-2">
                                        {aiResult.actions.map((action, idx) => (
                                            <div key={idx} className="flex gap-3 p-2 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800 transition-colors">
                                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold h-fit ${
                                                    action.type === 'DELETE' ? 'bg-red-900/50 text-red-400 border border-red-500/30' : 
                                                    action.type === 'SET' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' : 
                                                    'bg-blue-900/50 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                    {action.type}
                                                </div>
                                                <div className="flex-1 break-all">
                                                    <div className="text-indigo-300 font-bold">{action.path || '/'}</div>
                                                    {action.data !== undefined && (
                                                        <div className="text-slate-500 truncate mt-1 max-w-[200px] opacity-70">
                                                            {JSON.stringify(action.data)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                 </div>
                             )}

                             <div className="flex gap-3 mt-2">
                                 <button 
                                    onClick={() => setAiResult(null)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                                 >
                                    Cancel
                                 </button>
                                 
                                 {aiResult.actions.length > 0 && (
                                     <button 
                                        onClick={handleExecuteAiPlan}
                                        className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2"
                                     >
                                        <Play size={18} fill="currentColor" /> Execute Actions
                                     </button>
                                 )}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-400">
            Made by <span className="text-indigo-400 font-bold">Roman</span>
          </div>
          <a 
            href="https://t.me/Roman_Gaming1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-full transition-all text-sm font-bold shadow-lg shadow-blue-500/20 group hover:-translate-y-0.5"
          >
            <Send size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> 
            Join Telegram Channel
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;