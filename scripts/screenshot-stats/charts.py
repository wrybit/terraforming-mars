"""Reads the two line charts of the results page (victory points per generation, global parameters) from a screenshot."""
import sys, json, cv2, numpy as np

COLOR_RANGES = {
    # Hue (OpenCV 0..180), minimum saturation, minimum brightness
    'red': ((0, 8), (172, 180), 120, 80),
    'green': ((45, 80), None, 120, 80),
    'blue': ((100, 125), None, 120, 120),
    'yellow': ((22, 35), None, 120, 120),
    'orange': ((9, 20), None, 140, 150),
    'pink': ((150, 172), None, 60, 150),
}


def color_mask(hsv, color):
    (low, high), extra, min_sat, min_val = COLOR_RANGES[color][0], COLOR_RANGES[color][1], COLOR_RANGES[color][2], COLOR_RANGES[color][3]
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    mask = (hue >= low) & (hue <= high)
    if extra is not None:
        mask |= (hue >= extra[0]) & (hue <= extra[1])
    return mask & (sat >= min_sat) & (val >= min_val)


def longest_run(row, max_gap=25):
    """Longest segment of a grid line; gaps from crossing data lines and points are bridged."""
    xs = np.where(row)[0]
    if len(xs) == 0:
        return 0, 0
    best, start, previous = (xs[0], xs[0]), xs[0], xs[0]
    for x in xs[1:]:
        if x - previous > max_gap:
            start = x
        previous = x
        if previous - start > best[1] - best[0]:
            best = (start, previous)
    return int(best[0]), int(best[1])


def group_rows(rows, gap=1):
    groups = []
    for y in rows:
        if groups and y - groups[-1][-1] <= gap:
            groups[-1].append(int(y))
        else:
            groups.append([int(y)])
    return [round(float(np.mean(group))) for group in groups]


def gridlines(img):
    img = img.astype(int)
    b, g, r = img[..., 0], img[..., 1], img[..., 2]
    gray = (abs(r - g) < 15) & (abs(g - b) < 15) & (r > 85) & (r < 200)
    # Coarse search across the full width, then precisely within each chart's plot area
    lines = group_rows(np.where(gray.mean(axis=1) > 0.15)[0])
    clusters = []
    for y in lines:
        if clusters and y - clusters[-1][-1] < 60:
            clusters[-1].append(y)
        else:
            clusters.append([y])
    result = []
    # Charts have at least six grid lines with clear spacing (table borders etc. drop out)
    for cluster in [c for c in clusters if len(c) >= 6 and np.median(np.diff(c)) >= 8]:
        runs = [longest_run(gray[y]) for y in cluster]
        left = int(np.median([run[0] for run in runs]))
        right = int(np.median([run[1] for run in runs]))
        y_from, y_to = max(0, cluster[0] - 80), min(img.shape[0], cluster[-1] + 80)
        local = gray[y_from:y_to, left:right].mean(axis=1)
        chart_lines = [y + y_from for y in group_rows(np.where(local > 0.5)[0])]
        if len(chart_lines) < 6:
            continue
        # Spacing from the total height instead of the median: on small images rounding errors add up otherwise
        median = float(np.median(np.diff(chart_lines)))
        spacing = (chart_lines[-1] - chart_lines[0]) / max(1, round((chart_lines[-1] - chart_lines[0]) / median))
        # Only evenly spaced lines count (axis labels etc. drop out)
        chart_lines = [y for y in chart_lines if abs(((y - chart_lines[-1]) / spacing) - round((y - chart_lines[-1]) / spacing)) < 0.25]
        # Card lists etc. also have light horizontal lines, but are narrow or have few lines
        if right - left < max(300, 0.2 * img.shape[1]) or len(chart_lines) < 7:
            continue
        result.append({'top': chart_lines[0], 'bottom': chart_lines[-1], 'spacing': spacing, 'left': left, 'right': right, 'lines': len(chart_lines)})
    return result


