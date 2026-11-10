import { useAppStore } from "../stores/useAppStore";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Cart rolling sound nodes
let rollingOscillator: OscillatorNode | null = null;
let rollingGain: GainNode | null = null;
let rollingFilter: BiquadFilterNode | null = null;
let isRolling = false;

// Ambient freezer hum nodes
let freezerOscillator: OscillatorNode | null = null;
let freezerGain: GainNode | null = null;
let isFreezerActive = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) return null;
  if (!audioContext || audioContext.state === "closed") {
    try {
      audioContext = new window.AudioContext();
      masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(checkMuted() ? 0.0001 : 1.0, audioContext.currentTime);
      masterGain.connect(audioContext.destination);
    } catch {
      return null;
    }
  }
  return audioContext;
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(checkMuted() ? 0.0001 : 1.0, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

/** Mở khóa Web Audio Context an toàn trong sự kiện click / keydown của người dùng */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      void ctx.resume().catch(() => {});
    }
  } catch {
    /* Safe ignore */
  }
}

function checkMuted(): boolean {
  try {
    return useAppStore.getState().isAudioMuted;
  } catch {
    return false;
  }
}

/** Cập nhật trạng thái Master Gain dựa trên thiết lập Mute */
export function updateAudioMuteState(muted: boolean): void {
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  try {
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(muted ? 0.0001 : 1.0, now);
  } catch {
    /* Safe ignore */
  }
}

/**
 * 1. Âm thanh xe đẩy lăn bánh trên sàn gạch (Cart Rolling Sound)
 * Giả lập tiếng rào rạo rung lắc trầm ấm của bánh xe cao su cọ xát với gạch sàn
 */
export function setCartMoving(moving: boolean): void {
  if (checkMuted()) {
    stopCartRolling();
    return;
  }
  if (moving) {
    startCartRolling();
  } else {
    stopCartRolling();
  }
}

function startCartRolling(): void {
  if (isRolling) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const init = () => {
    try {
      const now = ctx.currentTime;
      if (!rollingOscillator) {
        // Dao động tần số thấp (rumble) 75Hz - 95Hz giả lập độ rung bánh xe
        rollingOscillator = ctx.createOscillator();
        rollingOscillator.type = "sawtooth";
        rollingOscillator.frequency.setValueAtTime(82, now);

        // Bộ lọc dải thấp làm mềm âm thanh, nghe như tiếng bánh xe lăn thật
        rollingFilter = ctx.createBiquadFilter();
        rollingFilter.type = "lowpass";
        rollingFilter.frequency.setValueAtTime(220, now);

        rollingGain = ctx.createGain();
        rollingGain.gain.setValueAtTime(0.0001, now);
        rollingGain.gain.linearRampToValueAtTime(0.045, now + 0.15);

        rollingOscillator.connect(rollingFilter);
        rollingFilter.connect(rollingGain);
        rollingGain.connect(getMasterGain(ctx));

        rollingOscillator.start(now);
        isRolling = true;
      } else if (rollingGain) {
        rollingGain.gain.cancelScheduledValues(now);
        rollingGain.gain.linearRampToValueAtTime(0.045, now + 0.15);
        isRolling = true;
      }
    } catch {
      isRolling = false;
    }
  };

  if (ctx.state === "suspended") {
    // Chờ tương tác gesture mở khóa AudioContext, tránh lặp promise từ useFrame
    return;
  }
  init();
}

function stopCartRolling(): void {
  if (!isRolling || !rollingGain || !audioContext) return;
  try {
    const now = audioContext.currentTime;
    rollingGain.gain.cancelScheduledValues(now);
    rollingGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
    isRolling = false;
  } catch {
    isRolling = false;
  }
}

/**
 * 2. Âm thanh không gian của tủ đông lạnh (Freezer Ambient Hum)
 * Điều biến âm lượng tùy thuộc vào khoảng cách của người chơi tới bức tường tủ đông (z = -6.1m)
 */
