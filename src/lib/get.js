export default function get(object, path, defaultValue) {
  if (object == null) return defaultValue;
  
  // Convert path to array
  let pathArray;
  if (Array.isArray(path)) {
    pathArray = path;
  } else if (typeof path === 'string') {
    // If it's a direct key on the object, return it (handles keys with dots in them)
    if (Object.prototype.hasOwnProperty.call(object, path)) {
      const val = object[path];
      return val === undefined ? defaultValue : val;
    }
    // Otherwise split by dots, handling array indices as well (e.g. data[0].val)
    pathArray = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
  } else if (typeof path === 'number' || typeof path === 'symbol') {
    pathArray = [path];
  } else {
    pathArray = [String(path)];
  }

  let current = object;
  for (const key of pathArray) {
    if (current == null) return defaultValue;
    
    // Protect against prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return defaultValue;
    }
    
    current = current[key];
  }
  
  return current === undefined ? defaultValue : current;
}
