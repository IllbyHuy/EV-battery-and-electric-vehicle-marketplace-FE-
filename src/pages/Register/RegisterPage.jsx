import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

export default function RegisterPage() {
  return (
    <div className="container py-14 max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Register</h1>
      <div className="space-y-3">
        <Input placeholder="Email" type="email" />
        <Input placeholder="Password" type="password" />
        <Input placeholder="Confirm password" type="password" />
        <Button className="w-full">Sign up</Button>
      </div>
    </div>
  );
}


