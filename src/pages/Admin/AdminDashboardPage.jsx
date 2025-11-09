import { useEffect, useState } from "react";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

function SectionCard({ title, children }) {
  return (
    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm w-full">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

const initialRequests = [
  { id: 1, type: "sell-ev", user: "nguyen.van.a@example.com", item: "EV Model X", status: "pending" },
  { id: 2, type: "sell-battery", user: "le.thi.b@example.com", item: "Battery 60kWh", status: "pending" },
];

// accounts functionality moved out of dashboard tabs; admin can manage accounts in /admin/accounts

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("create-battery");
  const [batteryForm, setBatteryForm] = useState({ brand: "", model: "", capacity: "", voltage: "", chemistry: "", imgs: [] });
  const [evForm, setEvForm] = useState({ model: "", battery: "", price: "" });
  const [requests, setRequests] = useState(initialRequests);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  function handleCreateBattery(e) {
    e.preventDefault();
    // Build battery payload following DB entity: Brand, Model, Capacity, Voltage, IsAproved, Chemistry, imgs
    // Prepare payload and files using FormData for file upload
    const fd = new FormData();
    fd.append("Brand", batteryForm.brand);
    fd.append("Model", batteryForm.model);
    fd.append("Capacity", batteryForm.capacity);
    fd.append("Voltage", batteryForm.voltage);
    fd.append("Chemistry", batteryForm.chemistry);
    // Append files
    (batteryForm.imgs || []).forEach((file, idx) => {
      fd.append("imgs", file, file.name);
    });

    // In real app: call API to create battery (adminApi.createBatteryForm(fd))
    setMessage(`Pin "${batteryForm.brand || batteryForm.model || "(không tên)"}" đã được tạo (mock).`);
    // Reset form
    setBatteryForm({ brand: "", model: "", capacity: "", voltage: "", chemistry: "", imgs: [] });
    // Log file names for debugging
    console.log("createBattery FormData fields:", {
      Brand: fd.get("Brand"),
      Model: fd.get("Model"),
      Capacity: fd.get("Capacity"),
      Voltage: fd.get("Voltage"),
      Chemistry: fd.get("Chemistry"),
      imgs: (batteryForm.imgs || []).map((f) => f.name),
    });
  }

  function handleCreateEv(e) {
    e.preventDefault();
    // In real app: call API to create EV
    setMessage(`Xe "${evForm.model || "(không tên)"}" đã được tạo.`);
    setEvForm({ model: "", battery: "", price: "" });
  }

  function handleAcceptRequest(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r)));
  }

  function handleRejectRequest(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
  }

  // account management moved to dedicated admin/accounts page

  return (
    <main className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted mt-1">Quản lý nội dung: tạo pin, tạo xe, duyệt yêu cầu bán và quản lý tài khoản.</p>
        </div>
      </header>

      {message && (
        <div className="p-3 bg-accent text-accent-foreground rounded-md">{message}</div>
      )}

      {/* Tabs */}
        <div className="bg-card p-3 rounded-md">
        <div className="flex gap-2">
          <button
            className={`px-3 py-2 rounded-md text-sm ${activeTab === 'create-battery' ? 'bg-accent text-accent-foreground' : 'text-muted'}`}
            onClick={() => setActiveTab('create-battery')}
          >
            Tạo Pin
          </button>

          <button
            className={`px-3 py-2 rounded-md text-sm ${activeTab === 'create-ev' ? 'bg-accent text-accent-foreground' : 'text-muted'}`}
            onClick={() => setActiveTab('create-ev')}
          >
            Tạo Xe
          </button>

          <button
            className={`px-3 py-2 rounded-md text-sm ${activeTab === 'requests' ? 'bg-accent text-accent-foreground' : 'text-muted'}`}
            onClick={() => setActiveTab('requests')}
          >
            Yêu cầu
          </button>

          {/* accounts tab removed from dashboard tabs; manage via /admin/accounts */}
        </div>
      </div>

      <div>
        {activeTab === 'create-battery' && (
          <SectionCard title="Tạo Pin">
            <form onSubmit={handleCreateBattery} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted">Brand</label>
                  <Input value={batteryForm.brand} onChange={(e) => setBatteryForm((s) => ({ ...s, brand: e.target.value }))} placeholder="VD: Panasonic" />
                </div>

                <div>
                  <label className="block text-sm text-muted">Model</label>
                  <Input value={batteryForm.model} onChange={(e) => setBatteryForm((s) => ({ ...s, model: e.target.value }))} placeholder="VD: NCR18650B" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-muted">Capacity (kWh)</label>
                  <Input value={batteryForm.capacity} onChange={(e) => setBatteryForm((s) => ({ ...s, capacity: e.target.value }))} placeholder="60" />
                </div>
                <div>
                  <label className="block text-sm text-muted">Voltage (V)</label>
                  <Input value={batteryForm.voltage} onChange={(e) => setBatteryForm((s) => ({ ...s, voltage: e.target.value }))} placeholder="400" />
                </div>
                <div>
                  <label className="block text-sm text-muted">Chemistry</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={batteryForm.chemistry} onChange={(e) => setBatteryForm((s) => ({ ...s, chemistry: e.target.value }))}>
                    <option value="">-- Chọn --</option>
                    <option value="Li-ion">Li-ion</option>
                    <option value="LiFePO4">LiFePO4</option>
                    <option value="NMC">NMC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted">Images (upload from local)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setBatteryForm((s) => ({ ...s, imgs: files }));
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />

                {batteryForm.imgs && batteryForm.imgs.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {batteryForm.imgs.map((f, i) => (
                      <div key={i} className="w-24 h-24 bg-white/5 rounded-md overflow-hidden flex items-center justify-center text-xs text-muted">
                        <img src={URL.createObjectURL(f)} alt={f.name} className="object-cover w-full h-full" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit">Tạo pin</Button>
              </div>
            </form>
          </SectionCard>
        )}

        {activeTab === 'create-ev' && (
          <SectionCard title="Tạo Xe Điện">
            <form onSubmit={handleCreateEv} className="space-y-2">
              <label className="block text-sm text-muted">Model</label>
              <Input value={evForm.model} onChange={(e) => setEvForm((s) => ({ ...s, model: e.target.value }))} placeholder="VD: EV Model X" />

              <label className="block text-sm text-muted">Pin (tham chiếu)</label>
              <Input value={evForm.battery} onChange={(e) => setEvForm((s) => ({ ...s, battery: e.target.value }))} placeholder="VD: Battery 60kWh" />

              <label className="block text-sm text-muted">Giá (VNĐ)</label>
              <Input value={evForm.price} onChange={(e) => setEvForm((s) => ({ ...s, price: e.target.value }))} placeholder="500000000" />

              <div className="flex justify-end">
                <Button type="submit">Tạo xe</Button>
              </div>
            </form>
          </SectionCard>
        )}

        {activeTab === 'requests' && (
          <SectionCard title="Yêu cầu đang chờ duyệt">
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-background rounded-md">
                  <div>
                    <div className="text-sm font-medium">{r.item}</div>
                    <div className="text-xs text-muted">{r.user} · {r.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-xs px-2 py-1 rounded ${r.status === 'pending' ? 'bg-yellow-600 text-white' : r.status === 'accepted' ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'}`}>
                      {r.status}
                    </div>
                    {r.status === "pending" && (
                      <>
                        <Button variant="secondary" onClick={() => handleAcceptRequest(r.id)}>Chấp nhận</Button>
                        <Button variant="ghost" onClick={() => handleRejectRequest(r.id)}>Từ chối</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* accounts tab removed from dashboard; manage accounts under /admin/accounts */}
      </div>
    </main>
  );
}


