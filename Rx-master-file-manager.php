<?php
/**
 * RX c-Panel - Safe Edition (InfinityFree 100% Compatible)
 * Based on basic safe PHP logic to prevent HTTP 500 Errors
 * Developed by: @Roman_no_1 (Telegram)
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

session_start();

// 🔒 Security: Password Protect
$password = "roman321"; 

// 🟢 Helper Function: Format File Size
function formatBytes($size, $precision = 2) {
    if ($size <= 0) return "0 B";
    $base = log($size, 1024);
    $suffixes = array('B', 'KB', 'MB', 'GB', 'TB');
    return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[floor($base)];
}

// 🟢 Smart Live URL Guesser
function getLiveUrl($filePath) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https://" : "http://";
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    $docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']) : '';
    $filePath = str_replace('\\', '/', $filePath);

    if (!empty($docRoot) && strpos($filePath, $docRoot) === 0) {
        return $protocol . $host . substr($filePath, strlen($docRoot));
    }
    if (preg_match('/\/home[^\/]*\/[^\/]+\/public_html\/(.+)$/', $filePath, $matches) || 
        preg_match('/\/home[^\/]*\/[^\/]+\/(.+)$/', $filePath, $matches)) {
        $parts = explode('/', $matches[1]);
        $potentialDomain = $parts[0];
        if (strpos($potentialDomain, '.') !== false) {
            $relPath = substr($matches[1], strlen($potentialDomain));
            return $protocol . $potentialDomain . $relPath;
        }
    }
    return false;
}

// ================= Auth System =================
if (!isset($_SESSION['logged_in'])) {
    if (isset($_POST['pass']) && $_POST['pass'] === $password) {
        $_SESSION['logged_in'] = true; header("Location: ?"); exit;
    } else {
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RX c-Panel - Secure Login</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>body { background: #0f172a; font-family: 'Inter', sans-serif; }</style>
        </head>
        <body class="flex flex-col items-center justify-center min-h-screen p-4">
            <div class="fixed top-0 w-full bg-indigo-600 text-white text-[11px] sm:text-xs font-bold text-center py-2.5 uppercase tracking-widest shadow-md z-50">
                Developed by <a href="https://t.me/Roman_no_1" target="_blank" class="text-indigo-200 hover:text-white transition-colors ml-1"><i class="fa-brands fa-telegram text-sm"></i> @Roman_no_1</a>
            </div>

            <form method="post" class="bg-slate-800/80 backdrop-blur-xl p-8 rounded-[24px] shadow-2xl border border-slate-700 w-full max-w-sm text-center mt-8">
                <div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[20px] flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-all"><i class="fa-solid fa-server"></i></div>
                <h2 class="text-2xl font-extrabold text-white mb-1 tracking-tight">RX c-Panel</h2>
                <p class="text-xs text-slate-400 mb-6 font-medium">Safe Mode Authentication</p>
                <div class="relative mb-6">
                    <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="password" name="pass" placeholder="Enter Password" required class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-600 focus:outline-none focus:border-indigo-500 bg-slate-900/50 text-white text-center tracking-widest text-sm font-bold transition-all placeholder-slate-500">
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25">Access Manager <i class="fa-solid fa-arrow-right-to-bracket ml-1"></i></button>
            </form>
        </body></html>
        <?php exit;
    }
}

if (isset($_GET['logout'])) { session_destroy(); header("Location: ?"); exit; }

// ================= Path Resolution =================
$defaultPath = isset($_SERVER['DOCUMENT_ROOT']) && !empty($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : dirname(__FILE__);
$path = isset($_GET['path']) ? $_GET['path'] : $defaultPath;
$path = realpath($path);
if (!$path || !is_dir($path)) $path = realpath(dirname(__FILE__));

$alertMsg = ''; $alertType = 'success';
function setAlert($msg, $type='success') { global $alertMsg, $alertType; $alertMsg = $msg; $alertType = $type; }

// ================= Basic Core Operations (InfinityFree Safe) =================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // 1. File Upload (Standard)
    if (!empty($_FILES['file']['name'])) {
        $uploadFile = $path . '/' . basename($_FILES['file']['name']);
        if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadFile)) { 
            setAlert("File uploaded successfully!"); 
        } else { 
            setAlert("Upload failed! Check server size limits.", "error"); 
        }
    }

    // 2. Action Handlers (Standard PHP File Ops)
    if (isset($_POST['action'])) {
        $act = $_POST['action'];
        
        if ($act === 'create_file') {
            $newFile = $path . '/' . basename(trim($_POST['item_name']));
            if (!file_exists($newFile)) {
                if (file_put_contents($newFile, '') !== false) setAlert("File created successfully!"); 
                else setAlert("Failed to create file!", "error");
            } else setAlert("File already exists!", "error");
        }
        
        if ($act === 'create_folder') {
            $newFolder = $path . '/' . basename(trim($_POST['item_name']));
            if (!file_exists($newFolder)) {
                if (mkdir($newFolder)) setAlert("Folder created successfully!"); 
                else setAlert("Failed to create folder!", "error");
            } else setAlert("Folder already exists!", "error");
        }
        
        if ($act === 'rename') {
            $old = $_POST['source']; 
            $new = dirname($old) . '/' . basename(trim($_POST['target']));
            if (!file_exists($new)) {
                if (rename($old, $new)) setAlert("Renamed successfully!"); 
                else setAlert("Rename failed!", "error");
            } else setAlert("Target name already exists!", "error");
        }
        
        if ($act === 'copy') {
            $src = $_POST['source']; 
            $tgt = dirname($src) . '/' . basename(trim($_POST['target']));
            if (!file_exists($tgt)) {
                if (copy($src, $tgt)) setAlert("Copied successfully!"); 
                else setAlert("Copy failed!", "error");
            } else setAlert("Copy target already exists!", "error");
        }
        
        if ($act === 'move') {
            $src = $_POST['source']; 
            $tgtDir = trim($_POST['target']);
            $realTgtDir = realpath($tgtDir);
            if ($realTgtDir && is_dir($realTgtDir)) {
                $newPath = $realTgtDir . '/' . basename($src);
                if (!file_exists($newPath)) {
                    if (rename($src, $newPath)) setAlert("Moved successfully!"); 
                    else setAlert("Move failed!", "error");
                } else setAlert("Target already exists in directory!", "error");
            } else setAlert("Invalid target directory!", "error");
        }
    }

    // 3. Save File Edit
    if (isset($_POST['save_file']) && isset($_POST['file_path']) && isset($_POST['file_content'])) {
        $file = $_POST['file_path']; 
        $content = $_POST['file_content'];
        if (is_file($file) && is_writable($file)) {
            if (file_put_contents($file, $content) !== false) setAlert("File saved successfully!"); 
            else setAlert("Save failed!", "error");
        } else {
            setAlert("File not writable or does not exist!", "error");
        }
    }

    // 4. Bulk Operations
    if (isset($_POST['bulk_action']) && !empty($_POST['selected_files'])) {
        $act = $_POST['bulk_action']; 
        $files = $_POST['selected_files'];
        
        if ($act === 'delete') {
            $del = 0; 
            foreach ($files as $f) { 
                if (is_file($f)) { if (unlink($f)) $del++; } 
                elseif (is_dir($f)) { if (rmdir($f)) $del++; } 
            }
            setAlert("Deleted $del items successfully!");
        } 
        elseif ($act === 'download') {
            $zipName = 'RX_Backup_' . date('Y-m-d_H-i-s') . '.zip';
            if (class_exists('ZipArchive')) {
                $zip = new ZipArchive(); 
                $tempZip = sys_get_temp_dir() . '/' . $zipName;
                if ($zip->open($tempZip, ZipArchive::CREATE) === TRUE) {
                    foreach ($files as $f) { 
                        if (is_file($f)) { $zip->addFile($f, basename($f)); } 
                    }
                    $zip->close();
                    if (file_exists($tempZip)) { 
                        header('Content-Type: application/zip'); 
                        header('Content-Disposition: attachment; filename="'.$zipName.'"'); 
                        header('Content-Length: ' . filesize($tempZip));
                        readfile($tempZip); 
                        unlink($tempZip); 
                        exit; 
                    }
                }
            }
        }
    }
}

// ================= GET Actions =================
if (isset($_GET['delete'])) {
    $f = $_GET['delete']; 
    if (is_file($f)) { unlink($f); setAlert("File deleted: " . basename($f)); }
    elseif (is_dir($f)) { rmdir($f); setAlert("Folder deleted: " . basename($f)); }
}

if (isset($_GET['download']) && is_file($_GET['download'])) {
    $file = $_GET['download']; 
    header('Content-Description: File Transfer'); 
    header('Content-Type: application/octet-stream'); 
    header('Content-Disposition: attachment; filename="'.basename($file).'"'); 
    header('Content-Length: ' . filesize($file));
    readfile($file); 
    exit;
}

if (isset($_GET['download_folder']) && is_dir($_GET['download_folder'])) {
    $folder = $_GET['download_folder']; 
    $zipName = basename($folder) . '_' . date('Y-m-d_H-i-s') . '.zip';
    if (class_exists('ZipArchive')) {
        $zip = new ZipArchive(); 
        $tempZip = sys_get_temp_dir() . '/' . $zipName;
        if ($zip->open($tempZip, ZipArchive::CREATE) === TRUE) {
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($folder, RecursiveDirectoryIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
            foreach ($iterator as $f) { 
                if ($f->isFile()) {
                    $filePath = $f->getRealPath();
                    $relativePath = substr($filePath, strlen($folder) + 1);
                    $zip->addFile($filePath, $relativePath); 
                } 
            }
            $zip->close(); 
            if (file_exists($tempZip)) {
                header('Content-Type: application/zip'); 
                header('Content-Disposition: attachment; filename="'.$zipName.'"'); 
                header('Content-Length: ' . filesize($tempZip));
                readfile($tempZip); 
                unlink($tempZip); 
                exit;
            }
        }
    }
    setAlert("Failed to create ZIP file.", "error");
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>RX c-Panel - Control Center</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;600&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f1f5f9; color: #0f172a; }
        .font-mono { font-family: 'Fira Code', monospace; }
        .custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        
        .slide-down { animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: top right; }
        @keyframes slideDown { from { opacity: 0; transform: scale(0.95) translateY(-5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        
        .modal-bg { transition: opacity 0.3s ease; }
        .modal-box { transition: transform 0.3s ease, opacity 0.3s ease; transform: scale(0.95) translateY(10px); opacity: 0; }
        .modal-active .modal-bg { opacity: 1; }
        .modal-active .modal-box { transform: scale(1) translateY(0); opacity: 1; }
    </style>
    <script>
        // 🟢 SCROLL RETENTION
        document.addEventListener("DOMContentLoaded", function() {
            let scrollpos = sessionStorage.getItem('rx_scroll');
            if (scrollpos) window.scrollTo(0, parseInt(scrollpos));
            
            let alertBox = document.getElementById('alert-msg');
            if(alertBox) setTimeout(() => alertBox.style.display = 'none', 3500);
        });
        window.addEventListener("beforeunload", function() { sessionStorage.setItem('rx_scroll', window.scrollY); });
    </script>
</head>
<body class="antialiased pb-20 pt-10">

<div class="fixed top-0 w-full bg-indigo-600 text-white text-[11px] sm:text-xs font-bold text-center py-2.5 uppercase tracking-widest shadow-md z-50">
    Developed by <a href="https://t.me/Roman_no_1" target="_blank" class="text-indigo-200 hover:text-white transition-colors ml-1"><i class="fa-brands fa-telegram text-sm"></i> @Roman_no_1</a>
</div>

<?php 
// ================= FILE VIEW / EDIT MODES =================
if (isset($_GET['open']) && is_file($_GET['open'])): 
    $file = $_GET['open']; 
    $fileExt = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $fileSize = filesize($file);
?>
    <div class="max-w-6xl mx-auto p-4 md:p-6 mt-2">
        <div class="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden">
            <div class="border-b border-slate-100 p-4 md:p-5 flex items-center justify-between bg-slate-50">
                <h2 class="font-bold text-slate-700 truncate text-sm md:text-base"><i class="fa-regular fa-eye text-indigo-500 mr-2 text-lg"></i><?php echo htmlspecialchars(basename($file)); ?></h2>
                <div class="flex gap-2">
                    <a href="?path=<?php echo urlencode(dirname($file)); ?>" class="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:bg-slate-50">Back</a>
                    <a href="?edit=<?php echo urlencode($file); ?>" class="bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all px-4 py-2 rounded-lg text-xs md:text-sm font-bold">Edit Code</a>
                </div>
            </div>
            <div class="p-4 md:p-6 overflow-auto custom-scroll flex justify-center bg-[#0f172a] min-h-[50vh]">
                <?php 
                if ($fileSize > 5242880) { // Limit to 5MB for view
                    echo "<div class='text-red-400 font-mono text-center py-10'><i class='fa-solid fa-triangle-exclamation text-4xl mb-4'></i><br>File too large to view (>5MB)</div>";
                } else {
                    if (in_array($fileExt, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                        echo "<img src='data:image/{$fileExt};base64," . base64_encode(file_get_contents($file)) . "' class='max-w-full rounded-xl shadow-lg'>";
                    } elseif (in_array($fileExt, ['mp4', 'webm', 'ogg'])) {
                        echo "<video controls class='w-full max-w-4xl rounded-xl bg-black shadow-lg'><source src='data:video/{$fileExt};base64," . base64_encode(file_get_contents($file)) . "'></video>";
                    } else {
                        $content = file_get_contents($file);
                        if (mb_check_encoding($content, 'UTF-8') || mb_check_encoding($content, 'ASCII')) {
                            echo "<pre class='w-full text-emerald-400 font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed'>" . htmlspecialchars($content) . "</pre>";
                        } else {
                            echo "<div class='text-orange-400 font-mono text-center py-10'>Binary file - cannot display content.</div>";
                        }
                    }
                }
                ?>
            </div>
        </div>
    </div>
<?php elseif (isset($_GET['edit']) && is_file($_GET['edit'])): 
    $file = $_GET['edit']; 
    $fileSize = filesize($file);
?>
    <div class="max-w-6xl mx-auto p-4 md:p-6 mt-2">
        <div class="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[85vh]">
            <div class="border-b border-slate-100 p-4 md:p-5 flex justify-between bg-slate-50 items-center">
                <h2 class="font-bold text-slate-700 flex items-center gap-2 text-sm md:text-base"><i class="fa-solid fa-code text-indigo-500 text-lg"></i> Editing: <?php echo htmlspecialchars(basename($file)); ?></h2>
            </div>
            <?php if ($fileSize > 1048576): // 1MB limit for edit ?>
                <div class="flex-1 flex items-center justify-center bg-slate-50 text-red-500 font-bold">
                    File is too large to edit (>1MB). Download it instead.
                </div>
            <?php else: ?>
            <form method="post" class="flex flex-col flex-1 relative">
                <input type="hidden" name="file_path" value="<?php echo htmlspecialchars($file); ?>">
                <textarea name="file_content" spellcheck="false" class="flex-1 w-full p-4 md:p-6 bg-[#0f172a] text-[#38bdf8] font-mono text-xs md:text-sm focus:outline-none resize-none custom-scroll leading-relaxed"><?php echo htmlspecialchars(file_get_contents($file)); ?></textarea>
                <div class="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] relative z-10">
                    <a href="?path=<?php echo urlencode(dirname($file)); ?>" class="bg-slate-100 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</a>
                    <button type="submit" name="save_file" class="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md"><i class="fa-solid fa-save mr-2"></i>Save Code</button>
                </div>
            </form>
            <?php endif; ?>
        </div>
    </div>
<?php else: ?>

<nav class="bg-white sticky top-[38px] z-40 shadow-sm border-b border-slate-200">
    <div class="max-w-[1400px] mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg shadow-md"><i class="fa-solid fa-server"></i></div>
            <div>
                <h1 class="text-lg font-bold text-slate-800 leading-tight">RX c-Panel</h1>
                <p class="text-[9px] font-bold text-indigo-500 uppercase tracking-widest hidden sm:block">InfinityFree Compatible</p>
            </div>
        </div>
        
        <div class="flex items-center gap-3">
            <div class="hidden md:flex bg-slate-50 rounded-lg p-2 items-center overflow-x-auto border border-slate-200 max-w-sm custom-scroll font-mono text-[11px] font-semibold text-slate-600">
                <a href="?path=/" class="text-indigo-500 hover:text-indigo-700 mx-2"><i class="fa-solid fa-hard-drive"></i></a>
                <?php
                $parts = explode('/', trim(str_replace('\\', '/', $path), '/')); $buildPath = '';
                foreach ($parts as $part) {
                    if (empty($part)) continue;
                    $buildPath .= '/' . $part;
                    echo '<span class="text-slate-300 mx-1">/</span><a href="?path=' . urlencode($buildPath) . '" class="hover:text-indigo-600 transition-colors">' . htmlspecialchars($part) . '</a>';
                }
                ?>
            </div>

            <button onclick="toggleMenu(event)" class="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors focus:outline-none">
                <i class="fa-solid fa-bars-staggered"></i>
            </button>
        </div>
    </div>
</nav>

<div id="advancedMenu" class="hidden absolute top-[100px] right-4 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden slide-down">
    <div class="p-2 bg-slate-50 pt-3">
        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Basic Tools</div>
        <button onclick="openModal('uploadModal'); toggleMenu(event);" class="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white rounded-xl flex items-center gap-3 transition-colors"><div class="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center"><i class="fa-solid fa-upload"></i></div> File Upload</button>
        
        <div class="border-t border-slate-200 my-1 mx-2"></div>
        <button onclick="openActionModal('create_file', '', ''); toggleMenu(event);" class="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white rounded-xl flex items-center gap-3 transition-colors"><div class="w-7 text-center text-slate-400"><i class="fa-solid fa-file-circle-plus"></i></div> New File</button>
        <button onclick="openActionModal('create_folder', '', ''); toggleMenu(event);" class="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white rounded-xl flex items-center gap-3 transition-colors"><div class="w-7 text-center text-slate-400"><i class="fa-solid fa-folder-plus"></i></div> New Folder</button>
        <a href="?path=/" class="block px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white rounded-xl flex items-center gap-3 transition-colors"><div class="w-7 text-center text-indigo-500"><i class="fa-solid fa-hard-drive"></i></div> Server Root</a>
        
        <div class="border-t border-slate-200 my-1 mx-2"></div>
        <a href="?logout=1" class="block px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"><div class="w-7 text-center text-red-500"><i class="fa-solid fa-power-off"></i></div> Logout</a>
    </div>
</div>

<div class="max-w-[1400px] mx-auto px-4 py-6">

    <?php if($alertMsg): ?>
        <div id="alert-msg" class="flex items-center gap-3 p-3 mb-4 text-sm font-bold border rounded-xl shadow-sm <?php echo $alertType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'; ?>">
            <i class="fa-solid <?php echo $alertType === 'success' ? 'fa-circle-check text-emerald-500' : 'fa-triangle-exclamation text-red-500'; ?>"></i> <?php echo $alertMsg; ?>
        </div>
    <?php endif; ?>

    <div class="md:hidden bg-white rounded-xl p-3 mb-4 flex items-center overflow-x-auto border border-slate-200 custom-scroll font-mono text-[10px] font-semibold text-slate-600 shadow-sm">
        <a href="?path=/" class="text-indigo-500 hover:text-indigo-700 mr-2"><i class="fa-solid fa-house"></i></a>
        <?php
        $buildPath = '';
        foreach ($parts as $part) {
            if (empty($part)) continue;
            $buildPath .= '/' . $part;
            echo '<span class="text-slate-300 mx-1">/</span><a href="?path=' . urlencode($buildPath) . '" class="hover:text-indigo-600 truncate max-w-[80px]">' . htmlspecialchars($part) . '</a>';
        }
        ?>
    </div>

    <form method="post" id="bulkForm" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden pb-10">
        <div class="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap justify-between items-center gap-3">
            <div class="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button type="button" onclick="document.querySelectorAll('.file-checkbox').forEach(cb => cb.checked = true);" class="text-slate-600 hover:bg-indigo-50 px-3 py-1.5 rounded text-[11px] font-bold transition-all">All</button>
                <button type="button" onclick="document.querySelectorAll('.file-checkbox').forEach(cb => cb.checked = false);" class="text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded text-[11px] font-bold transition-all">None</button>
            </div>
            
            <div class="relative flex-1 max-w-[200px] sm:max-w-xs">
                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="text" id="searchBox" placeholder="Search..." class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-xs shadow-sm transition-all" onkeyup="searchFiles()">
            </div>
            
            <div class="flex items-center gap-2">
                <button type="button" onclick="submitBulk('download')" class="bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"><i class="fa-solid fa-download"></i> ZIP</button>
                <button type="button" onclick="if(confirm('Delete selected items?')) submitBulk('delete')" class="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"><i class="fa-solid fa-trash"></i> Del</button>
            </div>
        </div>

        <div class="overflow-x-auto custom-scroll min-h-[300px]">
            <table class="w-full text-left whitespace-nowrap text-sm">
                <thead>
                    <tr class="bg-white border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                        <th class="p-3 w-10 text-center"><i class="fa-regular fa-square-check"></i></th>
                        <th class="p-3">File Name</th>
                        <th class="p-3 hidden sm:table-cell w-20">Size</th>
                        <th class="p-3 text-center w-16">Act</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">

                <?php if ($path != dirname($path) && $path != '/'): ?>
                    <tr class="hover:bg-indigo-50/50 transition-colors cursor-pointer" onclick="window.location='?path=<?php echo urlencode(dirname($path)); ?>'">
                        <td colspan="4" class="p-3">
                            <div class="flex items-center gap-3 text-indigo-600 font-bold text-xs"><i class="fa-solid fa-arrow-turn-up text-sm bg-indigo-100 w-6 h-6 rounded flex items-center justify-center"></i> Go Back (..)</div>
                        </td>
                    </tr>
                <?php endif; ?>

                <?php
                $items = @scandir($path);
                if ($items) {
                    $folders = []; $files = [];
                    foreach ($items as $item) {
                        if ($item == '.' || $item == '..') continue;
                        if (is_dir($path . '/' . $item)) $folders[] = $item; else $files[] = $item;
                    }
                    $allItems = array_merge($folders, $files);

                    foreach ($allItems as $index => $item):
                        $fullPath = $path . '/' . $item; $encoded = urlencode($fullPath); $isDir = is_dir($fullPath);
                        $liveUrl = getLiveUrl($fullPath);
                        
                        $ext = strtolower(pathinfo($item, PATHINFO_EXTENSION));
                        $icon = $isDir ? 'fa-folder text-indigo-500' : 'fa-file-lines text-slate-400';
                        if(!$isDir){
                            if(in_array($ext, ['jpg','png','webp'])) $icon = 'fa-image text-emerald-500';
                            elseif(in_array($ext, ['mp4','mp3'])) $icon = 'fa-circle-play text-purple-500';
                            elseif(in_array($ext, ['php','js','css','html'])) $icon = 'fa-code text-amber-500';
                            elseif($ext == 'zip') $icon = 'fa-file-zipper text-red-500';
                        }
                ?>
                    <tr class="file-row hover:bg-slate-50 transition-colors group relative">
                        <td class="p-3 text-center">
                            <input type="checkbox" name="selected_files[]" value="<?php echo htmlspecialchars($fullPath); ?>" class="file-checkbox w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600">
                        </td>
                        <td class="p-3">
                            <div class="flex items-center gap-2 max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg">
                                <i class="fa-solid <?php echo $icon; ?> text-lg w-6 text-center"></i>
                                <?php if($isDir): ?>
                                    <a href="?path=<?php echo $encoded; ?>" class="font-bold text-slate-700 hover:text-indigo-600 truncate block file-name text-[13px]"><?php echo htmlspecialchars($item); ?></a>
                                <?php else: ?>
                                    <?php if($liveUrl): ?>
                                        <a href="<?php echo $liveUrl; ?>" target="_blank" class="font-bold text-slate-700 hover:text-indigo-600 truncate block file-name text-[13px]" title="Open Live Link"><?php echo htmlspecialchars($item); ?> <i class="fa-solid fa-link text-[9px] text-indigo-400 ml-1"></i></a>
                                    <?php else: ?>
                                        <a href="?open=<?php echo $encoded; ?>" class="font-bold text-slate-700 hover:text-indigo-600 truncate block file-name text-[13px]"><?php echo htmlspecialchars($item); ?></a>
                                    <?php endif; ?>
                                <?php endif; ?>
                            </div>
                        </td>
                        <td class="p-3 text-[11px] text-slate-400 font-mono font-semibold hidden sm:table-cell">
                            <?php echo $isDir ? '--' : formatBytes(filesize($fullPath)); ?>
                        </td>
                        <td class="p-3 text-center relative">
                            <button type="button" onclick="toggleFileMenu('menu-<?php echo $index; ?>', event)" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors focus:outline-none shadow-sm relative z-20">
                                <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                            </button>

                            <div id="menu-<?php echo $index; ?>" class="file-dropdown hidden absolute right-10 top-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1.5 text-left slide-down">
                                <?php if($isDir): ?>
                                    <a href="?path=<?php echo $encoded; ?>" class="block px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-regular fa-folder-open w-4 text-indigo-400"></i> Open Folder</a>
                                    <a href="?download_folder=<?php echo $encoded; ?>" class="block px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-solid fa-download w-4 text-slate-400"></i> Download ZIP</a>
                                <?php else: ?>
                                    <?php if($liveUrl): ?>
                                        <a href="<?php echo $liveUrl; ?>" target="_blank" class="block px-4 py-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50"><i class="fa-solid fa-globe w-4"></i> Live URL</a>
                                    <?php endif; ?>
                                    <a href="?open=<?php echo $encoded; ?>" class="block px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-regular fa-eye w-4 text-slate-400"></i> View Content</a>
                                    <a href="?edit=<?php echo $encoded; ?>" class="block px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-solid fa-code w-4 text-slate-400"></i> Edit Code</a>
                                    <a href="?download=<?php echo $encoded; ?>" class="block px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-solid fa-download w-4 text-slate-400"></i> Download File</a>
                                <?php endif; ?>
                                
                                <div class="border-t border-slate-100 my-1 mx-2"></div>
                                <button type="button" onclick="openActionModal('rename', '<?php echo addslashes($fullPath); ?>', '<?php echo addslashes($item); ?>')" class="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-solid fa-i-cursor w-4 text-slate-400"></i> Rename</button>
                                <?php if(!$isDir): ?>
                                <button type="button" onclick="openActionModal('copy', '<?php echo addslashes($fullPath); ?>', 'copy_<?php echo addslashes($item); ?>')" class="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-regular fa-copy w-4 text-slate-400"></i> Copy</button>
                                <?php endif; ?>
                                <button type="button" onclick="openActionModal('move', '<?php echo addslashes($fullPath); ?>', '<?php echo addslashes(dirname($fullPath)); ?>')" class="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><i class="fa-solid fa-scissors w-4 text-slate-400"></i> Move</button>
                                <div class="border-t border-slate-100 my-1 mx-2"></div>
                                <a href="?delete=<?php echo $encoded; ?>" onclick="return confirm('Delete this item permanently?')" class="block px-4 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50"><i class="fa-solid fa-trash w-4"></i> Delete</a>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; } else { echo "<tr><td colspan='4' class='p-8 text-center text-slate-400 text-xs font-bold'>Directory empty.</td></tr>"; } ?>
                </tbody>
            </table>
        </div>
    </form>
<?php endif; ?>
</div>

<div id="actionModal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-active px-4">
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm modal-bg" onclick="closeModal('actionModal')"></div>
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 modal-box border border-slate-100">
        <h3 id="modalTitle" class="text-lg font-bold text-slate-800 mb-4 tracking-tight">Action</h3>
        <form method="post" id="dynamicForm">
            <input type="hidden" name="action" id="modalActionName">
            <input type="hidden" name="source" id="modalSourcePath">
            <input type="text" name="target" id="modalTargetInput" required class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 mb-5 text-sm font-mono font-bold shadow-inner">
            <input type="text" name="item_name" id="modalItemInput" class="hidden w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 mb-5 text-sm font-mono font-bold shadow-inner" disabled>
            
            <div class="flex gap-2">
                <button type="button" onclick="closeModal('actionModal')" class="flex-1 py-2.5 rounded-xl text-slate-600 text-sm font-bold bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-white text-sm font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all">Submit</button>
            </div>
        </form>
    </div>
</div>

<div id="uploadModal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-active px-4">
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm modal-bg" onclick="closeModal('uploadModal')"></div>
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 modal-box text-center border border-slate-100">
        <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"><i class="fa-solid fa-cloud-arrow-up"></i></div>
        <h3 class="text-lg font-bold text-slate-800 mb-1 tracking-tight">File Upload</h3>
        <p class="text-[10px] text-slate-400 mb-5 font-semibold">Standard upload method (InfinityFree Safe)</p>
        <form method="post" enctype="multipart/form-data">
            <input type="file" name="file" required class="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer mb-5 border border-slate-200 rounded-xl bg-slate-50">
            <div class="flex gap-2">
                <button type="button" onclick="closeModal('uploadModal')" class="flex-1 py-2.5 rounded-xl text-slate-600 text-sm font-bold bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-white text-sm font-bold bg-indigo-600 shadow-md transition-all">Upload</button>
            </div>
        </form>
    </div>
</div>

<script>
function toggleMenu(event) { 
    event.stopPropagation();
    document.getElementById("advancedMenu").classList.toggle("hidden"); 
}

function toggleFileMenu(id, event) {
    event.stopPropagation();
    const el = document.getElementById(id);
    const isHidden = el.classList.contains('hidden');
    document.querySelectorAll('.file-dropdown').forEach(d => d.classList.add('hidden'));
    if (isHidden) el.classList.remove('hidden');
}

document.addEventListener('click', function(event) {
    const menu = document.getElementById("advancedMenu");
    if (menu && !menu.classList.contains('hidden') && !event.target.closest('#advancedMenu') && !event.target.closest('button[onclick="toggleMenu(event)"]')) {
        menu.classList.add('hidden');
    }
    if (!event.target.closest('.file-dropdown') && !event.target.closest('button[onclick^="toggleFileMenu"]')) {
        document.querySelectorAll('.file-dropdown').forEach(d => d.classList.add('hidden'));
    }
});

function searchFiles() {
    const filter = document.getElementById("searchBox").value.toLowerCase();
    document.querySelectorAll(".file-row").forEach(row => {
        const name = row.querySelector(".file-name");
        if (name && name.textContent.toLowerCase().includes(filter)) row.style.display = "";
        else row.style.display = "none";
    });
}

function submitBulk(action) {
    const form = document.getElementById("bulkForm");
    const input = document.createElement("input");
    input.type = "hidden"; input.name = "bulk_action"; input.value = action;
    form.appendChild(input); form.submit();
}

function openModal(id) {
    const el = document.getElementById(id); el.classList.remove('hidden');
    setTimeout(() => el.classList.add('modal-active'), 10);
}

function closeModal(id) {
    const el = document.getElementById(id); el.classList.remove('modal-active');
    setTimeout(() => el.classList.add('hidden'), 300);
}

function openActionModal(action, sourcePath, defaultVal) {
    document.querySelectorAll('.file-dropdown').forEach(d => d.classList.add('hidden'));
    const titleEl = document.getElementById('modalTitle');
    const inputTgt = document.getElementById('modalTargetInput');
    const inputItem = document.getElementById('modalItemInput');
    
    document.getElementById('modalActionName').value = action;
    document.getElementById('modalSourcePath').value = sourcePath;
    
    inputTgt.classList.add('hidden'); inputTgt.disabled = true;
    inputItem.classList.add('hidden'); inputItem.disabled = true;

    if (action === 'rename') { titleEl.innerText = "Rename Object"; inputTgt.classList.remove('hidden'); inputTgt.disabled = false; inputTgt.value = defaultVal; }
    else if (action === 'copy') { titleEl.innerText = "Copy File"; inputTgt.classList.remove('hidden'); inputTgt.disabled = false; inputTgt.value = defaultVal; }
    else if (action === 'move') { titleEl.innerText = "Move File"; inputTgt.classList.remove('hidden'); inputTgt.disabled = false; inputTgt.value = defaultVal; }
    else if (action === 'create_file') { titleEl.innerText = "Create New File"; inputItem.classList.remove('hidden'); inputItem.disabled = false; inputItem.value = "script.php"; }
    else if (action === 'create_folder') { titleEl.innerText = "Create Folder"; inputItem.classList.remove('hidden'); inputItem.disabled = false; inputItem.value = "new_folder"; }
    
    openModal('actionModal');
    setTimeout(() => { if(!inputTgt.disabled) { inputTgt.focus(); inputTgt.select(); } else { inputItem.focus(); inputItem.select(); } }, 100);
}
</script>
</body>
</html>
