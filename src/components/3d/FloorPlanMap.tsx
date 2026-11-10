import React, { useCallback, useEffect, useState } from "react";
import { Camera, Compass, Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import { ALL_PRODUCTS } from "../../data/catalog";
import { APPAREL_ZONE_BOUNDS } from "../../data/apparelLayout";
import { CAMERA_PRESETS, type CameraPreset } from "../../data/cameraPresets";
import { STORE_LAYOUT } from "../../data/storeLayout";
import { useAppStore } from "../../stores/useAppStore";
import { useNavigationStore } from "../../stores/useNavigationStore";
import type { Product } from "../../types";

export interface FastTravelLandmark {
  id: string;
  name: string;
  x: number;
  z: number;
  heading: number;
  icon: string;
  badgeColor: string;
}

export const FAST_TRAVEL_LANDMARKS: readonly FastTravelLandmark[] = [
  { id: "lobby", name: "Sảnh Chính", x: 0, z: 22, heading: 0, icon: "🏛️", badgeColor: "bg-indigo-600" },
  { id: "produce", name: "Rau Củ Tươi", x: 11.5, z: -8.0, heading: -Math.PI / 2, icon: "🥦", badgeColor: "bg-emerald-600" },
  { id: "apparel", name: "Thời Trang", x: 11.0, z: 7.5, heading: -Math.PI / 2, icon: "👕", badgeColor: "bg-amber-600" },
  { id: "entrance", name: "Lối Vào Kệ", x: 0, z: 8.2, heading: 0, icon: "🚪", badgeColor: "bg-slate-700" },
  { id: "aisle1", name: "Lối 01: Đồ Uống", x: -4.0, z: 0, heading: -Math.PI / 2, icon: "🥤", badgeColor: "bg-blue-600" },
  { id: "aisle2", name: "Lối 02: Sữa & Cà Phê", x: 0, z: -4.4, heading: -Math.PI / 2, icon: "🥛", badgeColor: "bg-orange-600" },
  { id: "aisle3", name: "Lối 03: Bánh Kẹo", x: 0, z: 4.4, heading: Math.PI / 2, icon: "🍪", badgeColor: "bg-purple-600" },
  { id: "aisle4", name: "Lối 04: Gia Vị", x: 4.0, z: 0, heading: Math.PI / 2, icon: "🌾", badgeColor: "bg-emerald-600" },
  { id: "freezer", name: "Tủ Đông Lạnh", x: -10.3, z: -23.8, heading: 0, icon: "❄️", badgeColor: "bg-cyan-600" },
  { id: "bakery", name: "Bánh Mì & Deli", x: 10.4, z: -23.8, heading: 0, icon: "🥐", badgeColor: "bg-amber-600" },
  { id: "kiosk-south", name: "Kiosk Sảnh Nam", x: -6.5, z: 14.8, heading: Math.PI, icon: "🏧", badgeColor: "bg-hyper-primary" },
  { id: "cart-corral", name: "Chuồng Xe Đẩy", x: -15.5, z: 19.2, heading: Math.PI, icon: "🛒", badgeColor: "bg-hyper-accent" },
];

const MAP_PRODUCTS = ALL_PRODUCTS.filter((product) => product.has3D && product.shelfLocation);

const ProductMapMarkers = React.memo<{
  selectedId: string | null;
  onSelect: (product: Product) => void;
}>(({ selectedId, onSelect }) => (
  <>
    {MAP_PRODUCTS.map((product) => {
      const [x, , z] = product.shelfLocation!.worldPos;
      const active = selectedId === product.id;
      return (
        <g
          key={product.id}
          role="button"
          tabIndex={0}
          aria-label={`Dẫn đường đến ${product.name}`}
          className="cursor-pointer outline-none focus:opacity-60"
          onClick={() => onSelect(product)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(product);
            }
          }}
        >
          <title>{product.name}</title>
          <circle cx={x} cy={z} r={0.43} fill="transparent" />
          <circle
            cx={x}
            cy={z}
            r={active ? 0.25 : 0.17}
            fill={active ? "#ff5400" : "#ffffff"}
            stroke={active ? "#0f172a" : "#475569"}
            strokeWidth={0.06}
            aria-label={active ? "Vị trí sản phẩm đang dẫn đường" : undefined}
          />
        </g>
      );
    })}
  </>
));
ProductMapMarkers.displayName = "ProductMapMarkers";

