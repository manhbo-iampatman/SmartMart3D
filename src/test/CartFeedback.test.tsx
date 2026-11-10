import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CartFeedback } from "../components/shared/CartFeedback";
import { useFeedbackStore } from "../stores/useFeedbackStore";

beforeEach(() => {
  vi.useFakeTimers();
  useFeedbackStore.setState({ notice: null });
});
afterEach(() => vi.useRealTimers());

it("lần thêm mới giữ thông báo đủ thời gian, không bị timer của lần trước xóa sớm", () => {
  render(<CartFeedback />);
  act(() => useFeedbackStore.getState().showCartNotice("Sữa", 1));
  act(() => vi.advanceTimersByTime(2000));
  act(() => useFeedbackStore.getState().showCartNotice("Mì", 1));
  act(() => vi.advanceTimersByTime(1300));
  expect(screen.getByRole("status")).toHaveTextContent("Mì");
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("cho phép đóng thông báo ngay lập tức", () => {
  useFeedbackStore.getState().showCartNotice("Sữa", 1);
  render(<CartFeedback />);
  fireEvent.click(screen.getByRole("button", { name: /đóng thông báo thêm giỏ/i }));
  expect(useFeedbackStore.getState().notice).toBeNull();
});
