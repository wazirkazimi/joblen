export default function uniqBy(arr, mapper) {
  if (!arr || !Array.isArray(arr)) return [];
  const map = new Map();
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const key = typeof mapper === 'function' ? mapper(item, i, arr) : item[mapper];
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}
