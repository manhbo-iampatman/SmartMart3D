import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { Box, Sparkles, Smartphone, Keyboard } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";

interface LoadingScreenProps {
  waitForCompile?: boolean;
}

/**
 * Màn hình tải (Loading Screen) mở đầu với hoạt cảnh giới thiệu siêu thị và tiến trình nạp (%)
 * Tự động tắt khi Three.js nạp & compile shader xong (100%)
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ waitForCompile = false }) => {
  const { progress, active } = useProgress();
  const isSceneCompiled = useAppStore((state) => state.isSceneCompiled);
  const [compileTimedOut, setCompileTimedOut] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!waitForCompile || isSceneCompiled) return;
    const timeout = setTimeout(() => setCompileTimedOut(true), 2000);
    return () => clearTimeout(timeout);
  }, [waitForCompile, isSceneCompiled]);

  const compileReady = !waitForCompile || isSceneCompiled || compileTimedOut;

  useEffect(() => {
    // Làm mượt tiến trình tải từ 0% lên tới progress thật & chờ compileAsync (tối đa 2s)
    const target = active ? Math.max(progress, 15) : compileReady ? 100 : 92;
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
  }, [progress, active, compileReady]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 bg-hyper-surface flex flex-col items-center justify-center p-6 text-hyper-ink transition-opacity duration-400 select-none font-sans ${
        isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-6 rounded-3xl bg-hyper-card border border-hyper-border p-6 sm:p-8 shadow-xl shadow-slate-900/5">
        {/* Logo SmartMart 3D chuẩn Modern Architectural Hypermarket */}
        <div className="w-16 h-16 rounded-2xl bg-hyper-primary flex items-center justify-center text-white shadow-lg shadow-blue-900/15 animate-pulse">
          <Box className="w-8 h-8 text-white" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-hyper-ink">
              SmartMart<span className="text-hyper-accent">3D</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-hyper-primary border border-blue-200">
              Việt Nam
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đại siêu thị Không gian Lai 2026 (Next-Gen Spatial Hypermarket)
          </p>
        </div>

        {/* Thanh tiến trình tải % */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-hyper-primary animate-spin" />
              {waitForCompile && !compileReady
                ? "Đang biên dịch shader 3D..."
                : "Đang khởi tạo không gian 3D..."}
            </span>
            <span className="font-num tabular-nums text-hyper-accent">{Math.round(displayProgress)}%</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-hyper-border p-0.5">
            <div
              className="h-full rounded-full bg-hyper-primary transition-all duration-150"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {/* Bảng hướng dẫn phím tắt cho Desktop & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2 text-left">
          <div className="p-3 rounded-xl bg-hyper-surface border border-hyper-border text-[11px] text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-hyper-primary">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Máy tính (Desktop)</span>
            </div>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Phím <kbd className="text-hyper-ink font-bold">W-A-S-D</kbd> di chuyển, giữ chuột phải để nhìn và phím <kbd className="text-hyper-ink font-bold">E</kbd> xem hàng 360°.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-hyper-surface border border-hyper-border text-[11px] text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-hyper-accent">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Điện thoại (Mobile)</span>
            </div>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Dùng cần gạt ảo góc trái để đi lại, vuốt ngón tay để quay góc nhìn và chạm để nhặt hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

