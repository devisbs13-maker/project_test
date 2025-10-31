import { ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={"mire-btn " + className}
      style={{
        borderRadius: "var(--btn-radius)",
        border: "var(--btn-border)",
        background: "var(--btn-bg)",
        color: "var(--text)",
        padding: "12px 16px",
        boxShadow: "var(--shadow)",
        cursor: "pointer",
        transition: "transform .08s ease, filter .2s ease, box-shadow .2s ease",
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(1px) scale(0.998)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
      }}
    />
  );
}
