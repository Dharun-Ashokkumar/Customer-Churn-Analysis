export default function Header() {
  return (
    <header className="bg-white shadow px-8 py-4 flex justify-between items-center">
      <h2 className="text-lg font-semibold"> Food Churn Prediction</h2>

      <button className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition">
        Export
      </button>
    </header>
  );
}
