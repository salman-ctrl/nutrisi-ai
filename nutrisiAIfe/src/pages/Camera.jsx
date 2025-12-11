import { useState, useRef, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Camera as CameraIcon, Upload, X, CheckCircle, Warning, FirstAid, Aperture, Lightning, ListBullets } from '@phosphor-icons/react';
import Swal from 'sweetalert2';

export default function Camera() {
    const { user } = useContext(AuthContext);
    
    // State
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false); // ✅ Kembalikan state kamera
    
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- 1. LOGIKA KAMERA (DIKEMBALIKAN) ---
    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            Swal.fire('Error', 'Gagal membuka kamera. Pastikan izin diberikan.', 'error');
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Set ukuran canvas sesuai video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert ke Blob (File)
            canvas.toBlob(blob => {
                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                processImage(file); // Kirim ke backend
            }, 'image/jpeg');
            
            stopCamera();
        }
    };

    // --- 2. LOGIKA UPLOAD & PROSES ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processImage(file);
    };

    const processImage = async (file) => {
        setImageSrc(URL.createObjectURL(file));
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Panggil Endpoint Backend Baru
            const res = await api.post('/scan', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setResult(res.data.data);
            } else {
                Swal.fire('Gagal', res.data.message || 'Tidak ada makanan terdeteksi.', 'warning');
                setImageSrc(null);
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
            setImageSrc(null);
        } finally {
            setLoading(false);
        }
    };

    // --- 3. LOGIKA SIMPAN ---
    const handleSave = async () => {
        if (!result) return;
        try {
            await api.post('/food', {
                food_name: result.food_name,
                calories: result.calories,
                protein_g: result.protein_g,
                carbs_g: result.carbs_g,
                fat_g: result.fat_g,
                sugar_g: result.sugar_g,
                salt_mg: result.salt_mg,
                fiber_g: result.fiber_g,
                grade: result.grade,
                image_url: result.image_url
            });
            Swal.fire('Tersimpan', 'Data berhasil masuk jurnal.', 'success');
            setResult(null);
            setImageSrc(null);
        } catch (e) {
            Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan.', 'error');
        }
    };

    // Cleanup kamera saat unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    // --- UI RENDER ---
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 pb-24 min-h-screen">
            
            {/* A. TAMPILAN AWAL (MENU PILIHAN) */}
            {!imageSrc && !isCameraOpen && (
                <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-2xl text-center space-y-8">
                    <div className="space-y-2">
                        <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center text-blue-600 animate-pulse">
                            <FirstAid size={48} weight="fill"/>
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-800">Scan Nutrisi & Medis</h2>
                        <p className="text-slate-500 font-medium">AI mendeteksi nutrisi & risiko penyakit.</p>
                    </div>
            
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={startCamera} className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 shadow-lg group transition transform hover:scale-105">
                            <CameraIcon size={32} weight="bold"/>
                            <span className="font-bold">Kamera</span>
                        </button>
                        
                        <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-slate-100 text-slate-600 rounded-3xl hover:bg-slate-50 transition transform hover:scale-105">
                            <Upload size={32} weight="bold"/>
                            <span className="font-bold">Galeri</span>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                </div>
            )}

            {/* B. TAMPILAN LIVE KAMERA (FULLSCREEN OVERLAY) */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <video ref={videoRef} autoPlay playsInline className="flex-1 w-full h-full object-cover" />
                    
                    {/* Controls Kamera */}
                    <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center pb-12">
                        <button onClick={stopCamera} className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
                            <X size={24} weight="bold"/>
                        </button>
                        
                        <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center shadow-lg active:scale-90 transition transform hover:scale-105">
                            <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
                        </button>
                        
                        <div className="w-14"></div> {/* Spacer */}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            {/* C. TAMPILAN HASIL SCAN (DENGAN PERINGATAN MEDIS) */}
            {imageSrc && (
                <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col h-[85vh]">
                    
                    {/* Header Gambar */}
                    <div className="relative h-56 flex-shrink-0 bg-slate-900">
                        <img src={imageSrc} className="w-full h-full object-cover opacity-90" alt="Scan" />
                        
                        {/* Loading State */}
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                                <p className="text-white font-bold text-xs tracking-widest animate-pulse">ANALYZING...</p>
                            </div>
                        )}
                        
                        {/* Judul Makanan */}
                        {!loading && result && (
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                                <h2 className="text-xl font-bold text-white truncate capitalize">{result.food_name}</h2>
                                <p className="text-slate-300 text-xs">{result.detected_items.length} Item Terdeteksi</p>
                            </div>
                        )}
                    </div>

                    {/* Konten Scrollable */}
                    {!loading && result && (
                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            
                            {/* 🔥 ALERT SECTION (MEDICAL EXPERT) 🔥 */}
                            {result.health_risk && !result.health_risk.isSafe ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-pulse">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Warning size={24} weight="fill" className="text-red-600" />
                                        <h3 className="font-bold text-red-700">PERINGATAN MEDIS</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {result.health_risk.risks.map((risk, idx) => (
                                            <div key={idx} className="bg-white/80 p-3 rounded border border-red-100 text-sm shadow-sm">
                                                <div className="font-bold text-red-800 uppercase text-xs mb-1 flex items-center gap-1">
                                                    🚫 {risk.disease}
                                                </div>
                                                <div className="text-slate-800">
                                                    <span className="font-bold capitalize">{risk.food}</span> berisiko.
                                                </div>
                                                <div className="text-red-600 italic text-xs mt-1">
                                                    "{risk.reason}"
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-6">
                                    <CheckCircle size={32} weight="fill" className="text-green-600" />
                                    <div>
                                        <h3 className="font-bold text-green-700">Aman Dikonsumsi</h3>
                                        <p className="text-xs text-green-600">Tidak ada pantangan penyakit terdeteksi.</p>
                                    </div>
                                </div>
                            )}

                            {/* Grid Nutrisi */}
                            <div className="grid grid-cols-3 gap-2 text-center mb-6">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Kalori</div>
                                    <div className="text-lg font-extrabold text-blue-600">{result.calories.toFixed(0)}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Karbo</div>
                                    <div className="text-lg font-extrabold text-yellow-600">{result.carbs_g.toFixed(0)}g</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Protein</div>
                                    <div className="text-lg font-extrabold text-green-600">{result.protein_g.toFixed(0)}g</div>
                                </div>
                            </div>

                            {/* List Rincian Makanan */}
                            <div className="mb-20">
                                <div className="flex items-center gap-2 mb-3 text-slate-400">
                                    <ListBullets size={18} weight="bold"/>
                                    <span className="text-xs font-bold uppercase tracking-wider">Rincian Piring</span>
                                </div>
                                <div className="space-y-2">
                                    {result.detected_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                <span className="text-sm font-semibold text-slate-700 capitalize">
                                                    {item.food_name.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{item.calories} kcal</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Buttons */}
                    {!loading && result && (
                        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-white">
                            <div className="flex gap-3">
                                <button onClick={() => {setResult(null); setImageSrc(null);}} className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                                    Ulang
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition ${
                                        result.health_risk && !result.health_risk.isSafe 
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                    }`}
                                >
                                    {result.health_risk && !result.health_risk.isSafe ? (
                                        <><Warning size={20} weight="fill"/> Tetap Simpan</>
                                    ) : (
                                        <><CheckCircle size={20} weight="fill"/> Simpan</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}