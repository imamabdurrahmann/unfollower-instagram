"use client";

import { useState, useMemo, useEffect, useDeferredValue, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, ArrowRight, UserMinus, Users, UserCheck, RefreshCw, Search, ExternalLink, Copy, Download, Loader2 } from "lucide-react";
import { parseInstagramData, type IgUser } from "@/lib/parser";

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [followers, setFollowers] = useState<IgUser[]>([]);
  const [following, setFollowing] = useState<IgUser[]>([]);
  const [followerFiles, setFollowerFiles] = useState<string[]>([]);
  const [followingFiles, setFollowingFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Results
  const [notFollowingBack, setNotFollowingBack] = useState<IgUser[]>([]);
  const [fans, setFans] = useState<IgUser[]>([]);
  const [mutuals, setMutuals] = useState<IgUser[]>([]);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState<"notFollowingBack" | "fans" | "mutuals">("notFollowingBack");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: "followers" | "following") => {
    setError(null);
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Cegah upload file yang sama berkali-kali
      if (type === "followers" && followerFiles.includes(file.name)) return;
      if (type === "following" && followingFiles.includes(file.name)) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const json = JSON.parse(content);
          const users = parseInstagramData(json);

          if (users.length === 0) {
            setError(`File ${file.name} sepertinya bukan data dari Instagram yang valid.`);
            return;
          }

          if (type === "followers") {
            setFollowers((prev) => prev.concat(users));
            setFollowerFiles((prev) => prev.concat(file.name));
          } else {
            setFollowing((prev) => prev.concat(users));
            setFollowingFiles((prev) => prev.concat(file.name));
          }
        } catch (err) {
          setError("Gagal membaca file JSON: " + file.name);
        }
      };
      reader.readAsText(file);
    });
    
    // Reset nilai input agar file yang sama bisa di-upload ulang jika sudah di-reset
    event.target.value = '';
  };

  const processData = () => {
    if (followers.length === 0 || following.length === 0) {
      setError("Tolong unggah minimal 1 file Followers dan 1 file Following.");
      return;
    }

    setIsAnalyzing(true);
    
    // Memberikan waktu browser untuk render state loading sebelum parsing berat
    setTimeout(() => {
      // 1. Deduplikasi data: Jaga-jaga kalau user upload file yang sama dengan nama beda, 
      // atau ada username yang tumpang tindih di beberapa file.
      const uniqueFollowersMap = new Map(followers.map(u => [u.username, u]));
      const uniqueFollowingMap = new Map(following.map(u => [u.username, u]));

      const uniqueFollowers = Array.from(uniqueFollowersMap.values());
      const uniqueFollowing = Array.from(uniqueFollowingMap.values());

      const followersSet = new Set(uniqueFollowersMap.keys());
      const followingSet = new Set(uniqueFollowingMap.keys());

      // 2. Kalkulasi logika
      const notFollowingBackList = uniqueFollowing.filter((u) => !followersSet.has(u.username));
      const fansList = uniqueFollowers.filter((u) => !followingSet.has(u.username));
      const mutualsList = uniqueFollowing.filter((u) => followersSet.has(u.username));

      setNotFollowingBack(notFollowingBackList);
      setFans(fansList);
      setMutuals(mutualsList);
      
      setIsAnalyzing(false);
      setStep(3);
    }, 150);
  };

  const reset = () => {
    setFollowers([]);
    setFollowing([]);
    setFollowerFiles([]);
    setFollowingFiles([]);
    setNotFollowingBack([]);
    setFans([]);
    setMutuals([]);
    setSearchQuery("");
    setError(null);
    setStep(1);
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const getActiveList = useCallback(() => {
    switch (activeTab) {
      case "notFollowingBack": return notFollowingBack;
      case "fans": return fans;
      case "mutuals": return mutuals;
      default: return [];
    }
  }, [activeTab, notFollowingBack, fans, mutuals]);

  const filteredList = useMemo(() => {
    const list = getActiveList();
    const query = deferredSearchQuery.toLowerCase();
    if (!query) return list;
    
    return list.filter(user => 
      user.username.toLowerCase().includes(query)
    );
  }, [getActiveList, deferredSearchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 60; // Nampilin 60 data per halaman (pas buat grid)

  // Reset halaman ke 1 kalau user ganti tab atau nyari sesuatu
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const copyToClipboard = () => {
    const listText = filteredList.map(u => `@${u.username}`).join('\n');
    navigator.clipboard.writeText(listText);
    alert(`Berhasil menyalin ${filteredList.length} username ke clipboard!`);
  };

  const downloadCSV = () => {
    const csvContent = "Username,Link Instagram\n" + filteredList.map(u => `${u.username},https://instagram.com/${u.username}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `unfollower_${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 overflow-x-hidden relative bg-black">

      <div className="z-10 w-full max-w-6xl flex flex-col gap-8 items-center mt-2 md:mt-8">
        
        {step !== 3 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-lg">
              Unfollower
            </h1>
            <p className="text-lg md:text-2xl font-medium text-neutral-400 max-w-2xl mx-auto drop-shadow-md">
              Cari tahu siapa yang nggak follback kamu. <br/>
              <span className="font-bold text-neutral-200">100% aman.</span> Diproses langsung di browser kamu.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full max-w-4xl glass-panel p-8 md:p-12 mt-4 text-center relative"
            >
              <h2 className="text-3xl font-bold mb-10 text-white">Cara Kerja</h2>
              
              <div className="grid md:grid-cols-3 gap-10 mb-12 relative z-10">
                {/* 1 */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
                    <span className="text-2xl font-bold text-neutral-200">1</span>
                  </div>
                  <h3 className="font-semibold text-xl text-neutral-200">Minta Data</h3>
                  <p className="text-sm text-neutral-400">Buka Pengaturan Instagram &gt; Pusat Akun &gt; Informasi dan izin Anda &gt; Unduh informasi Anda.</p>
                </div>
                {/* 2 */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
                    <span className="text-2xl font-bold text-neutral-200">2</span>
                  </div>
                  <h3 className="font-semibold text-xl text-neutral-200">Unduh JSON</h3>
                  <p className="text-sm text-neutral-400">Pilih "Pengikut dan yang diikuti" lalu pastikan formatnya <strong>JSON</strong>. Unduh file ZIP dari email kamu.</p>
                </div>
                {/* 3 */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-black">3</span>
                  </div>
                  <h3 className="font-semibold text-xl text-neutral-200">Unggah Di Sini</h3>
                  <p className="text-sm text-neutral-400">Ekstrak ZIP tersebut lalu masukkan file JSON yang didapat ke tempat unggah di halaman selanjutnya.</p>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="bg-white text-black hover:bg-neutral-300 transition-all font-bold text-xl py-4 px-10 rounded-full flex items-center gap-3 mx-auto"
              >
                Mulai Sekarang
                <ArrowRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full max-w-4xl glass-panel p-8 md:p-14 mt-4 text-center"
            >
              <h2 className="text-3xl font-bold mb-8 text-white">Unggah File Kamu</h2>
              
              <div className="grid md:grid-cols-2 gap-6 w-full">
                {/* Followers Dropzone */}
                <label className="border-2 border-dashed border-neutral-800 rounded-3xl p-8 bg-neutral-900/30 hover:bg-neutral-900/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group hover:border-neutral-600 relative">
                  <input 
                    type="file" 
                    multiple 
                    accept=".json" 
                    onChange={(e) => handleFileUpload(e, 'followers')} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Users size={48} className="text-neutral-500 group-hover:text-neutral-300 transition-colors group-hover:scale-110 duration-300" />
                  <div className="text-center">
                    <p className="font-semibold text-lg text-neutral-200">File Pengikut (Followers)</p>
                    <p className="text-neutral-500 text-sm mt-1">Pilih satu atau banyak file JSON</p>
                  </div>
                  {followerFiles.length > 0 && (
                    <div className="mt-2 text-xs text-neutral-400 bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700">
                      {followerFiles.length} file diunggah ({followers.length} akun)
                    </div>
                  )}
                </label>

                {/* Following Dropzone */}
                <label className="border-2 border-dashed border-neutral-800 rounded-3xl p-8 bg-neutral-900/30 hover:bg-neutral-900/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group hover:border-neutral-600 relative">
                  <input 
                    type="file" 
                    multiple 
                    accept=".json" 
                    onChange={(e) => handleFileUpload(e, 'following')} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UserCheck size={48} className="text-neutral-500 group-hover:text-neutral-300 transition-colors group-hover:scale-110 duration-300" />
                  <div className="text-center">
                    <p className="font-semibold text-lg text-neutral-200">File Mengikuti (Following)</p>
                    <p className="text-neutral-500 text-sm mt-1">Pilih satu atau banyak file JSON</p>
                  </div>
                  {followingFiles.length > 0 && (
                    <div className="mt-2 text-xs text-neutral-400 bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700">
                      {followingFiles.length} file diunggah ({following.length} akun)
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                {error && (
                  <div className="text-neutral-400 bg-neutral-900 p-3 rounded-lg border border-neutral-800 mt-2">
                    {error}
                  </div>
                )}

                <button 
                  onClick={processData}
                  disabled={followers.length === 0 || following.length === 0 || isAnalyzing}
                  className="mt-6 bg-white text-black disabled:opacity-50 disabled:hover:bg-white hover:bg-neutral-300 transition-all font-bold text-xl py-4 px-10 rounded-full flex items-center justify-center gap-3 mx-auto w-full max-w-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Menganalisis...
                    </>
                  ) : (
                    "Analisis Data"
                  )}
                </button>
              </div>
              
              <button 
                onClick={() => setStep(1)}
                className="mt-8 text-sm text-neutral-500 hover:text-neutral-300 underline font-medium z-20 relative"
              >
                Tunggu, aku butuh bantuan cari filenya
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full glass-panel flex flex-col border border-neutral-800 mb-12 shadow-2xl"
              style={{ minHeight: "80vh" }}
            >
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-neutral-800 bg-neutral-950/50 gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-white">
                    Dashboard Unfollower
                  </h2>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors text-neutral-300 text-sm font-medium"
                    title="Salin semua username"
                  >
                    <Copy size={16} /> <span className="hidden sm:inline">Salin</span>
                  </button>
                  <button 
                    onClick={downloadCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors text-neutral-300 text-sm font-medium"
                    title="Download format CSV"
                  >
                    <Download size={16} /> <span className="hidden sm:inline">CSV</span>
                  </button>
                  <div className="w-px h-6 bg-neutral-800 mx-1 hidden sm:block"></div>
                  <div className="relative flex-1 md:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="text"
                      placeholder="Cari username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors placeholder:text-neutral-600 text-sm"
                    />
                  </div>
                  <button onClick={reset} className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors text-neutral-400 shrink-0" title="Mulai Ulang">
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-neutral-950 border-b border-neutral-800 overflow-x-auto scrollbar-hide">
                <button 
                  onClick={() => setActiveTab("notFollowingBack")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 min-w-[200px] font-semibold transition-colors border-b-2 ${activeTab === 'notFollowingBack' ? 'border-white text-white bg-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'}`}
                >
                  <UserMinus size={18} />
                  Nggak Follback
                  <span className="bg-neutral-800 px-2 py-0.5 rounded-full text-xs">{notFollowingBack.length}</span>
                </button>
                <button 
                  onClick={() => setActiveTab("fans")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 min-w-[200px] font-semibold transition-colors border-b-2 ${activeTab === 'fans' ? 'border-white text-white bg-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'}`}
                >
                  <Users size={18} />
                  Fans (Nggak Difollback)
                  <span className="bg-neutral-800 px-2 py-0.5 rounded-full text-xs">{fans.length}</span>
                </button>
                <button 
                  onClick={() => setActiveTab("mutuals")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 min-w-[200px] font-semibold transition-colors border-b-2 ${activeTab === 'mutuals' ? 'border-white text-white bg-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'}`}
                >
                  <UserCheck size={18} />
                  Mutual (Saling Follow)
                  <span className="bg-neutral-800 px-2 py-0.5 rounded-full text-xs">{mutuals.length}</span>
                </button>
              </div>

              {/* List Area */}
              <div className="flex-1 p-6 bg-black/20">
                {filteredList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                    <Users size={48} className="mb-4 opacity-50" />
                    <p className="text-xl font-semibold">Tidak ada pengguna ditemukan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentData.map((user) => (
                      <a 
                        key={user.username}
                        href={`https://instagram.com/${user.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 rounded-xl p-4 flex items-center justify-between transition-all group hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-950 flex items-center justify-center shrink-0">
                             <span className="text-neutral-400 text-xs font-bold">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-medium truncate max-w-[80%] text-neutral-300 group-hover:text-white transition-colors">@{user.username}</span>
                        </div>
                        <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-neutral-800 bg-neutral-950/80 shrink-0">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2.5 bg-neutral-900 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-neutral-800 transition-colors border border-neutral-800 text-white disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <div className="text-sm font-medium text-neutral-400 bg-neutral-900/50 px-4 py-2 rounded-lg border border-neutral-800/50">
                    Halaman <span className="text-white">{currentPage}</span> dari <span className="text-white">{totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2.5 bg-neutral-900 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-neutral-800 transition-colors border border-neutral-800 text-white disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {step !== 3 && (
        <div className="absolute bottom-6 text-center text-neutral-600 text-sm flex flex-col items-center gap-1 z-10">
          <p>100% Pemrosesan di Peramban. Tidak ada data yang dikirim keluar.</p>
          <p>
            Dibuat oleh{" "}
            <a 
              href="https://www.instagram.com/codingwithimam/" 
              target="_blank" 
              rel="noreferrer"
              className="text-neutral-400 hover:text-white font-medium underline decoration-neutral-600 underline-offset-4 transition-colors"
            >
              Imam Abdurrahman
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
