const READY_STATUSES = new Set(['DONE', 'DISPATCHED']);

export const normalizeMenuDispatchFields = (item = {}) => {
  // No-op to preserve backwards compatibility with older schema queries 
  // without crashing, while ignoring all complex family/role rules.
  return { ...item };
};

export const buildServeTogetherPlan = (rawItems = []) => {
  // Group items by their Category (Course)
  // This ensures Mains (Butter Chicken + Roti) are grouped together naturally,
  // without needing complex family/role mappings in the database.
  const groupsMap = new Map();

  rawItems.forEach((item, index) => {
    const category = String(item.category || 'Other').trim();
    // Use category as the bundle key
    const key = `group_${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        index: groupsMap.size + 1,
        kind: 'CATEGORY_GROUP',
        label: category,
        warnings: [],
        items: [],
        totalCount: 0,
        readyCount: 0,
        firstIndex: index
      });
    }

    const bundle = groupsMap.get(key);
    const isReady = READY_STATUSES.has(String(item.status || '').toUpperCase());
    
    bundle.items.push({
      ...item,
      serveTogetherKey: key,
      serveTogetherIndex: bundle.index,
      serveTogetherLabel: bundle.label,
      serveTogetherKind: 'CATEGORY_GROUP',
      serveTogetherWarning: ''
    });

    bundle.totalCount++;
    if (isReady) bundle.readyCount++;
  });

  const bundles = Array.from(groupsMap.values()).map(bundle => {
    const allDispatched = bundle.totalCount > 0 && bundle.items.every(item => String(item.status || '').toUpperCase() === 'DISPATCHED');
    const allReady = bundle.readyCount === bundle.totalCount;

    return {
      ...bundle,
      allReady,
      allDispatched,
      canDispatch: allReady && !allDispatched
    };
  });

  const enrichedItems = bundles.flatMap(b => b.items).sort((a, b) => {
    // Attempt to restore original line ordering loosely, though they are grouped now
    const originalA = rawItems.findIndex(ri => ri.id === a.id && ri.name === a.name);
    const originalB = rawItems.findIndex(ri => ri.id === b.id && ri.name === b.name);
    return originalA - originalB;
  });

  return {
    items: enrichedItems,
    bundles: bundles.sort((a, b) => a.firstIndex - b.firstIndex)
  };
};

export const mergeBundleDispatch = (items = [], targetBundleKeys = []) => {
  const keys = new Set((Array.isArray(targetBundleKeys) ? targetBundleKeys : [targetBundleKeys])
    .map(value => String(value || '').trim())
    .filter(Boolean));

  if (keys.size === 0) {
    return items;
  }

  return items.map(item => (
    keys.has(String(item.serveTogetherKey || ''))
      ? { ...item, status: 'DISPATCHED' }
      : item
  ));
};

export const isBundleDispatchReady = (items = [], bundleKey = '') => {
  const key = String(bundleKey || '').trim();
  if (!key) return false;
  const bundleItems = items.filter(item => String(item.serveTogetherKey || '') === key);
  return bundleItems.length > 0 && bundleItems.every(item => READY_STATUSES.has(String(item.status || '').toUpperCase()));
};
