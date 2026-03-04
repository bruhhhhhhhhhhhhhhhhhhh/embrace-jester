import { Link } from "react-router-dom";

const NotificationBar = () => {
  return (
    <div className="sticky top-0 z-50 border-b border-border bg-[#050505] px-4 py-2.5 text-center">
      <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.24em] text-foreground">
        Embrace Jester // Free U.S. Shipping On Orders Over $100{" "}
        <Link to="/shipping" className="border-b border-foreground text-foreground">
          [Shipping Policy]
        </Link>
      </p>
    </div>
  );
};

export default NotificationBar;
