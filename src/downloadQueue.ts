/** Keep two of the eight request slots available for nearby playback frames. */
export function nextDownloads(
  count: number,
  urgent: readonly number[],
  fetching: ReadonlySet<number>,
  available: { has(index: number): boolean },
  failed: ReadonlySet<number>,
): number[] {
  const selected: number[] = [];
  const nearby = new Set(urgent);
  let background = [...fetching].filter(index => !nearby.has(index)).length;
  for (const index of new Set([...urgent, ...Array.from({ length: count }, (_, i) => i)])) {
    if (fetching.size + selected.length >= 8) break;
    if (available.has(index) || fetching.has(index) || failed.has(index)) continue;
    if (!nearby.has(index)) {
      if (background >= 6) continue;
      background++;
    }
    selected.push(index);
  }
  return selected;
}
