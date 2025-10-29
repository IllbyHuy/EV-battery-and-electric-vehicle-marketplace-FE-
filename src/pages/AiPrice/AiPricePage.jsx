import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export default function AiPricePage() {
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState(0);
  const [condition, setCondition] = useState("Good");
  const [estimate, setEstimate] = useState(null);

  const runEstimate = () => {
    const base = model.toLowerCase().includes("tesla")
      ? 40000
      : model
        ? 25000
        : 20000;
    const mileageAdj = Math.max(0, 1 - mileage / 200000);
    const condMult =
      condition === "Excellent"
        ? 1.08
        : condition === "Good"
          ? 1.0
          : condition === "Fair"
            ? 0.86
            : 0.7;
    const est = Math.round((base * mileageAdj * condMult) / 100) * 100;
    setEstimate(est);
  };

  return (
    <div className="obys-hero min-h-screen py-16">
      <div className="container max-w-3xl">
        <div className="obys-card p-6">
          <h1 className="text-2xl font-semibold text-white mb-3">
            AI Price Suggestion
          </h1>
          <p className="text-white/80 mb-4">
            A demo UI that estimates price from basic inputs (client-side mock).
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Model (e.g. Tesla Model 3)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <Input
              placeholder="Mileage"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value))}
            />
            <div>
              <label className="block text-sm text-white/80">Condition</label>
              <select
                className="w-full border p-2 rounded mt-1 bg-transparent text-white/90"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={runEstimate}>Estimate</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setModel("");
                  setMileage(0);
                  setCondition("Good");
                  setEstimate(null);
                }}
              >
                Reset
              </Button>
            </div>

            <div className="pt-4">
              {estimate == null ? (
                <div className="text-white/80">No estimate yet</div>
              ) : (
                <div className="text-white">
                  <div className="text-3xl font-bold">
                    {estimate.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </div>
                  <div className="text-white/80">
                    Model: {model || "—"} — Mileage: {mileage} — Condition:{" "}
                    {condition}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