export const FloorPlanMap: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"zones" | "presets">("zones");
  const [activeLandmark, setActiveLandmark] = useState<string | null>(null);

  const player = useNavigationStore((state) => state.player);
  const heading = useNavigationStore((state) => state.heading);
  const path = useNavigationStore((state) => state.path);
  const selected = useAppStore((state) => state.activeNavigationProduct);
  const activePresetId = useAppStore((state) => state.activePresetTarget?.id ?? null);
  const navigate = useAppStore((state) => state.navigateToProductIn3D);
  const triggerFastTravel = useAppStore((state) => state.triggerFastTravel);
  const activateCameraPreset = useAppStore((state) => state.activateCameraPreset);

  const { minX, maxX, minZ, maxZ, obstacles } = STORE_LAYOUT;

  const chooseProduct = useCallback(
    (product: Product) => {
      navigate(product);
      if (window.innerWidth < 640) {
        setExpanded(false);
        onClose();
      }
    },
    [navigate, onClose]
  );

  const handleLandmarkTeleport = (landmark: FastTravelLandmark) => {
    setActiveLandmark(landmark.name);
    triggerFastTravel(landmark.x, landmark.z, landmark.heading, landmark.name);
    setTimeout(() => setActiveLandmark(null), 1800);
    if (window.innerWidth < 640) {
      setExpanded(false);
      onClose();
    }
  };

  const handlePresetSelect = (preset: CameraPreset) => {
    setActiveLandmark(preset.label);
    activateCameraPreset(preset);
    setTimeout(() => setActiveLandmark(null), 1800);
    if (window.innerWidth < 640) {
      setExpanded(false);
      onClose();
    }
  };

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      const state = useAppStore.getState();
      if (event.key === "Escape" && !state.inspectingProduct && !state.isCartOpen && !state.isCheckoutOpen) onClose();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);

  return (
    <section
      aria-label="Bản đồ mặt bằng siêu thị"
      className={`absolute z-30 pointer-events-auto rounded-2xl border border-hyper-border bg-hyper-card/95 p-3 sm:p-4 text-hyper-ink shadow-2xl ${
        expanded
          ? "inset-x-4 top-20 bottom-16 sm:inset-x-16 flex flex-col"
          : "top-28 sm:top-36 right-4 w-[min(390px,calc(100%-2rem))]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-sm font-black flex items-center gap-1.5 text-hyper-ink">
            <span>Sơ đồ SmartMart</span>
            <span className="text-[10px] font-bold text-hyper-primary bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
              2026 Radar
            </span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {activeLandmark ? (
              <span className="text-hyper-primary font-bold animate-pulse">
                ⚡ Đang bay tới {activeLandmark}...
              </span>
            ) : (
              "Bấm gian hàng để dịch chuyển hoặc chấm để dẫn đường"
            )}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            aria-label={expanded ? "Thu nhỏ bản đồ" : "Phóng to bản đồ"}
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            aria-label="Đóng bản đồ"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bộ chuyển Tab: Khu vực (mặc định giữ nguyên toàn bộ Landmarks) & 6 Góc nhìn tham chiếu */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-hyper-surface border border-hyper-border mb-2.5">
        <button
          type="button"
          onClick={() => setActiveTab("zones")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
            activeTab === "zones"
              ? "bg-hyper-card text-hyper-primary shadow-sm border border-hyper-border"
              : "text-slate-600 hover:text-hyper-ink"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Khu vực</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
            activeTab === "presets"
              ? "bg-hyper-card text-hyper-primary shadow-sm border border-hyper-border"
              : "text-slate-600 hover:text-hyper-ink"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{CAMERA_PRESETS.length} Góc nhìn</span>
        </button>
      </div>

      {activeTab === "zones" ? (
        <div className="mb-2.5">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            <Sparkles className="w-3 h-3 text-hyper-primary" />
            <span>Dịch chuyển nhanh (Fast-Travel)</span>
          </div>
          <div className="flex overflow-x-auto pb-1 gap-1.5 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {FAST_TRAVEL_LANDMARKS.map((landmark) => (
              <button
                key={landmark.id}
                onClick={() => handleLandmarkTeleport(landmark)}
                className="shrink-0 sm:shrink flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-hyper-surface border border-hyper-border hover:border-hyper-primary hover:bg-blue-50/70 text-left transition-all active:scale-95 group"
                title={`Dịch chuyển nhanh đến ${landmark.name}`}
              >
                <span className="text-xs">{landmark.icon}</span>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-hyper-primary truncate">
                  {landmark.name.split(":")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-2.5">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            <Camera className="w-3 h-3 text-hyper-accent" />
            <span>{CAMERA_PRESETS.length} Góc nhìn kiến trúc tham chiếu</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {CAMERA_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  title={preset.description}
                  className={`flex flex-col items-start px-2.5 py-2 rounded-xl border text-left transition-all active:scale-95 ${
                    isSelected
                      ? "bg-blue-50 border-hyper-primary text-hyper-primary shadow-sm"
                      : "bg-hyper-surface border-hyper-border hover:border-hyper-primary text-hyper-ink"
                  }`}
                >
                  <span className="text-[11px] font-bold leading-tight">{preset.label}</span>
                  <span className="text-[9px] text-slate-500 truncate w-full mt-0.5">
                    {preset.hideCeiling ? "Mở trần toàn khu" : "Góc ngang 1.65m"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bản đồ SVG mặt bằng siêu thị */}
      <svg
        aria-label="Mặt bằng, đường đi và vị trí hiện tại"
        viewBox={`${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`}
        className={`w-full rounded-xl bg-hyper-surface border border-hyper-border ${
          expanded ? "flex-1 min-h-0" : "h-40 sm:h-56"
        }`}
      >
        <defs>
          <pattern id="floor-plan-grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#cbd5e1" strokeWidth="0.025" />
          </pattern>
        </defs>

        <rect x={minX} y={minZ} width={maxX - minX} height={maxZ - minZ} fill="url(#floor-plan-grid)" />

        {/* Sàn gỗ khu Thời Trang & Phụ Kiện (Phase 4) */}
        <rect
          x={APPAREL_ZONE_BOUNDS.centerX - APPAREL_ZONE_BOUNDS.width / 2}
          y={APPAREL_ZONE_BOUNDS.centerZ - APPAREL_ZONE_BOUNDS.depth / 2}
          width={APPAREL_ZONE_BOUNDS.width}
          height={APPAREL_ZONE_BOUNDS.depth}
          fill="#d97706"
          fillOpacity={0.18}
          stroke="#f59e0b"
          strokeWidth={0.08}
          strokeDasharray="0.3 0.2"
          rx={0.2}
        />

        {/* Chướng ngại vật / 18 Dãy kệ 3 tầng & Phân khu Bắc/Đông/Nam */}
        {obstacles.map((obstacle) =>
          obstacle.kind === "circle" ? (
            <circle
              key={obstacle.id}
              cx={obstacle.x}
              cy={obstacle.z}
              r={obstacle.radius}
              fill="#cbd5e1"
              stroke="#64748b"
              strokeWidth={0.05}
            />
          ) : (
            <g key={obstacle.id}>
              <rect
                x={obstacle.x - obstacle.width / 2}
                y={obstacle.z - obstacle.depth / 2}
                width={obstacle.width}
                height={obstacle.depth}
                rx={0.1}
                fill={
                  obstacle.id.startsWith("shelf-")
                    ? "#0052cc"
                    : obstacle.id.startsWith("freezer-")
                    ? "#0284c7"
                    : obstacle.id.startsWith("bakery-")
                    ? "#d97706"
                    : obstacle.id.startsWith("promo-bay-")
                    ? "#ca8a04"
                    : obstacle.id.startsWith("produce-")
                    ? "#10b981"
                    : obstacle.id.startsWith("rack-") || obstacle.id.startsWith("table-")
                    ? "#f59e0b"
                    : obstacle.id.startsWith("checkout-")
                    ? "#0284c7"
                    : obstacle.id.startsWith("cart-")
                    ? "#ea580c"
                    : "#475569"
                }
                fillOpacity={obstacle.id.startsWith("col-") ? 0.85 : 0.88}
                stroke="#e2e8f0"
                strokeWidth={0.04}
              />
            </g>
          )
        )}

        {/* Dãy Dairy & Frozen + Bakery & Deli Tường Bắc */}
        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "freezer");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <text x="-10.3" y="-24.3" textAnchor="middle" fill="#0369a1" fontSize="0.52" fontWeight="bold">
            ❄ DAIRY &amp; FROZEN
          </text>
        </g>

        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "bakery");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <text x="10.0" y="-24.3" textAnchor="middle" fill="#b45309" fontSize="0.52" fontWeight="bold">
            🥐 BAKERY &amp; DELI
          </text>
        </g>

        {/* Lối vào Sảnh Kệ */}
        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "entrance");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <text x="0" y="8.6" textAnchor="middle" fill="#475569" fontSize="0.42" fontWeight="bold">
            🚪 LỐI VÀO KỆ
          </text>
        </g>

        {/* Cụm Kiosk Sảnh Nam & Chuồng Xe Đẩy (Phase 5) */}
        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "kiosk-south");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <text x="-7.75" y="15.7" textAnchor="middle" fill="#2563eb" fontSize="0.55" fontWeight="bold">
            🏧 KIOSK TÂY (01-04)
          </text>
          <text x="7.75" y="15.7" textAnchor="middle" fill="#2563eb" fontSize="0.55" fontWeight="bold">
            🏧 KIOSK ĐÔNG (05-08)
          </text>
        </g>

        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "cart-corral");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <text x="-15.5" y="23.6" textAnchor="middle" fill="#ea580c" fontSize="0.52" fontWeight="bold">
            🛒 CHUỒNG XE ĐẨY
          </text>
        </g>

        {/* Đường đi nét đứt khi dẫn đường */}
        {path.length > 1 && (
          <polyline
            aria-label="Đường đi đến kệ"
            points={path.map((point) => `${point.x},${point.z}`).join(" ")}
            fill="none"
            stroke="#ff5400"
            strokeWidth={0.14}
            strokeLinejoin="round"
            strokeDasharray="0.22 0.14"
          />
        )}

        {/* Các chấm sản phẩm 3D hợp nhất (React.memo tách khỏi radar pose 10Hz) */}
        <ProductMapMarkers selectedId={selected?.id ?? null} onSelect={chooseProduct} />

        {/* Vị trí và nón nhìn của người chơi */}
        <g
          aria-label="Vị trí của bạn"
          transform={`translate(${player.x} ${player.z}) rotate(${(heading * 180) / Math.PI})`}
        >
          <circle r={0.38} fill="#0052cc" fillOpacity={0.22} />
          <path
            d="M 0 -0.42 L 0.26 0.26 L 0 0.14 L -0.26 0.26 Z"
            fill="#0052cc"
            stroke="#ffffff"
            strokeWidth={0.05}
          />
        </g>
      </svg>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>Mũi tên xanh: bạn · Chấm vàng: đích</span>
        <span className="text-hyper-primary font-bold">⚡ Click địa điểm để bay nhanh</span>
      </div>
    </section>
  );
};
