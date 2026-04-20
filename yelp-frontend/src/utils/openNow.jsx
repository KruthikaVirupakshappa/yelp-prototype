function parseMinutes(timeStr) {
  const m = timeStr.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2] || "0");
  if (m[3] === "pm" && h !== 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  return h * 60 + min;
}

// Returns true (open), false (closed), or null (unknown/unparseable)
export function isOpenNow(hoursStr) {
  if (!hoursStr) return null;
  const lower = hoursStr.toLowerCase();
  const match = lower.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[-–—]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/
  );
  if (!match) return null;
  const open = parseMinutes(match[1]);
  const close = parseMinutes(match[2]);
  if (open === null || close === null) return null;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return close < open ? cur >= open || cur < close : cur >= open && cur < close;
}

export function OpenNowBadge({ hours, style = {} }) {
  const status = isOpenNow(hours);
  if (status === null) return null;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: status ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.09)",
      color: status ? "#15803d" : "#dc2626",
      ...style,
    }}>
      {status ? "Open Now" : "Closed"}
    </span>
  );
}
