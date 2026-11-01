import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";

import { register } from "../features/auth/authSlice";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { isAuthenticated, status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Create your account</h1>
      <form onSubmit={(e) => { e.preventDefault(); dispatch(register(form)); }} className="space-y-3">
        <label className="block text-sm">
          Username
          <input name="username" className="input mt-1" value={form.username} onChange={update} required />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" className="input mt-1" value={form.email} onChange={update} required />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" className="input mt-1" value={form.password} onChange={update} required minLength={8} />
        </label>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button type="submit" className="btn w-full" disabled={status === "loading"}>
          Sign up
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link to="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}
