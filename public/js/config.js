/**
 * CardWise Configuration Module
 * Loads and parses config.yaml to supply global application configurations.
 */

// Default Fallback Configurations
const DEFAULT_CONFIG = {
  app: {
    name: 'CardWise',
    version: '1.0.1',
    currency: '฿',
    theme: {
      default_mode: 'dark'
    }
  },
  google_sheets: {
    script_url: '',
    sheets: {
      expenses: 'Expenses',
      cards: 'Cards',
      categories: 'Categories',
      users: 'Users'
    }
  },
  cache: {
    enabled: true,
    keys: {
      expenses: 'cardwise_cache_expenses',
      cards: 'cardwise_cache_cards',
      categories: 'cardwise_cache_categories',
      last_sync: 'cardwise_last_sync_time'
    }
  }
};

let cachedAppConfig = null;
let loadPromise = null;

/**
 * Dynamically ensure js-yaml library is loaded
 */
async function ensureYamlParser() {
  if (window.jsyaml) return window.jsyaml;

  return new Promise((resolve, reject) => {
    // Check if script element already exists
    const existing = document.querySelector('script[src*="js-yaml"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.jsyaml));
      existing.addEventListener('error', () => reject(new Error('Failed to load js-yaml script')));
      if (window.jsyaml) resolve(window.jsyaml);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
    script.onload = () => resolve(window.jsyaml);
    script.onerror = () => reject(new Error('Failed to load js-yaml from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Deep merge utility for configuration objects
 */
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Load and parse config.yaml
 * @returns {Promise<Object>} The merged application config
 */
export async function loadConfig() {
  if (cachedAppConfig) {
    return cachedAppConfig;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      await ensureYamlParser();
      const response = await fetch('./config.yaml');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const yamlText = await response.text();
      const parsedConfig = window.jsyaml ? window.jsyaml.load(yamlText) : null;

      if (parsedConfig && typeof parsedConfig === 'object') {
        cachedAppConfig = deepMerge(DEFAULT_CONFIG, parsedConfig);
      } else {
        cachedAppConfig = { ...DEFAULT_CONFIG };
      }
    } catch (err) {
      console.warn('[Config] Failed to load config.yaml, using defaults:', err);
      cachedAppConfig = { ...DEFAULT_CONFIG };
    }
    return cachedAppConfig;
  })();

  return loadPromise;
}

/**
 * Get configuration value by dot-notation path (e.g. 'google_sheets.script_url')
 * @param {string} path Dot notation key path
 * @param {*} defaultValue Fallback value if key is not found
 * @returns {*}
 */
export function getConfigSync(path, defaultValue = null) {
  const config = cachedAppConfig || DEFAULT_CONFIG;
  if (!path) return config;

  const parts = path.split('.');
  let current = config;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Async getter for configuration value with automatic loading
 * @param {string} path Dot notation key path
 * @param {*} defaultValue Fallback value if key is not found
 * @returns {Promise<*>}
 */
export async function getConfig(path, defaultValue = null) {
  await loadConfig();
  return getConfigSync(path, defaultValue);
}

/**
 * Helper to get Google Sheet Web App URL
 * @returns {Promise<string>}
 */
export async function getGoogleSheetUrl() {
  const config = await loadConfig();
  const url = config.google_sheets?.script_url || '';
  if (!url) {
    console.warn('[Config] google_sheets.script_url is not set in config.yaml');
  }
  return url;
}

// Preload configuration in background
loadConfig();
