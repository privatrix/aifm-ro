import "./admin.css";
import Shell from "./_components/Shell";

export const metadata = {
  title: "AI FM Admin",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <Shell>{children}</Shell>
    </div>
  );
}
