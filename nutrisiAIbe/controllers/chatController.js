const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY Missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const calculateAge = (dob) => {
    if (!dob) return 'Tidak diketahui';
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const getActivityLabel = (val) => {
    const level = parseFloat(val);
    if (level >= 1.725) return "Sangat Berat (Atlet/Fisik Berat)";
    if (level >= 1.55) return "Sedang (Olahraga 3-5x/minggu)";
    if (level >= 1.375) return "Ringan (Olahraga 1-3x/minggu)";
    return "Sedentari (Jarang Olahraga)";
};

exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        const userProfile = await User.findByPk(userId);
        
        if (!userProfile) {
            return res.status(404).json({ error: "User tidak ditemukan" });
        }

        let medicalConditions = [];
        try {
            medicalConditions = JSON.parse(userProfile.medical_conditions || '[]');
        } catch (e) {
            medicalConditions = [];
        }
        
        const conditionsText = medicalConditions.length > 0 
            ? medicalConditions.join(", ") 
            : "Tidak ada (Sehat)";
   
        const age = calculateAge(userProfile.date_of_birth);
        const activityText = getActivityLabel(userProfile.activity_level);

        const userContext = `
            DATA PENGGUNA:
            - Nama: ${userProfile.full_name}
            - Gender: ${userProfile.gender}
            - Usia: ${age} tahun
            - Berat Badan: ${userProfile.weight_kg} kg
            - Tinggi Badan: ${userProfile.height_cm} cm
            - Aktivitas Fisik: ${activityText}
            - Riwayat Penyakit: ${conditionsText}
        `;

        ChatHistory.create({
            user_id: userId,
            message: message,
            sender: 'user'
        }).catch(err => console.error(err));

        const prompt = `
            ${userContext}

            Bertindaklah sebagai "Nutrisi.AI", asisten kesehatan dan ahli gizi medis profesional.
            
            Aturan:
            - Jawab hanya seputar kesehatan, diet, penyakit, dan nutrisi.
            - WAJIB sesuaikan saran dengan KONDISI MEDIS dan AKTIVITAS FISIK pengguna di atas.
            - Tolak topik lain (politik, coding, game) dengan sopan.
            - Gaya bahasa: Ramah, empatik, suportif, dan profesional.
            - Gunakan formatting Markdown (bold, list, table) agar mudah dibaca.
            
            Pertanyaan User: "${message}"
        `;

        let aiResponseText = "Maaf, AI sedang gangguan.";
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            aiResponseText = response.text();
        } catch (aiError) {
            aiResponseText = "Maaf, ada kendala koneksi ke server AI. Mohon coba lagi.";
        }

        const savedReply = await ChatHistory.create({
            user_id: userId,
            message: aiResponseText,
            sender: 'ai'
        });

        res.json(savedReply);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const chats = await ChatHistory.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'ASC']] 
        });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: "Gagal memuat riwayat." });
    }
};