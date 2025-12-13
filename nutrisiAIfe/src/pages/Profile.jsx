import { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import {
  User,
  Ruler,
  Barbell,
  Heartbeat,
  WarningCircle,
  CheckCircle,
  SignOut,
  IdentificationCard,
  CalendarBlank,
  GenderIntersex,
} from "@phosphor-icons/react";

export default function Profile() {
  const { logout, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    gender: "male",
    weight_kg: "",
    height_cm: "",
    date_of_birth: "",
    activity_level: 1.2,
    medical_conditions: [],
  });

  const activityLevels = [
    { val: 1.2, label: "Sedentari", desc: "Jarang / tidak olahraga" },
    { val: 1.375, label: "Ringan", desc: "Olahraga 1-3x seminggu" },
    { val: 1.55, label: "Sedang", desc: "Olahraga 3-5x seminggu" },
    { val: 1.725, label: "Berat", desc: "Olahraga 6-7x seminggu" },
  ];

  const conditionsList = [
    "Diabetes",
    "Hipertensi",
    "Kolesterol",
    "Asam Urat",
    "Maag/GERD",
    "Ginjal",
    "Jantung",
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        const data = res.data;

        let conditions = [];
        try {
          conditions =
            typeof data.medical_conditions === "string"
              ? JSON.parse(data.medical_conditions)
              : data.medical_conditions;
        } catch (e) {
          conditions = [];
        }

        setFormData({
          ...data,
          medical_conditions: Array.isArray(conditions) ? conditions : [],
          date_of_birth: data.date_of_birth
            ? dayjs(data.date_of_birth).format("YYYY-MM-DD")
            : "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleCondition = (cond) => {
    setFormData((prev) => {
      const exists = prev.medical_conditions.includes(cond);
      const newConds = exists
        ? prev.medical_conditions.filter((c) => c !== cond)
        : [...prev.medical_conditions, cond];
      return { ...prev, medical_conditions: newConds };
    });
  };

  const handleSave = async () => {
    try {
      await api.put("/profile", formData);

      updateUser(formData);

      Swal.fire({
        icon: "success",
        title: "Profil Diperbarui",
        text: "Target nutrisi Anda telah dikalkulasi ulang sesuai aktivitas baru.",
        confirmButtonColor: "#2563eb",
      });
    } catch (err) {
      Swal.fire("Error", "Gagal menyimpan perubahan", "error");
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Profil Saya
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data fisik dan riwayat kesehatan
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition flex items-center gap-2"
        >
          <SignOut size={18} weight="bold" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-cyan-400"></div>
            <div className="relative z-10">
              <div className="w-28 h-28 mx-auto bg-white rounded-full p-1 shadow-lg mb-4">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-blue-600 border-4 border-white">
                  {formData.full_name?.charAt(0) || "U"}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                {formData.full_name}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                {formData.email}
              </p>

              <div className="mt-6 flex justify-center gap-2">
                <div className="px-4 py-2 bg-blue-50 text-gray-700 rounded-xl text-xs font-bold border border-blue-100">
                  Member Pro
                </div>
                <div className="px-4 py-2 bg-emerald-50 text-gray-700 rounded-xl text-xs font-bold border border-emerald-100">
                  Medical Active
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-lg">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <WarningCircle
                size={20}
                className="text-orange-500"
                weight="fill"
              />
              Status Medis (AI Guard)
            </h4>
            <div className="flex flex-wrap gap-2">
              {conditionsList.map((cond) => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    formData.medical_conditions.includes(cond)
                      ? "bg-red-500 text-white border-red-500 shadow-md transform scale-105"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
              *Pilih kondisi yang Anda alami. AI Scanner akan otomatis
              memberikan peringatan jika makanan tidak sesuai dengan kondisi
              ini.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200/60">
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                <IdentificationCard size={24} weight="fill" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Data Fisik & Identitas
                </h3>
                <p className="text-xs text-slate-500">
                  Isi data dibawah ini untuk menghitung BMR dan kebutuhan kalori
                  Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition font-bold text-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Jenis Kelamin
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-4 pl-12 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition font-bold text-slate-700 appearance-none"
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                  <GenderIntersex
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    weight="bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full p-4 pl-12 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition font-bold text-slate-700"
                  />
                  <CalendarBlank
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    weight="bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Berat Badan (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleChange}
                    className="w-full p-4 pl-12 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition font-bold text-slate-700"
                  />
                  <User
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    weight="bold"
                  />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Tinggi Badan (cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="height_cm"
                    value={formData.height_cm}
                    onChange={handleChange}
                    className="w-full p-4 pl-12 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition font-bold text-slate-700"
                  />
                  <Ruler
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    weight="bold"
                  />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Aktivitas Fisik
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {activityLevels.map((act) => (
                    <div
                      key={act.val}
                      onClick={() =>
                        setFormData({ ...formData, activity_level: act.val })
                      }
                      className={`cursor-pointer p-3 rounded-2xl border transition-all text-center ${
                        formData.activity_level === act.val
                          ? "bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500"
                          : "bg-white border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold ${
                          formData.activity_level === act.val
                            ? "text-blue-700"
                            : "text-slate-700"
                        }`}
                      >
                        {act.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                        {act.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center gap-2 transform active:scale-95"
              >
                <CheckCircle size={20} weight="fill" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
