// App logo + name, used on the auth screens.
export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/icon.svg" alt="" className="size-9" />
      <span
        className="text-base font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Bolero
      </span>
    </div>
  );
}
