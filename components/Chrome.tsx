import Link from "next/link";

export default function Chrome({
  tab,
  score,
  sub,
}: {
  tab: "home" | "progress" | "plan";
  score: number | null;
  sub: string;
}) {
  const tabs: [string, string, string][] = [
    ["/", "home", "Hari ini"],
    ["/progress", "progress", "Progres"],
    ["/plan", "plan", "Rencana 10 minggu"],
  ];
  return (
    <>
      <header className="mast">
        <div className="mast-row">
          <div>
            <span className="eyebrow">TOEFL ITP · Paper-based</span>
            <h1>ITP Drill</h1>
            <span className="sub">{sub}</span>
          </div>
          <div className="scorechip">
            <span className="big">{score ?? "—"}</span>
            <span className="lbl">Estimasi skor</span>
          </div>
        </div>
      </header>
      <nav className="tabs">
        {tabs.map(([href, id, label]) => (
          <Link key={id} href={href} data-on={tab === id ? "1" : "0"}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
