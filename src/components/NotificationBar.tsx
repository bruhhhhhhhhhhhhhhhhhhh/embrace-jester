import { Link } from "react-router-dom";

const NotificationBar = () => {
  return (
    <div className="sticky top-0 z-50 border-b bg-card px-4 py-2.5 text-center">
      <p className="text-sm font-medium tracking-widest uppercase text-forum-green">
        FREE STANDARD SHIPPING ON ORDERS OVER $100{" "}
        <Link to="/shipping" className="underline">
          [Details]
        </Link>
      </p>
    </div>
  );
};

export default NotificationBar;
