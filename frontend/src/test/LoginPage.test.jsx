import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import api from "../api/client";
import { makeStore } from "../app/store";
import LoginPage from "../pages/LoginPage";

const renderPage = (store = makeStore()) =>
  render(
    <Provider store={store}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>
    </Provider>
  );

describe("LoginPage", () => {
  it("logs the user in and stores the JWT tokens", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { access: "acc", refresh: "ref" } });
    vi.spyOn(api, "get").mockResolvedValue({ data: { id: 1, username: "shazia" } });
    const store = makeStore();
    renderPage(store);

    await userEvent.type(screen.getByLabelText(/username/i), "shazia");
    await userEvent.type(screen.getByLabelText(/password/i), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(post).toHaveBeenCalledWith("/auth/login/", { username: "shazia", password: "secret123" });
    await vi.waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect(localStorage.getItem("taskflow.access")).toBe("acc");
    vi.restoreAllMocks();
  });

  it("shows the API error message on bad credentials", async () => {
    vi.spyOn(api, "post").mockRejectedValue({
      response: { data: { detail: "No active account found with the given credentials" } },
    });
    renderPage();

    await userEvent.type(screen.getByLabelText(/username/i), "x");
    await userEvent.type(screen.getByLabelText(/password/i), "y");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no active account/i);
    vi.restoreAllMocks();
  });
});
