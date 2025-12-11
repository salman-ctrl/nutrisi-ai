const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { analyzeHealthRisk } = require('../utils/medicalExpert');
const User = require('../models/User'); 

exports.scanImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tidak ada gambar yang diupload' 
        });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    try {
        // 1. Ambil Data Penyakit User
        const user = await User.findByPk(req.user.id);
        let userConditions = [];
        if (user && user.medical_conditions) {
            try {
                userConditions = JSON.parse(user.medical_conditions);
                if (typeof userConditions === 'string') userConditions = [userConditions];
            } catch (e) {
                userConditions = [];
            }
        }

        // 2. Kirim ke Python AI
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));

        const mlResponse = await axios.post('http://127.0.0.1:5001/predict', formData, {
            headers: { ...formData.getHeaders() }
        });

        const aiResult = mlResponse.data;

        // 3. Cek Hasil AI
        if (!aiResult.success || !aiResult.items || aiResult.items.length === 0) {
            return res.json({
                success: false,
                message: "Makanan tidak dikenali.",
                data: null
            });
        }

        // 4. LOGIKA AGREGASI (Hitung Total Nutrisi)
        const items = aiResult.items;
        
        let totalStats = {
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            sugar_g: 0,
            salt_mg: 0,
            fiber_g: 0
        };

        const itemNames = [];
        let calculatedGrade = 'A'; 

        items.forEach(item => {
            itemNames.push(item.food_name.replace(/_/g, ' '));
            
            totalStats.calories += item.calories;
            totalStats.protein_g += item.protein_g;
            totalStats.carbs_g += item.carbs_g;
            totalStats.fat_g += item.fat_g;
            totalStats.sugar_g += item.sugar_g;
            totalStats.salt_mg += item.salt_mg;
            totalStats.fiber_g += item.fiber_g;

            // Logika Grade Nutrisi (A/B/C/D)
            if (item.grade === 'D') calculatedGrade = 'D';
            else if (item.grade === 'C' && calculatedGrade !== 'D') calculatedGrade = 'C';
            else if (item.grade === 'B' && calculatedGrade === 'A') calculatedGrade = 'B';
        });

        // 5. LOGIKA MEDIS (Cek Risiko Penyakit)
        const healthAnalysis = analyzeHealthRisk(items, userConditions);

        // Jika dokter bilang berbahaya, paksa Grade jadi D
        if (!healthAnalysis.isSafe) {
            calculatedGrade = 'D';
        }

        // Buat Nama Gabungan
        const compositeName = items.length > 1 
            ? `Mix: ${itemNames.slice(0, 3).join(', ')}${itemNames.length > 3 ? '...' : ''}`
            : itemNames[0];

        // 6. Susun Data Final
        const finalData = {
            food_name: compositeName,
            ...totalStats,           // Data Total Kalori dll
            grade: calculatedGrade,
            image_url: imageUrl,
            detected_items: items,   // Rincian per item
            health_risk: healthAnalysis // Hasil diagnosa dokter
        };

        return res.status(200).json({
            success: true,
            message: "Scan berhasil!",
            data: finalData
        });

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                success: false, 
                message: "Layanan AI offline. Pastikan python app.py berjalan." 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server.",
            error: error.message
        });
    }
};