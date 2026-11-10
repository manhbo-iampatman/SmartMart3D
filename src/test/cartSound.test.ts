import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("Âm báo thêm giỏ", () => {
  it("trình duyệt không có Web Audio vẫn không gây lỗi", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const { playCartSound } = await import("../utils/cartSound");
    expect(() => playCartSound()).not.toThrow();
  });

  it("phát tiếng ting ngắn và giải phóng oscillator sau khi phát", async () => {
    const oscillator = {
      type: "", frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(),
      onended: null as (() => void) | null,
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(), disconnect: vi.fn(),
    };
    vi.stubGlobal("AudioContext", class {
      state = "running";
      currentTime = 1;
      destination = {};
      createOscillator = () => oscillator;
      createGain = () => gain;
    });
    const { playCartSound } = await import("../utils/cartSound");
    playCartSound();
    expect(oscillator.start).toHaveBeenCalledWith(1);
    expect(oscillator.stop).toHaveBeenCalledWith(1.23);
    oscillator.onended?.();
    expect(oscillator.disconnect).toHaveBeenCalledOnce();
    expect(gain.disconnect).toHaveBeenCalledOnce();
  });

  it("quyền âm thanh bị từ chối không tạo unhandled rejection", async () => {
    const createOscillator = vi.fn();
    vi.stubGlobal("AudioContext", class {
      state = "suspended";
      resume = () => Promise.reject(new Error("Audio blocked"));
      createOscillator = createOscillator;
    });
    const { playCartSound } = await import("../utils/cartSound");
    playCartSound();
    await Promise.resolve();
    await Promise.resolve();
    expect(createOscillator).not.toHaveBeenCalled();
  });
});
