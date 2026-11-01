import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { fetchMe, logout } from "../features/auth/authSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) dispatch(fetchMe());
  }, [dispatch, isAuthenticated, user]);

  // The API client fires this event when the refresh token is no longer valid.
  useEffect(() => {
    const onLogout = () => dispatch(logout());
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-indigo-600">
          TaskFlow
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{user?.username}</span>
            <button className="btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
