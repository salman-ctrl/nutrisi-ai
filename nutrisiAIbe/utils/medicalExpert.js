const diseaseRules = {
    "diabetes": {
        forbidden: ["nasi_putih", "gula", "manis", "sirup", "kue", "donat", "biskuit", "soda", "es_krim", "cokelat"],
        limits: { sugar_g: 20, carbs_g: 60 }, 
        msg: "Indeks glikemik tinggi. Berisiko menaikkan gula darah."
    },
    "hipertensi": {
        forbidden: ["garam", "asin", "keripik", "sosis", "kornet", "mie_instan", "bumbu", "penyedap", "bakso"],
        limits: { salt_mg: 400 },
        msg: "Kandungan Natrium tinggi. Risiko tekanan darah naik."
    },
    "kolesterol": {
        forbidden: ["goreng", "santan", "kulit", "jeroan", "lemak", "kuning_telur", "telur_goreng", "rendang", "sate", "daging_sapi"],
        limits: { fat_g: 15 },
        msg: "Lemak jenuh tinggi. Berbahaya untuk jantung."
    },
    "asam_urat": {
        forbidden: ["kacang", "emping", "jeroan", "bayam", "daging_merah", "sate", "bebek", "sarden", "seafood", "udang"],
        limits: { protein_g: 999 },
        msg: "Tinggi Purin. Dapat memicu nyeri sendi."
    },
    "gerd": {
        forbidden: ["pedas", "sambal", "cabai", "kopi", "cokelat", "asam", "jeruk", "tomat", "gorengan", "santan"],
        limits: { fat_g: 20 },
        msg: "Pemicu asam lambung naik."
    }
};

const analyzeHealthRisk = (items, userConditions) => {
    let risks = [];
    let isSafe = true;

    if (!items || !userConditions) return { isSafe: true, risks: [] };

    items.forEach(item => {
        const fname = item.food_name.toLowerCase();
        
        userConditions.forEach(cond => {
            const rule = diseaseRules[cond.toLowerCase()];
            if (rule) {
                const isForbidden = rule.forbidden.some(key => fname.includes(key));
                
                let isExceeded = false;
                if (rule.limits.sugar_g && item.sugar_g > rule.limits.sugar_g) isExceeded = true;
                if (rule.limits.salt_mg && item.salt_mg > rule.limits.salt_mg) isExceeded = true;
                if (rule.limits.fat_g && item.fat_g > rule.limits.fat_g) isExceeded = true;

                if (isForbidden || isExceeded) {
                    isSafe = false;
                    risks.push({
                        disease: cond,
                        food: item.food_name.replace(/_/g, " "),
                        reason: rule.msg
                    });
                }
            }
        });
    });

    return { isSafe, risks };
};

module.exports = { analyzeHealthRisk };