const NotificationBar = () => {
  return (
    <div className="sticky top-0 z-50 border-b bg-forum-green/10 px-4 py-2.5 text-center">
      <p className="text-sm font-medium tracking-widest uppercase text-forum-green">
        FREE STANDARD SHIPPING ON ORDERS OVER $100{" "}
        <span className="cursor-pointer underline">[Details]</span>
      </p>
    </div>
  );
};

export default NotificationBar;
