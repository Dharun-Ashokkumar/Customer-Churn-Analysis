import { useNavigate } from "react-router-dom";

export default function Header() {

  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";

  const logout = () => {

    localStorage.removeItem("auth");
    localStorage.removeItem("username");

    navigate("/login");

  };

  return (

    <header className="flex justify-between items-center bg-white shadow px-8 py-4">

      {/* LEFT */}
      <h2 className="text-lg font-semibold">
        Food Churn Analytics Dashboard
      </h2>

      {/* RIGHT USER INFO */}
      <div className="flex items-center gap-4">

        <div className="text-gray-600">
          👋 Welcome, <span className="font-semibold">{username}</span>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>

      </div>

    </header>
  );
}