def series(hsv, chart, colors, generations):
    top = int(chart['top'] - 0.4 * chart['spacing'])
    bottom = int(chart['bottom'] + 0.4 * chart['spacing'])
    masks = {color: color_mask(hsv, color)[top:bottom, chart['left']:chart['right']] for color in colors}
    # First and last generation: outermost colored columns (centers of the edge points, subtract radius)
    combined = np.zeros_like(next(iter(masks.values())))
    for mask in masks.values():
        combined |= mask
    columns = np.where(combined.sum(axis=0) >= 2)[0]
    radius = max(2.0, chart['spacing'] / 6)
    first, last = columns[0] + radius, columns[-1] - radius
    step = (last - first) / max(1, generations - 1)
    out = {}
    for color, mask in masks.items():
        values = []
        for index in range(generations):
            x = round(first + index * step)
            ys = np.where(mask[:, max(0, x - 2):x + 3].any(axis=1))[0]
            values.append(None if len(ys) == 0 else float(np.median(ys)) + top)
        out[color] = values
    return out


def fill_hidden(pixel_series):
    """Hidden points: another line lies on top – so the same value as the nearest visible one."""
    names = list(pixel_series)
    length = len(pixel_series[names[0]])
    for name in names:
        values = pixel_series[name]
        for index in range(length):
            if values[index] is None:
                neighbours = [values[i] for i in (index - 1, index + 1) if 0 <= i < length and values[i] is not None]
                guess = np.mean(neighbours) if neighbours else None
                others = [pixel_series[other][index] for other in names if other != name and pixel_series[other][index] is not None]
                if others:
                    values[index] = min(others, key=lambda y: abs(y - guess)) if guess is not None else others[0]
                else:
                    values[index] = guess
    return pixel_series


def remove_spikes(values, monotonic):
    """Replace single outliers (pixels of another line or a label caught) with the median of the neighbors."""
    cleaned = list(values)
    for index in range(len(values)):
        window = [values[i] for i in (index - 1, index, index + 1) if 0 <= i < len(values) and values[i] is not None]
        if index == 0 and len(values) > 1 and values[0] is not None and values[1] is not None and values[0] > values[1] + 5:
            cleaned[0] = values[1]
        elif 0 < index < len(values) - 1 and len(window) == 3:
            cleaned[index] = sorted(window)[1]
    if monotonic:
        # Global parameters never decrease
        for index in range(1, len(cleaned)):
            cleaned[index] = max(cleaned[index], cleaned[index - 1])
    return cleaned


def extract(path, player_colors, generations, totals):
    img = cv2.imread(path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(int)
    charts = gridlines(img)
    if len(charts) < 2:
        return {'error': f'{len(charts)} Diagramme gefunden'}
    points_chart, globals_chart = charts[0], charts[1]
    # Victory points: grid lines every 10 points; zero line determined from the known final scores
    pixels = fill_hidden(series(hsv, points_chart, list(player_colors.values()), generations))
    per_point = points_chart['spacing'] / 10
    offsets = [pixels[color][-1] + totals[name] * per_point for name, color in player_colors.items() if pixels[color][-1] is not None]
    zero = float(np.median(offsets))
    points = {name: [None if y is None else round((zero - y) / per_point) for y in pixels[color]] for name, color in player_colors.items()}
    # Global parameters: 0–100 %, at the end all are maxed – topmost end point = 100 %
    global_colors = {'temperature': 'red', 'oxygen': 'green', 'oceans': 'blue'}
    gpixels = fill_hidden(series(hsv, globals_chart, list(global_colors.values()), generations))
    per_percent = globals_chart['spacing'] / 10
    # Eleven lines = 0 to 100 % fully visible; otherwise the highest end point is 100 % (at the end everything is maxed)
    lines = round((globals_chart['bottom'] - globals_chart['top']) / globals_chart['spacing']) + 1
    full = globals_chart['top'] if lines >= 11 else min(gpixels[color][-1] for color in global_colors.values() if gpixels[color][-1] is not None)
    parameters = {name: [None if y is None else max(0, min(100, round((full - y) / per_percent + 100))) for y in gpixels[color]] for name, color in global_colors.items()}
    points = {name: remove_spikes(values, False) for name, values in points.items()}
    parameters = {name: remove_spikes(values, True) for name, values in parameters.items()}
    deviation = max(abs(points[name][-1] - totals[name]) for name in totals)
    return {'pointsByGeneration': points, 'globalsByGeneration': parameters, 'endDeviation': deviation, 'charts': charts}


if __name__ == '__main__':
    spec = json.loads(sys.argv[2])
    print(json.dumps(extract(sys.argv[1], spec['colors'], spec['generations'], spec['totals'])))
