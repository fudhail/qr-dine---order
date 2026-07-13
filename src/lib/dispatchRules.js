const ROLE_VALUES = new Set(['ANCHOR', 'ATTACHABLE', 'INDEPENDENT']);
const INDEPENDENT_CATEGORIES = new Set(['Starters', 'Desserts', 'Beverages', 'Services']);
const ANCHOR_CATEGORIES = new Set(['Breakfast', 'Mains']);
const ATTACHABLE_PATTERNS = [
  /porota|paratha|naan|roti|chapati|bread/i,
  /rice|pulao|biryani/i,
  /fries|chips/i,
  /salad/i,
  /dip|sauce|chutney|pickle/i
];

const READY_STATUSES = new Set(['DONE', 'DISPATCHED']);

export const slugify = (value) => {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return normalized;
};

export const normalizeServeTogetherRole = (value) => {
  const role = String(value || '').trim().toUpperCase();
  return ROLE_VALUES.has(role) ? role : '';
};

export const parseServeTogetherRefs = (value) => {
  if (Array.isArray(value)) {
    return value.map(entry => slugify(entry)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,|;\n]/)
      .map(entry => slugify(entry))
      .filter(Boolean);
  }

  return [];
};

const inferRoleFromMenuItem = (item = {}) => {
  const explicitRole = normalizeServeTogetherRole(
    item.serveTogetherRole || item.dispatchRole || item.bundleRole
  );
  if (explicitRole) return explicitRole;

  const category = String(item.category || '').trim();
  const name = String(item.name || '');

  if (category === 'Custom') return 'INDEPENDENT';
  if (INDEPENDENT_CATEGORIES.has(category)) return 'INDEPENDENT';
  if (ATTACHABLE_PATTERNS.some(pattern => pattern.test(name))) {
    return 'ATTACHABLE';
  }

  if (ANCHOR_CATEGORIES.has(category)) return 'ANCHOR';

  return 'ANCHOR';
};

export const getMenuServeTogetherDefaults = (item = {}) => {
  const role = inferRoleFromMenuItem(item);
  const family = role === 'ANCHOR'
    ? slugify(item.serveTogetherFamily || item.dispatchFamily || item.name)
    : slugify(item.serveTogetherFamily || item.dispatchFamily || '');
  const refs = parseServeTogetherRefs(
    item.serveTogetherFamilyRefs || item.dispatchFamilyRefs || item.serveTogetherRefs || item.bundleFamilyRefs
  );

  return {
    serveTogetherRole: role,
    serveTogetherFamily: family,
    serveTogetherFamilyRefs: refs.join(', ')
  };
};

export const normalizeMenuDispatchFields = (item = {}) => {
  const defaults = getMenuServeTogetherDefaults(item);
  const role = normalizeServeTogetherRole(item.serveTogetherRole || item.dispatchRole || item.bundleRole) || defaults.serveTogetherRole;
  const family = String(item.serveTogetherFamily || item.dispatchFamily || defaults.serveTogetherFamily || '').trim();
  const refs = parseServeTogetherRefs(
    item.serveTogetherFamilyRefs || item.dispatchFamilyRefs || item.serveTogetherRefs || item.bundleFamilyRefs
  );

  return {
    ...item,
    serveTogetherRole: role,
    serveTogetherFamily: role === 'ANCHOR' ? family || slugify(item.name) : family,
    serveTogetherFamilyRefs: refs.join(', ')
  };
};

const getBundleFamily = (item = {}) => {
  if (String(item.serveTogetherFamily || '').trim()) return slugify(item.serveTogetherFamily);
  if (String(item.dispatchFamily || '').trim()) return slugify(item.dispatchFamily);
  return slugify(item.name);
};

const getBundleRefs = (item = {}) => {
  const refs = parseServeTogetherRefs(
    item.serveTogetherFamilyRefs || item.dispatchFamilyRefs || item.serveTogetherRefs || item.bundleFamilyRefs
  );
  if (refs.includes('*')) return ['*'];
  return refs;
};

const makeBundle = (item, index, kind) => ({
  kind,
  seedIndex: index,
  anchorIndex: index,
  anchorItem: item,
  items: [item],
  warnings: [],
  firstIndex: index
});

const scoreBundleMatch = (bundle, item) => {
  const refs = getBundleRefs(item);
  const bundleFamily = getBundleFamily(bundle.anchorItem);
  const itemFamily = getBundleFamily(item);
  let score = 0;

  if (refs.includes('*')) score += 200;
  if (refs.length > 0 && refs.includes(bundleFamily)) score += 1200;
  if (itemFamily && itemFamily === bundleFamily) score += 1000;
  if (item.station_id && bundle.anchorItem?.station_id && String(item.station_id) === String(bundle.anchorItem.station_id)) score += 50;
  if (item.cuisine && bundle.anchorItem?.cuisine && String(item.cuisine) === String(bundle.anchorItem.cuisine)) score += 25;

  const distance = Math.abs((item.__lineIndex ?? 0) - (bundle.anchorIndex ?? 0));
  score -= distance * 2;
  if ((item.__lineIndex ?? 0) >= (bundle.anchorIndex ?? 0)) score += 5;

  return score;
};

