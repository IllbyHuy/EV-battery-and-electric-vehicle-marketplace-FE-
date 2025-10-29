import Button from "../Button/Button";
import { Link } from "react-router-dom";

export default function Placeholder({ title, description }) {
  return (
    <div className="container py-14">
      <div className="mx-auto max-w-3xl rounded-lg border obys-card">
        <div className="px-4 pt-4">
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/80">{description}</p>
        </div>
        <div className="px-4 pb-4 space-y-4 text-white/90">
          <p className="text-sm text-muted-foreground">
            Trang này là placeholder. Hãy mô tả yêu cầu và tôi sẽ triển khai chi
            tiết.
          </p>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
            <Link to="/ai-price">
              <Button>Try AI Pricing</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
