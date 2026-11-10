import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import { MOCK_PRODUCTS } from "../../data/mockProducts";
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
  { id: "entrance", name: "Lối Vào", x: 0, z: 4.5, heading: 0, icon: "🚪", badgeColor: "bg-slate-700" },
  { id: "aisle1", name: "Lối 01: Đồ Uống", x: -4.0, z: 0, heading: -Math.PI / 2, icon: "🥤", badgeColor: "bg-blue-600" },
  { id: "aisle2", name: "Lối 02: Sữa & Cà Phê", x: -1.3, z: 0, heading: -Math.PI / 2, icon: "🥛", badgeColor: "bg-orange-600" },
  { id: "aisle3", name: "Lối 03: Bánh Kẹo", x: 1.3, z: 0, heading: Math.PI / 2, icon: "🍪", badgeColor: "bg-purple-600" },
  { id: "aisle4", name: "Lối 04: Gia Vị", x: 4.0, z: 0, heading: Math.PI / 2, icon: "🌾", badgeColor: "bg-emerald-600" },
  { id: "promo", name: "Ụ Khuyến Mãi", x: 0, z: 1.6, heading: Math.PI, icon: "🏷️", badgeColor: "bg-red-600" },
  { id: "freezer", name: "Tủ Đông Lạnh", x: 0, z: -4.8, heading: Math.PI, icon: "❄️", badgeColor: "bg-cyan-600" },
  { id: "checkout", name: "Thu Ngân 04", x: 0, z: -3.4, heading: Math.PI, icon: "💳", badgeColor: "bg-emerald-600" },
];

