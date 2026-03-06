import { Link } from "react-router-dom";

const NotificationBar = () => {
  return (
    <div className="sticky top-0 z-50 flex h-10 items-center justify-center border-b border-primary bg-primary px-4 text-center">
      <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.24em] text-primary-foreground">
        Embrace Jester // Free U.S. Shipping On Orders Over $100{" "}
        <Link
          to="/shipping"
          className="border border-primary-foreground px-1.5 py-0.5 text-primary-foreground transition-colors hover:bg-background hover:text-primary"
        >
          [Shipping Policy]
        </Link>
      </p>
    </div>
  );
};

export default NotificationBar;