const finalizeBundle = (bundle, key, index) => {
  const labelSource = bundle.anchorItem?.name || bundle.items[0]?.name || `Group ${key}`;
  const warnings = Array.from(new Set(bundle.warnings));
  const enrichedItems = bundle.items.map(item => ({
    ...item,
    serveTogetherKey: key,
    serveTogetherIndex: index + 1,
    serveTogetherLabel: labelSource,
    serveTogetherKind: bundle.kind,
    serveTogetherWarning: warnings.join(' | ')
  }));
  const readyCount = enrichedItems.filter(item => READY_STATUSES.has(String(item.status || '').toUpperCase())).length;
  const totalCount = enrichedItems.length;
  const allReady = totalCount > 0 && readyCount === totalCount;
  const allDispatched = totalCount > 0 && enrichedItems.every(item => String(item.status || '').toUpperCase() === 'DISPATCHED');

  return {
    key,
    index: index + 1,
    kind: bundle.kind,
    label: labelSource,
    warnings,
    items: enrichedItems,
    totalCount,
    readyCount,
    allReady,
    allDispatched,
    canDispatch: allReady && !allDispatched,
    firstIndex: bundle.firstIndex
  };
};

export const buildServeTogetherPlan = (rawItems = []) => {
  const items = rawItems.map((rawItem, index) => {
    const normalized = normalizeMenuDispatchFields(rawItem);
    return {
      ...normalized,
      __lineIndex: index,
      __serveTogetherRole: normalizeServeTogetherRole(normalized.serveTogetherRole) || 'ANCHOR',
      __serveTogetherFamily: slugify(normalized.serveTogetherFamily || normalized.name),
      __serveTogetherFamilyRefs: parseServeTogetherRefs(normalized.serveTogetherFamilyRefs)
    };
  });

  const bundles = [];
  const anchorBundles = [];

  items.forEach(item => {
    const role = item.__serveTogetherRole;
    if (role === 'ANCHOR') {
      const bundle = makeBundle(item, item.__lineIndex, 'ANCHOR');
      bundles.push(bundle);
      anchorBundles.push(bundle);
      return;
    }

    if (role === 'INDEPENDENT') {
      bundles.push(makeBundle(item, item.__lineIndex, 'INDEPENDENT'));
      return;
    }
  });

  items.forEach(item => {
    if (item.__serveTogetherRole !== 'ATTACHABLE') return;

    const refs = item.__serveTogetherFamilyRefs;
    const candidates = anchorBundles.filter(bundle => {
      if (refs.includes('*')) return true;
      if (refs.length === 0) return true;
      const family = getBundleFamily(bundle.anchorItem);
      return refs.includes(family);
    });

    if (candidates.length === 0) {
      const bundle = makeBundle(item, item.__lineIndex, 'UNMATCHED_SIDE');
      bundle.warnings.push('No matching main was found for this side item');
      bundles.push(bundle);
      return;
    }

    let bestBundle = candidates[0];
    let bestScore = scoreBundleMatch(bestBundle, item);
    let tieCount = 0;

    for (const candidate of candidates.slice(1)) {
      const score = scoreBundleMatch(candidate, item);
      if (score > bestScore) {
        bestBundle = candidate;
        bestScore = score;
        tieCount = 0;
      } else if (score === bestScore) {
        tieCount += 1;
      }
    }

    if (bestScore < -20) {
      const bundle = makeBundle(item, item.__lineIndex, 'UNMATCHED_SIDE');
      bundle.warnings.push('Side item could not be safely attached to a main');
      bundles.push(bundle);
      return;
    }

    if (tieCount > 0) {
      bestBundle.warnings.push('Side item could match more than one main');
    }

    bestBundle.items.push(item);
    bestBundle.firstIndex = Math.min(bestBundle.firstIndex, item.__lineIndex);
  });

  const orderedBundles = bundles
    .slice()
    .sort((a, b) => a.firstIndex - b.firstIndex || a.seedIndex - b.seedIndex)
    .map((bundle, index) => finalizeBundle(bundle, String(index + 1), index));

  const bundleByLineIndex = new Map();
  orderedBundles.forEach(bundle => {
    bundle.items.forEach(item => {
      bundleByLineIndex.set(item.__lineIndex, bundle);
    });
  });

  const enrichedItems = items.map(item => {
    const bundle = bundleByLineIndex.get(item.__lineIndex);
    return {
      ...item,
      serveTogetherKey: bundle?.key || '',
      serveTogetherIndex: bundle?.index || 0,
      serveTogetherLabel: bundle?.label || '',
      serveTogetherKind: bundle?.kind || '',
      serveTogetherWarning: bundle?.warnings?.join(' | ') || ''
    };
  }).map(({ __lineIndex, __serveTogetherRole, __serveTogetherFamily, __serveTogetherFamilyRefs, ...item }) => item);

  const bundlesOutput = orderedBundles.map(bundle => ({
    ...bundle,
    items: bundle.items.map(({ __lineIndex, __serveTogetherRole, __serveTogetherFamily, __serveTogetherFamilyRefs, ...item }) => item)
  }));

  return {
    items: enrichedItems,
    bundles: bundlesOutput
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
