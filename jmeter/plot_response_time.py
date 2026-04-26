import csv
import glob
import os
from statistics import mean

try:
    import matplotlib.pyplot as plt
except Exception:
    plt = None


def extract_concurrency(path):
    base = os.path.basename(path)
    stem, _ = os.path.splitext(base)
    return int(stem)


def average_response_time_ms(jtl_path):
    response_times = []
    with open(jtl_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 2:
                continue
            # JTL column order used here: timestamp, elapsed, label, code, success, ...
            try:
                response_times.append(float(row[1]))
            except ValueError:
                continue
    if not response_times:
        raise ValueError(f"No valid response-time rows found in {jtl_path}")
    return mean(response_times)


def main():
    jtl_files = sorted(glob.glob("jmeter/*.jtl"), key=extract_concurrency)
    if not jtl_files:
        raise FileNotFoundError("No .jtl files found in jmeter/")

    x_concurrency = []
    y_avg_response = []

    for jtl_file in jtl_files:
        concurrency = extract_concurrency(jtl_file)
        avg_rt = average_response_time_ms(jtl_file)
        x_concurrency.append(concurrency)
        y_avg_response.append(avg_rt)

    if plt is not None:
        plt.figure(figsize=(8, 5))
        plt.plot(x_concurrency, y_avg_response, marker="o", linewidth=2)
        plt.title("Average Response Time vs Concurrency")
        plt.xlabel("Concurrency (users)")
        plt.ylabel("Average Response Time (ms)")
        plt.grid(True, linestyle="--", alpha=0.4)

        for x, y in zip(x_concurrency, y_avg_response):
            plt.annotate(f"{y:.1f}", (x, y), textcoords="offset points", xytext=(0, 8), ha="center")

        out_path = "jmeter/avg_response_vs_concurrency.png"
        plt.tight_layout()
        plt.savefig(out_path, dpi=180)
        print(f"Saved graph: {out_path}")
        return

    # Fallback: generate an SVG chart with no external dependencies.
    width, height = 900, 540
    left, right, top, bottom = 90, 40, 50, 70
    plot_w = width - left - right
    plot_h = height - top - bottom

    min_x, max_x = min(x_concurrency), max(x_concurrency)
    min_y, max_y = 0.0, max(y_avg_response) * 1.1
    if max_y == 0:
        max_y = 1.0

    def sx(v):
        return left + (v - min_x) * plot_w / (max_x - min_x)

    def sy(v):
        return top + plot_h - (v - min_y) * plot_h / (max_y - min_y)

    points = " ".join(f"{sx(x):.1f},{sy(y):.1f}" for x, y in zip(x_concurrency, y_avg_response))

    y_ticks = 6
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="white"/>',
        f'<text x="{width/2}" y="28" text-anchor="middle" font-size="20" font-family="Arial">Average Response Time vs Concurrency</text>',
        f'<line x1="{left}" y1="{top+plot_h}" x2="{left+plot_w}" y2="{top+plot_h}" stroke="#222"/>',
        f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top+plot_h}" stroke="#222"/>',
    ]

    for i in range(y_ticks + 1):
        yv = min_y + (max_y - min_y) * i / y_ticks
        yp = sy(yv)
        lines.append(f'<line x1="{left}" y1="{yp:.1f}" x2="{left+plot_w}" y2="{yp:.1f}" stroke="#e5e7eb"/>')
        lines.append(f'<text x="{left-12}" y="{yp+4:.1f}" text-anchor="end" font-size="11" font-family="Arial">{yv:.0f}</text>')

    for xv in x_concurrency:
        xp = sx(xv)
        lines.append(f'<line x1="{xp:.1f}" y1="{top}" x2="{xp:.1f}" y2="{top+plot_h}" stroke="#f0f0f0"/>')
        lines.append(f'<text x="{xp:.1f}" y="{top+plot_h+22}" text-anchor="middle" font-size="12" font-family="Arial">{xv}</text>')

    lines.append(f'<polyline fill="none" stroke="#2563eb" stroke-width="2.5" points="{points}"/>')
    for x, y in zip(x_concurrency, y_avg_response):
        xp, yp = sx(x), sy(y)
        lines.append(f'<circle cx="{xp:.1f}" cy="{yp:.1f}" r="4" fill="#1d4ed8"/>')
        lines.append(f'<text x="{xp:.1f}" y="{yp-10:.1f}" text-anchor="middle" font-size="11" font-family="Arial">{y:.1f}</text>')

    lines.append(f'<text x="{left + plot_w/2}" y="{height-18}" text-anchor="middle" font-size="13" font-family="Arial">Concurrency (users)</text>')
    lines.append(
        f'<text x="22" y="{top + plot_h/2}" transform="rotate(-90 22 {top + plot_h/2})" text-anchor="middle" font-size="13" font-family="Arial">Average Response Time (ms)</text>'
    )
    lines.append('</svg>')

    out_path = "jmeter/avg_response_vs_concurrency.svg"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Matplotlib not available. Saved graph: {out_path}")


if __name__ == "__main__":
    main()
