let audioContext: AudioContext | null = null;

/** Called only from the Add button's user gesture; audio failure never interrupts shopping. */
export function playCartSound(): void {
  try {
    if (typeof window === "undefined" || !window.AudioContext) return;
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new window.AudioContext();
    }
    const context = audioContext;
    const play = () => {
      try {
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1320, now + 0.07);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.23);
      } catch { /* Sound is optional when the browser denies audio. */ }
    };
    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch { /* No AudioContext support: keep the cart flow working. */ }
}

/** Âm thanh quét mã vạch tít tít chuẩn quầy thu ngân Self-Checkout siêu thị (2.4kHz) */
export function playScannerSound(): void {
  try {
    if (typeof window === "undefined" || !window.AudioContext) return;
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new window.AudioContext();
    }
    const context = audioContext;
    const play = () => {
      try {
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(2400, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.09);
      } catch { /* Sound is optional */ }
    };
    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch { /* No AudioContext support */ }
}