export function updateFreezerHum(playerX: number, playerZ: number): void {
  if (checkMuted()) {
    if (freezerGain && audioContext) {
      freezerGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    }
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  // Tủ đông đặt tại z = -6.1m, trải dài x từ -4 đến +4
  // Khoảng cách tới bức tường tủ đông
  const distanceToFreezer = Math.abs(playerZ - (-6.1));
  const maxAudibleDistance = 5.5; // Bắt đầu nghe thấy từ 5.5m trở lại

  let targetVolume = 0.0001;
  if (distanceToFreezer < maxAudibleDistance) {
    const proximity = 1 - distanceToFreezer / maxAudibleDistance;
    targetVolume = Math.min(0.04, proximity * 0.04);
  }

  const initFreezer = () => {
    try {
      const now = ctx.currentTime;
      if (!freezerOscillator) {
        // Tần số 60Hz hum điện lưới và block máy nén làm lạnh
        freezerOscillator = ctx.createOscillator();
        freezerOscillator.type = "sine";
        freezerOscillator.frequency.setValueAtTime(58, now);

        freezerGain = ctx.createGain();
        freezerGain.gain.setValueAtTime(targetVolume, now);

        freezerOscillator.connect(freezerGain);
        freezerGain.connect(getMasterGain(ctx));

        freezerOscillator.start(now);
        isFreezerActive = true;
      } else if (freezerGain) {
        freezerGain.gain.cancelScheduledValues(now);
        freezerGain.gain.setTargetAtTime(targetVolume, now, 0.1);
      }
    } catch {
      isFreezerActive = false;
    }
  };

  if (ctx.state === "suspended") {
    // Không cố resume liên tục nếu người dùng chưa tương tác
    return;
  }
  initFreezer();
}

/**
 * 3. Âm thanh va chạm kim loại khi đồ rơi vào xe đẩy (Cart Drop Clack)
 * Giả lập lon nước hoặc gói đồ chạm đáy lưới thép xe đẩy
 */
export function playCartDropClack(): void {
  if (checkMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const play = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Âm gõ kim loại đanh sắc bén 980Hz + hài âm 420Hz
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(980, now);
      osc1.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(420, now);
      osc2.frequency.exponentialRampToValueAtTime(140, now + 0.09);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(getMasterGain(ctx));

      osc1.onended = () => {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      };

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.12);
      osc2.stop(now + 0.12);
    } catch {
      /* Safe ignore */
    }
  };

  if (ctx.state === "suspended") {
    return;
  }
  play();
}

/**
 * 4. Âm thanh dịch chuyển nhanh camera (Fast-Travel Teleport Whoosh)
 * Vút nhẹ từ dải tần số 180Hz lên 520Hz rồi hạ xuống, tạo cảm giác phi thuyền camera lướt tới
 */
export function playTeleportWhoosh(): void {
  if (checkMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const play = () => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.55);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(getMasterGain(ctx));

      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      };

      osc.start(now);
      osc.stop(now + 0.62);
    } catch {
      /* Safe ignore */
    }
  };

  if (ctx.state === "suspended") {
    return;
  }
  play();
}

/**
 * 5. Âm thanh máy quét mã vạch laser (Laser Barcode Beep)
 * Tần số cao 2.4kHz chuẩn máy quét công nghiệp tại quầy Self-Checkout
 */
export function playLaserBeepSound(): void {
  if (checkMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const play = () => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(getMasterGain(ctx));

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      /* Safe ignore */
    }
  };

  if (ctx.state === "suspended") {
    return;
  }
  play();
}

/**
 * 6. Âm thanh in biên lai nhiệt POS (Receipt Printer Slide)
 * Giả lập tiếng rít giấy và bánh răng máy in nhiệt POS khi nhả hóa đơn
 */
export function playReceiptPrintSound(): void {
  if (checkMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const play = () => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.15);
      osc.frequency.linearRampToValueAtTime(380, now + 0.3);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(getMasterGain(ctx));

      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      };

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      /* Safe ignore */
    }
  };

  if (ctx.state === "suspended") {
    return;
  }
  play();
}

/**
 * 7. Âm thanh thanh toán thành công (Payment Success Chime)
 * Hợp âm rạng rỡ Đô trưởng (C Major Chime) báo hiệu hoàn tất đơn hàng
 */
export function playPaymentSuccessFanfare(): void {
  if (checkMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const play = () => {
    try {
      const startTime = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const noteTime = startTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.linearRampToValueAtTime(0.1, noteTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(getMasterGain(ctx));

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        osc.start(noteTime);
        osc.stop(noteTime + 0.48);
      });
    } catch {
      /* Safe ignore */
    }
  };

  if (ctx.state === "suspended") {
    return;
  }
  play();
}

/** Dọn dẹp toàn bộ âm thanh liên tục khi blur hoặc thoát */
export function stopAllSupermarketSounds(): void {
  stopCartRolling();
  if (freezerGain && audioContext) {
    try {
      freezerGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    } catch {
      /* Safe ignore */
    }
  }
}

