import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { calculateNeeds } from "../utils/nutritionCalc";
import { Drop, Plus, Minus } from "@phosphor-icons/react";
import dayjs from "dayjs";
import "dayjs/locale/id";

export default function Dashboard() {
  dayjs.locale("id");
  const { user } = useContext(AuthContext);
  const [todayLogs, setTodayLogs] = useState([]);
  const [water, setWater] = useState(0);

  const [stats, setStats] = useState({
    consumed: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
    salt: 0,
    fiber: 0,
  });

  const targets = calculateNeeds(user);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [foodRes, waterRes] = await Promise.all([
        api.get("/food/today"),
        api.get("/water"),
      ]);

      setTodayLogs(foodRes.data);
      setWater(waterRes.data.water_glasses);

      let total = {
        consumed: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0,
        salt: 0,
        fiber: 0,
      };
      foodRes.data.forEach((item) => {
        total.consumed += item.calories;
        total.protein += item.protein_g;
        total.carbs += item.carbs_g;
        total.fat += item.fat_g;
        total.sugar += item.sugar_g || 0;
        total.salt += item.salt_mg || 0;
        total.fiber += item.fiber_g || 0;
      });
      setStats(total);
    } catch (err) {
      console.error(err);
    }
  };

  const updateWater = async (amount) => {
    try {
      const res = await api.post("/water", { amount });
      setWater(res.data.water_glasses);
    } catch (err) {
      console.error(err);
    }
  };

  const percent = Math.min((stats.consumed / targets.cal) * 100, 100);

  const getWaterState = (count) => {
    if (count <= 2)
      return {
        color: "bg-red-500",
        waveColor: "bg-red-400",
        text: "text-red-600",
        msg:
          count === 0
            ? "Tubuhmu kering! Minum sekarang."
            : "Bahaya! Kamu sangat dehidrasi.",
      };
    if (count <= 4)
      return {
        color: "bg-yellow-400",
        waveColor: "bg-yellow-300",
        text: "text-yellow-600",
        msg: "Masih kurang. Ayo minum lagi.",
      };
    if (count <= 6)
      return {
        color: "bg-sky-400",
        waveColor: "bg-sky-300",
        text: "text-sky-600",
        msg: "Sedikit lagi menuju target!",
      };
    return {
      color: "bg-blue-600",
      waveColor: "bg-blue-500",
      text: "text-blue-600",
      msg: "Kerja bagus! Tubuh terhidrasi.",
    };
  };
  const waterState = getWaterState(water);
  const waterHeight = Math.min((water / 8) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-700 tracking-tight">
            Yuk, cukupi kebutuhan nutrisi harianmu!
          </h2>
          <p className="text-slate-500 text-sm">
            {dayjs().format("dddd, D MMMM YYYY")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/75 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                Total Asupan
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-800">
                  {Math.round(stats.consumed)}
                </span>
                <span className="text-lg text-slate-400 font-bold">
                  / {targets.cal} kcal
                </span>
              </div>
            </div>

            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (351 * percent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-slate-800">
                {Math.round(percent)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {[
              {
                l: "Protein",
                v: stats.protein,
                t: targets.protein,
                c: "blue",
                unit: "g",
              },
              {
                l: "Carbs",
                v: stats.carbs,
                t: targets.carbs,
                c: "orange",
                unit: "g",
              },
              { l: "Fat", v: stats.fat, t: targets.fat, c: "red", unit: "g" },

              {
                l: "Gula",
                v: stats.sugar,
                t: targets.sugar,
                c: "purple",
                unit: "g",
              },
              {
                l: "Garam",
                v: stats.salt,
                t: targets.salt,
                c: "slate",
                unit: "mg",
              },
              {
                l: "Serat",
                v: stats.fiber,
                t: targets.fiber,
                c: "emerald",
                unit: "g",
              },
            ].map((m, i) => (
              <div
                key={i}
                className={`bg-${m.c}-50/50 backdrop-blur-sm p-3 rounded-2xl border border-${m.c}-100 flex flex-col justify-between h-24`}
              >
                <div>
                  <p
                    className={`text-[10px] text-${m.c}-500 font-bold uppercase`}
                  >
                    {m.l}
                  </p>
                  <p className={`text-lg font-bold text-${m.c}-700`}>
                    {Math.round(m.v)}
                    <span className="text-xs font-normal ml-0.5">{m.unit}</span>
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Target</span>
                    <span>
                      {m.t}
                      {m.unit}
                    </span>
                  </div>
                  <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`bg-${m.c}-500 h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((m.v / m.t) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-lg flex flex-col items-center justify-between relative overflow-hidden transition-colors duration-500">
          <div className="w-full flex justify-between items-center mb-2 z-10">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Drop weight="fill" className={waterState.text} /> Hidrasi
            </h3>
            <span
              className={`text-xs font-extrabold ${waterState.text} bg-white/80 px-2 py-1 rounded-lg`}
            >
              {water}/8 Gelas
            </span>
          </div>

          <div className="text-center mb-4 h-6 z-10">
            <p className={`text-xs font-bold ${waterState.text} animate-pulse`}>
              {waterState.msg}
            </p>
          </div>

          <div className="flex-1 w-full flex items-center justify-center relative z-0 my-2">
            <div
              className="relative w-28 h-56 bg-slate-200"
              style={{
                maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 200' preserveAspectRatio='xMidYMid meet'%3E%3Cpath d='M50,0 C63.8,0 75,11.2 75,25 C75,38.8 63.8,50 50,50 C36.2,50 25,38.8 25,25 C25,11.2 36.2,0 50,0 Z M75,60 L85,60 C93.3,60 100,66.7 100,75 L100,140 C100,145.5 95.5,150 90,150 C84.5,150 80,145.5 80,140 L80,80 L70,80 L70,190 C70,195.5 65.5,200 60,200 C54.5,200 50,195.5 50,190 L50,130 L50,130 L50,190 C50,195.5 45.5,200 40,200 C34.5,200 30,195.5 30,190 L30,80 L20,80 L20,140 C20,145.5 15.5,150 10,150 C4.5,150 0,145.5 0,140 L0,75 C0,66.7 6.7,60 15,60 L25,60 L75,60 Z' fill='black'/%3E%3C/svg%3E")`,
                WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 200' preserveAspectRatio='xMidYMid meet'%3E%3Cpath d='M50,0 C63.8,0 75,11.2 75,25 C75,38.8 63.8,50 50,50 C36.2,50 25,38.8 25,25 C25,11.2 36.2,0 50,0 Z M75,60 L85,60 C93.3,60 100,66.7 100,75 L100,140 C100,145.5 95.5,150 90,150 C84.5,150 80,145.5 80,140 L80,80 L70,80 L70,190 C70,195.5 65.5,200 60,200 C54.5,200 50,195.5 50,190 L50,130 L50,130 L50,190 C50,195.5 45.5,200 40,200 C34.5,200 30,195.5 30,190 L30,80 L20,80 L20,140 C20,145.5 15.5,150 10,150 C4.5,150 0,145.5 0,140 L0,75 C0,66.7 6.7,60 15,60 L25,60 L75,60 Z' fill='black'/%3E%3C/svg%3E")`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            >
              <div
                className={`absolute bottom-0 w-full transition-all duration-700 ease-in-out ${waterState.color}`}
                style={{ height: `${waterHeight}%` }}
              >
                <div
                  className={`absolute -top-3 left-0 w-[200%] h-6 rounded-[40%] animate-wave opacity-70 ${waterState.color}`}
                ></div>
                <div
                  className={`absolute -top-2 left-0 w-[200%] h-6 rounded-[45%] animate-wave opacity-40 ${waterState.waveColor}`}
                  style={{ animationDuration: "3s", animationDelay: "-1s" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="z-10 w-full flex justify-between items-center bg-white/50 backdrop-blur-sm p-2 rounded-xl border border-white mt-4">
            <button
              onClick={() => updateWater(-1)}
              className="w-10 h-10 rounded-lg bg-white shadow hover:bg-slate-100 text-slate-500 transition flex items-center justify-center active:scale-95"
            >
              <Minus weight="bold" />
            </button>
            <span className="font-bold text-2xl text-slate-800">{water}</span>
            <button
              onClick={() => updateWater(1)}
              className={`w-10 h-10 rounded-lg shadow text-white hover:scale-105 transition flex items-center justify-center active:scale-95 ${waterState.color}`}
            >
              <Plus weight="bold" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg text-slate-800 mb-4">
          Riwayat Makan Hari Ini
        </h3>
        <div className="space-y-3">
          {todayLogs.length === 0 ? (
            <div className="text-center p-8 bg-white/50 rounded-3xl border border-dashed border-slate-300 text-slate-400">
              Belum ada makanan. Yuk scan makananmu!
            </div>
          ) : (
            todayLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white hover:border-blue-200 transition shadow-sm"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-none shadow-sm
                                    ${
                                      log.grade === "A"
                                        ? "bg-green-100 text-green-600"
                                        : log.grade === "B"
                                        ? "bg-blue-100 text-blue-600"
                                        : log.grade === "C"
                                        ? "bg-yellow-100 text-yellow-600"
                                        : "bg-red-100 text-red-600"
                                    }`}
                >
                  {log.grade}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-700">{log.food_name}</h4>
                  <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 font-medium mt-0.5">
                    <span>{log.calories} kcal</span>
                    <span className="text-blue-500">P: {log.protein_g}g</span>
                    <span className="text-purple-500">
                      Gula: {log.sugar_g}g
                    </span>
                    <span className="text-slate-500">Na: {log.salt_mg}mg</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
