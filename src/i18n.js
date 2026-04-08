import en from './locales/en.js'

const locales = { en }
let activeLocale = 'en'

/**
 * Returns the localized string for the given key.
 * Falls back to English if the key is missing from the active locale.
 * Logs a console.warn if the key is missing from both.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  const locale = locales[activeLocale]
  if (locale && key in locale) return locale[key]

  if (activeLocale !== 'en') {
    console.warn(`i18n: key "${key}" missing from locale "${activeLocale}", falling back to en`)
    if (key in en) return en[key]
  }

  console.warn(`i18n: missing key "${key}"`)
  return key
}

/**
 * Switches the active locale at runtime.
 * The locale object must be registered via registerLocale before calling this.
 * @param {string} locale
 */
export function setLocale(locale) {
  if (!(locale in locales)) {
    console.warn(`i18n: locale "${locale}" not registered`)
    return
  }
  activeLocale = locale
}

/**
 * Registers a locale object under the given locale key.
 * @param {string} locale
 * @param {Record<string, string>} strings
 */
export function registerLocale(locale, strings) {
  locales[locale] = strings
}
