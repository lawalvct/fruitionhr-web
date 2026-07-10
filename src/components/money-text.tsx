export function MoneyText({ kobo }: { kobo: number | null | undefined }) {
  if (kobo == null) return <span>-</span>;

  return (
    <span>
      {new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(kobo / 100)}
    </span>
  );
}
