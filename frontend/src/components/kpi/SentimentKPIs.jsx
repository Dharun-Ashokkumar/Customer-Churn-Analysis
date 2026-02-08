export default function SentimentKPIs({ data }) {
  if (!data) return null;

  const cards = [
    { title: "Total Feedback", value: data.totalFeedback },
    { title: "Positive", value: `${data.positive}%` },
    { title: "Neutral", value: `${data.neutral}%` },
    { title: "Negative", value: `${data.negative}%` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-md p-6"
        >
          <h4 className="text-gray-500 text-sm font-medium mb-2">
            {item.title}
          </h4>

          <div className="text-3xl font-bold text-gray-900">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
