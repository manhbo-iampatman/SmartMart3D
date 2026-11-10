import { beforeEach, describe, expect, it } from "vitest";
import { ENTRANCE } from "../data/storeLayout";
import { useNavigationStore } from "../stores/useNavigationStore";
import { isWalkableSegment } from "../utils/pathfinding";

beforeEach(() => useNavigationStore.setState(useNavigationStore.getInitialState(), true));

describe("Vòng đời dẫn đường", () => {
  it("tạo đường đi từ vị trí hiện tại, không luôn bắt đầu từ cửa vào", () => {
    const player = { x: -1.4, z: 2.4 };
    useNavigationStore.getState().updatePose(player, 1);
    useNavigationStore.getState().setDestination({ x: -1.3, z: -1.8 });
    const state = useNavigationStore.getState();
    expect(state.path[0]).toEqual(player);
    expect(state.status).toBe("navigating");
    expect(state.distance).toBeGreaterThan(0);
  });

  it("tính lại lối đi khi người chơi rời tuyến cũ", () => {
    useNavigationStore.getState().setDestination({ x: -1.3, z: -1.8 });
    const player = { x: 1.4, z: 2 };
    useNavigationStore.getState().updatePose(player, 0);
    const path = useNavigationStore.getState().path;
    expect(path[0]).toEqual(player);
    path.slice(1).forEach((point, index) => expect(isWalkableSegment(path[index], point)).toBe(true));
  });

  it("đến đích dừng tự đi; đi xa lại hiển thị đường mới", () => {
    const destination = { x: -1.3, z: -1.8 };
    useNavigationStore.getState().setDestination(destination);
    useNavigationStore.getState().setAutoWalking(true);
    useNavigationStore.getState().updatePose(destination, 0);
    expect(useNavigationStore.getState()).toMatchObject({ status: "arrived", autoWalking: false, distance: 0 });
    useNavigationStore.getState().updatePose(ENTRANCE, 0);
    expect(useNavigationStore.getState().status).toBe("navigating");
  });

  it("không thể tự đi tới đích bị chặn và không báo đã đến chỉ vì đứng gần vật cản", () => {
    useNavigationStore.getState().setDestination({ x: 0, z: 0.15 });
    useNavigationStore.getState().setAutoWalking(true);
    expect(useNavigationStore.getState()).toMatchObject({ status: "unreachable", path: [], autoWalking: false, distance: null });
  });

  it("hủy dẫn đường xóa cả tuyến đi và trạng thái tự di chuyển", () => {
    useNavigationStore.getState().setDestination({ x: -1.3, z: -1.8 });
    useNavigationStore.getState().setAutoWalking(true);
    useNavigationStore.getState().setDestination(null);
    expect(useNavigationStore.getState()).toMatchObject({ status: "idle", destination: null, path: [], autoWalking: false });
  });
});