export const FloorPlanMap: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeLandmark, setActiveLandmark] = useState<string | null>(null);

  const player = useNavigationStore((state) => state.player);
  const heading = useNavigationStore((state) => state.heading);
  const path = useNavigationStore((state) => state.path);
  const selected = useAppStore((state) => state.activeNavigationProduct);
  const navigate = useAppStore((state) => state.navigateToProductIn3D);
  const triggerFastTravel = useAppStore((state) => state.triggerFastTravel);

  const { minX, maxX, minZ, maxZ, obstacles } = STORE_LAYOUT;

  const chooseProduct = (product: Product) => {
    navigate(product);
    if (window.innerWidth < 640) onClose();
  };

  const handleLandmarkTeleport = (landmark: FastTravelLandmark) => {
    setActiveLandmark(landmark.name);
    triggerFastTravel(landmark.x, landmark.z, landmark.heading, landmark.name);
    setTimeout(() => setActiveLandmark(null), 1800);
    if (window.innerWidth < 640) onClose();
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
      className={`absolute z-30 pointer-events-auto rounded-2xl border border-white/30 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl ${
        expanded
          ? "inset-x-4 top-24 bottom-16 sm:inset-x-16 flex flex-col"
          : "top-36 right-4 w-[min(380px,calc(100%-2rem))]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-sm font-black flex items-center gap-1.5 text-white">
            <span>Sơ đồ SmartMart</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded-full">
              2026 Radar
            </span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {activeLandmark ? (
              <span className="text-cyan-400 font-bold animate-pulse">
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
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            aria-label="Đóng bản đồ"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dải nút Dịch chuyển tức thời (Fast-Travel Quick Teleport) */}
      <div className="mb-2.5">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Dịch chuyển nhanh (Fast-Travel)</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {FAST_TRAVEL_LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => handleLandmarkTeleport(landmark)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-400/60 hover:bg-slate-800 text-left transition-all active:scale-95 group"
              title={`Dịch chuyển nhanh đến ${landmark.name}`}
            >
              <span className="text-xs">{landmark.icon}</span>
              <span className="text-[10px] font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                {landmark.name.split(":")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bản đồ SVG mặt bằng siêu thị */}
      <svg
        aria-label="Mặt bằng, đường đi và vị trí hiện tại"
        viewBox={`${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`}
        className={`w-full rounded-xl bg-slate-900 border border-slate-700 ${
          expanded ? "flex-1 min-h-0" : "h-56"
        }`}
      >
        <defs>
          <pattern id="floor-plan-grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#334155" strokeWidth="0.025" />
          </pattern>
        </defs>

        <rect x={minX} y={minZ} width={maxX - minX} height={maxZ - minZ} fill="url(#floor-plan-grid)" />

        {/* Chướng ngại vật / Dãy kệ & Quầy */}
        {obstacles.map((obstacle, index) =>
          obstacle.kind === "circle" ? (
            <g
              key={obstacle.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "promo");
                if (lm) handleLandmarkTeleport(lm);
              }}
            >
              <circle cx={obstacle.x} cy={obstacle.z} r={obstacle.radius} fill="#a16207" stroke="#facc15" strokeWidth={0.06} />
              <text x={obstacle.x} y={obstacle.z + 0.1} textAnchor="middle" fill="#fef08a" fontSize="0.28" fontWeight="bold">Ụ SALE</text>
            </g>
          ) : (
            <g key={obstacle.id}>
              <rect
                x={obstacle.x - obstacle.width / 2}
                y={obstacle.z - obstacle.depth / 2}
                width={obstacle.width}
                height={obstacle.depth}
                rx={0.1}
                fill={
                  index === 0 ? "#1d4ed8" :
                  index === 1 ? "#ea580c" :
                  index === 2 ? "#7c3aed" :
                  index === 3 ? "#059669" : "#334155"
                }
                stroke="#94a3b8"
                strokeWidth={0.04}
              />
              {index < 4 && (
                <text
                  x={obstacle.x}
                  y={obstacle.z}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="0.28"
                  fontWeight="bold"
                  transform={`rotate(-90 ${obstacle.x} ${obstacle.z})`}
                >
                  {index === 0 ? "KỆ 01: NƯỚC" : index === 1 ? "KỆ 02: SỮA" : index === 2 ? "KỆ 03: BÁNH" : "KỆ 04: GIA VỊ"}
                </text>
              )}
            </g>
          )
        )}

        {/* Tủ đông tường sau */}
        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "freezer");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <rect x="-4.2" y="-6.3" width="8.4" height="0.4" fill="#0369a1" stroke="#38bdf8" strokeWidth={0.04} rx={0.05} />
          <text x="0" y="-6.02" textAnchor="middle" fill="#bae6fd" fontSize="0.25" fontWeight="bold">❄ TỦ ĐÔNG LẠNH</text>
        </g>

        {/* Quầy Self-checkout */}
        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "checkout");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <text x="0" y="-4.9" textAnchor="middle" fill="#6ee7b7" fontSize="0.32" fontWeight="bold">
            💳 SELF-CHECKOUT 04
          </text>
        </g>

        {/* Lối vào */}
        <g
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const lm = FAST_TRAVEL_LANDMARKS.find((l) => l.id === "entrance");
            if (lm) handleLandmarkTeleport(lm);
          }}
        >
          <text x="0" y="5.6" textAnchor="middle" fill="#94a3b8" fontSize="0.34" fontWeight="bold">
            🚪 LỐI VÀO
          </text>
        </g>

        {/* Đường đi nét đứt khi dẫn đường */}
        {path.length > 1 && (
          <polyline
            aria-label="Đường đi đến kệ"
            points={path.map((point) => `${point.x},${point.z}`).join(" ")}
            fill="none"
            stroke="#fde047"
            strokeWidth={0.1}
            strokeLinejoin="round"
            strokeDasharray="0.22 0.14"
          />
        )}

        {/* Các chấm sản phẩm 3D */}
        {MOCK_PRODUCTS.filter((product) => product.has3D && product.shelfLocation).map((product) => {
          const [x, , z] = product.shelfLocation!.worldPos;
          const active = selected?.id === product.id;
          return (
            <g
              key={product.id}
              role="button"
              tabIndex={0}
              aria-label={`Dẫn đường đến ${product.name}`}
              className="cursor-pointer outline-none focus:opacity-60"
              onClick={() => chooseProduct(product)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  chooseProduct(product);
                }
              }}
            >
              <title>{product.name}</title>
              <circle cx={x} cy={z} r={0.43} fill="transparent" />
              <circle
                cx={x}
                cy={z}
                r={active ? 0.25 : 0.17}
                fill={active ? "#fde047" : "#f8fafc"}
                stroke={active ? "#fef9c3" : "#475569"}
                strokeWidth={0.06}
                aria-label={active ? "Vị trí sản phẩm đang dẫn đường" : undefined}
              />
            </g>
          );
        })}

        {/* Vị trí và nón nhìn của người chơi */}
        <g
          aria-label="Vị trí của bạn"
          transform={`translate(${player.x} ${player.z}) rotate(${(heading * 180) / Math.PI})`}
        >
          <circle r={0.36} fill="#22d3ee" fillOpacity={0.25} />
          <path
            d="M 0 -0.42 L 0.26 0.26 L 0 0.14 L -0.26 0.26 Z"
            fill="#67e8f9"
            stroke="#ecfeff"
            strokeWidth={0.04}
          />
        </g>
      </svg>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>Mũi tên xanh: bạn · Chấm vàng: đích</span>
        <span className="text-amber-300 font-bold">⚡ Click địa điểm để bay nhanh</span>
      </div>
    </section>
  );
};
