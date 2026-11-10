import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { isSpatialInputBlocked } from "../../utils/spatialInteraction";

/**
 * Cần điều khiển ảo (Virtual Touch Joystick) dành cho thiết bị di động (Mobile)
 * Cho phép người dùng chạm và vuốt để di chuyển tiến/lùi và rẽ trái/phải trong không gian 3D.
 */
export const VirtualJoystick: React.FC = () => {
  const setVirtualMove = useAppStore((state) => state.setVirtualMove);
  const blocked = useAppStore(isSpatialInputBlocked);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const maxRadius = 45; // Khoảng cách tối đa nút joystick có thể kéo

  // Phát hiện thiết bị cảm ứng hoặc màn hình di động/tablet
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  const updateMove = useCallback(
    (x: number, y: number) => {
      const distance = Math.hypot(x, y);
      if (distance < 5) {
        setVirtualMove({ forward: 0, right: 0 });
        return;
      }
      // Trục Y âm là tiến về phía trước (forward > 0)
      const forward = Math.max(-1, Math.min(1, -y / maxRadius));
      // Trục X dương là sang phải (right > 0)
      const right = Math.max(-1, Math.min(1, x / maxRadius));
      setVirtualMove({ forward, right });
    },
    [setVirtualMove]
  );

  const resetJoystick = useCallback(() => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    touchIdRef.current = null;
    setVirtualMove({ forward: 0, right: 0 });
  }, [setVirtualMove]);

  const processPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      let clampedX = dx;
      let clampedY = dy;
      if (distance > maxRadius) {
        clampedX = (dx / distance) * maxRadius;
        clampedY = (dy / distance) * maxRadius;
      }

      setKnobPos({ x: clampedX, y: clampedY });
      updateMove(clampedX, clampedY);
    },
    [updateMove]
  );

  // Xử lý Touch Events
  const handleTouchStart = (event: React.TouchEvent) => {
    if (blocked) return;
    const touch = event.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    processPoint(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    const touch = Array.from(event.changedTouches).find((t) => t.identifier === touchIdRef.current);
    if (touch) {
      processPoint(touch.clientX, touch.clientY);
    }
  };

  // Xử lý Mouse Events (phục vụ test và debug trên desktop responsive mode)
  const handleMouseDown = (event: React.MouseEvent) => {
    if (blocked) return;
    setIsDragging(true);
    processPoint(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    processPoint(event.clientX, event.clientY);
  };

  if (!isTouchDevice || blocked) return null;

  return (
    <div
      role="region"
      aria-label="Cần điều khiển ảo di chuyển"
      className="absolute bottom-6 left-6 z-30 pointer-events-auto select-none touch-none"
    >
      {/* Vòng tròn đế joystick */}
      <div
        ref={baseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={resetJoystick}
        onTouchCancel={resetJoystick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={resetJoystick}
        onMouseLeave={resetJoystick}
        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-hyper-border bg-hyper-card/90 flex items-center justify-center relative shadow-lg"
      >
        {/* Đường định hướng N/S/W/E */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-full h-px bg-slate-300" />
          <div className="h-full w-px bg-slate-300 absolute" />
        </div>

        {/* Nút gạt trung tâm (Knob) */}
        <div
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
          }}
          className={`w-12 h-12 rounded-full bg-hyper-accent border-2 border-white shadow-md flex items-center justify-center text-white transition-transform ${
            isDragging ? "scale-105 duration-0" : "duration-150"
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white/90 shadow-inner" />
        </div>
      </div>
      <p className="text-[10px] text-hyper-ink bg-hyper-card/90 border border-hyper-border rounded-full px-2 py-0.5 text-center font-bold mt-1.5 shadow-sm">
        Cần gạt di chuyển
      </p>
    </div>
  );
};
