const NotificationBar = () => {
  return (
    <div className="sticky top-0 z-50 border-b bg-forum-green/10 px-4 py-2 text-center">
      <p className="animate-pulse text-sm font-medium tracking-wide text-forum-green">
        📩 NEW MESSAGE: FREE SHIPPING on orders over $100{" "}
        <span className="cursor-pointer underline">[Click Here]</span>
      </p>
    </div>
  );
};

export default NotificationBar;
