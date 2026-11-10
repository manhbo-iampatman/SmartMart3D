import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("supermarketAudio - Động cơ âm thanh không gian siêu thị 3D", () => {
  it("trình duyệt không hỗ trợ Web Audio vẫn chạy an toàn, không ném ngoại lệ", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const audio = await import("../utils/supermarketAudio");
    expect(() => audio.setCartMoving(true)).not.toThrow();
    expect(() => audio.setCartMoving(false)).not.toThrow();
    expect(() => audio.updateFreezerHum(0, 0)).not.toThrow();
    expect(() => audio.playCartDropClack()).not.toThrow();
    expect(() => audio.playTeleportWhoosh()).not.toThrow();
    expect(() => audio.playLaserBeepSound()).not.toThrow();
    expect(() => audio.playReceiptPrintSound()).not.toThrow();
    expect(() => audio.playPaymentSuccessFanfare()).not.toThrow();
    expect(() => audio.updateAudioMuteState(true)).not.toThrow();
    expect(() => audio.stopAllSupermarketSounds()).not.toThrow();
  });

  it("khởi tạo và điều khiển tiếng bánh xe đẩy lăn (cart rolling) bằng bộ lọc lowpass", async () => {
    const oscillator = {
      type: "",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const filter = {
      type: "",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const masterGain = {
      gain: { setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(),
    };

    let gainCount = 0;
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 2;
        destination = {};
        createOscillator = () => oscillator;
        createBiquadFilter = () => filter;
        createGain = () => {
          gainCount++;
          return gainCount === 1 ? masterGain : gain;
        };
      }
    );

    const audio = await import("../utils/supermarketAudio");
    audio.setCartMoving(true);

    expect(oscillator.start).toHaveBeenCalledWith(2);
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(220, 2);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.045, 2.15);

    // Dừng di chuyển -> hạ âm lượng về 0
    audio.setCartMoving(false);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, 2.2);
  });

  it("điều biến âm lượng tủ đông tường Bắc (freezer hum) khi lại gần & cache mức âm lượng", async () => {
    const oscillator = {
      type: "",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
    };
    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const masterGain = {
      gain: { setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(),
    };

    let gainCount = 0;
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 5;
        destination = {};
        createOscillator = () => oscillator;
        createGain = () => {
          gainCount++;
          return gainCount === 1 ? masterGain : gain;
        };
      }
    );

    const audio = await import("../utils/supermarketAudio");

    // Đứng ở lối vào z = 4.5m (quá xa tường Bắc Z = -26.2m) -> âm lượng 0.0001
    audio.updateFreezerHum(0, 4.5);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 5);

    // Tiến lại gần dãy tủ đông tường Bắc (-10.3, -24.5) (cách 1.7m < 6.5m) -> âm lượng tăng
    audio.updateFreezerHum(-10.3, -24.5);
    expect(gain.gain.setTargetAtTime).toHaveBeenCalledTimes(1);

    // Gọi lại cùng vị trí phải hit cache (không spam cancelScheduledValues / setTargetAtTime)
    audio.updateFreezerHum(-10.3, -24.5);
    expect(gain.gain.setTargetAtTime).toHaveBeenCalledTimes(1);
  });

  it("phát tiếng gõ kim loại va chạm (cart drop clack) khi bỏ hàng vào xe", async () => {
    const oscList: Array<{
      type: string;
      frequency: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> };
      connect: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }> = [];

    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const masterGain = {
      gain: { setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(),
    };

    let gainCount = 0;
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 10;
        destination = {};
        createOscillator = () => {
          const osc = {
            type: "",
            frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          };
          oscList.push(osc);
          return osc;
        };
        createGain = () => {
          gainCount++;
          return gainCount === 1 ? masterGain : gain;
        };
      }
    );

    const audio = await import("../utils/supermarketAudio");
    audio.playCartDropClack();

    expect(oscList.length).toBe(2);
    expect(oscList[0].start).toHaveBeenCalledWith(10);
    expect(oscList[1].start).toHaveBeenCalledWith(10);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.14, 10.005);
  });

  it("phát tiếng vút camera (teleport whoosh) khi kích hoạt dịch chuyển nhanh", async () => {
    const oscillator = {
      type: "",
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const filter = {
      type: "",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const masterGain = {
      gain: { setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(),
    };

    let gainCount = 0;
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 1;
        destination = {};
        createOscillator = () => oscillator;
        createBiquadFilter = () => filter;
        createGain = () => {
          gainCount++;
          return gainCount === 1 ? masterGain : gain;
        };
      }
    );

    const audio = await import("../utils/supermarketAudio");
    audio.playTeleportWhoosh();

    expect(oscillator.start).toHaveBeenCalledWith(1);
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(600, 1);
  });

  it("hỗ trợ bật tắt mute toàn hệ thống (updateAudioMuteState)", async () => {
    const masterGain = {
      gain: { setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(),
    };

    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 3;
        destination = {};
        createGain = () => masterGain;
      }
    );

    const audio = await import("../utils/supermarketAudio");
    audio.updateAudioMuteState(true);
    expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 3);

    audio.updateAudioMuteState(false);
    expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(1.0, 3);
  });

  it("phát các âm thanh quét mã, in biên lai và hợp âm thanh toán tại Kiosk 04 (Sprint 3)", async () => {
    const oscillator = {
      type: "",
      frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const filter = {
      type: "",
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const masterGain = {
      gain: { setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(),
    };

    let gainCount = 0;
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 1.5;
        destination = {};
        createOscillator = () => oscillator;
        createBiquadFilter = () => filter;
        createGain = () => {
          gainCount++;
          return gainCount === 1 ? masterGain : gain;
        };
      }
    );

    const audio = await import("../utils/supermarketAudio");
    audio.playLaserBeepSound();
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(2400, 1.5);

    audio.playReceiptPrintSound();
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 1.5);

    audio.playPaymentSuccessFanfare();
    expect(oscillator.start).toHaveBeenCalled();
  });
});

