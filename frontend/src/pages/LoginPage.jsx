import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation } from "react-router-dom";

import { login } from "../features/auth/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ username: "", password: "" });

  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Log in to TaskFlow</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm">
          Username
          <input className="input mt-1" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" className="input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button type="submit" className="btn w-full" disabled={status === "loading"}>
          {status === "loading" ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        No account? <Link to="/register" className="text-indigo-600">Sign up</Link>
      </p>
    </div>
  );
}
