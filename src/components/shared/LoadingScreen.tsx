import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { Box, Sparkles, Smartphone, Keyboard } from "lucide-react";

/**
 * Màn hình tải (Loading Screen) mở đầu với hoạt cảnh giới thiệu siêu thị và tiến trình nạp (%)
 * Tự động tắt khi Three.js nạp xong tài nguyên (100%)
 */
export const LoadingScreen: React.FC = () => {
  const { progress, active } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Làm mượt tiến trình tải từ 0% lên tới progress thật
    const target = active ? Math.max(progress, 15) : 100;
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= target) {
          if (target >= 100) {
            setIsLoaded(true);
            setTimeout(() => setIsVisible(false), 400); // Fade out
          }
          return target;
        }
        return Math.min(prev + 5, target);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [progress, active]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white transition-opacity duration-400 select-none font-sans ${
        isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Logo SmartMart 3D */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 animate-pulse">
          <Box className="w-8 h-8 text-white" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              SmartMart<span className="text-orange-500">3D</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Việt Nam
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đại siêu thị Không gian Lai 2026 (Next-Gen Spatial Hypermarket)
          </p>
        </div>

        {/* Thanh tiến trình tải % */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              Đang khởi tạo không gian 3D...
            </span>
            <span className="font-mono text-orange-400">{Math.round(displayProgress)}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-orange-500 to-amber-400 transition-all duration-150"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {/* Bảng hướng dẫn phím tắt cho Desktop & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-4 text-left">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-400">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Máy tính (Desktop)</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Phím <kbd className="text-slate-200 font-bold">W-A-S-D</kbd> di chuyển, giữ chuột phải để nhìn và phím <kbd className="text-slate-200 font-bold">E</kbd> xem hàng 360°.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-orange-400">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Điện thoại (Mobile)</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Dùng cần gạt ảo góc trái để đi lại, vuốt ngón tay để quay góc nhìn và chạm để nhặt hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

