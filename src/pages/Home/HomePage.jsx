import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

export default function HomePage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Search..." />
        <Button>Search</Button>
      </div>
      <p className="text-muted-foreground">Trang mẫu đã được chuyển hoàn toàn sang src/.</p>
    </div>
  );
}


