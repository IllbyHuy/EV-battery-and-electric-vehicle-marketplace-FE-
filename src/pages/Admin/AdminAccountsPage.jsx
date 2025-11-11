import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/userApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

export default function AdminAccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllUsers();
      if (res?.isSuccess && Array.isArray(res.result)) {
        setUsers(res.result);
      } else {
        setError(res?.errorMessage || "Không thể tải danh sách người dùng");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = (imgs) => {
    if (!imgs) return "/placeholder.svg";
    if (Array.isArray(imgs)) return imgs[0] || "/placeholder.svg";
    const first = String(imgs).split(",").map(s => s.trim()).filter(Boolean)[0];
    return first || "/placeholder.svg";
  };

  // Chỉ hiển thị tài khoản có vai trò "User", kèm tìm kiếm
  const filtered = users
    .filter((u) => (u.role || "").toLowerCase() === "user")
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.fullName || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Tài khoản</h1>
          <p className="text-sm text-muted-foreground mt-1">Xem và quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <Button onClick={fetchUsers} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tìm kiếm</CardTitle>
          <CardDescription>Lọc theo tên, email, họ tên hoặc vai trò</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nhập từ khóa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Đang tải...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Không có người dùng phù hợp</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">Avatar</th>
                      <th className="text-left p-3 text-sm font-semibold">Username</th>
                      <th className="text-left p-3 text-sm font-semibold">Email</th>
                      {/* <th className="text-left p-3 text-sm font-semibold">Họ tên</th> */}
                      <th className="text-left p-3 text-sm font-semibold">Địa chỉ</th>
                      <th className="text-left p-3 text-sm font-semibold">SĐT</th>
                      <th className="text-center p-3 text-sm font-semibold">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <img
                            src={getAvatar(u.imgs)}
                            alt={u.username || "user"}
                            className="w-10 h-10 rounded-full object-cover border"
                            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                          />
                        </td>
                        <td className="p-3 text-sm font-medium">{u.username || "—"}</td>
                        <td className="p-3 text-sm">{u.email || "—"}</td>
                        {/* <td className="p-3 text-sm">{u.fullName || "—"}</td> */}
                        <td className="p-3 text-sm">{u.address || "—"}</td>
                        <td className="p-3 text-sm">{u.phoneNumber || "—"}</td>
                        <td className="p-3 text-sm text-center">
                          <Badge variant="secondary">{u.role || "—"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
