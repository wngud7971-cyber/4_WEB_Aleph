"use client";

export default function ConfirmButton({ message, className, children, ...props }) {
  return (
    <button
      {...props}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
