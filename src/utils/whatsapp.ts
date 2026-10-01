import { STORE_INFO } from '../types';

export type WhatsAppLine = 'line1' | 'line2';
export type WhatsAppQueryType = 'orders' | 'general';

export interface WhatsAppUrlOptions {
  line?: WhatsAppLine;
  queryType?: WhatsAppQueryType;
  phoneNumber?: string;
  message?: string;
}

export const DEFAULT_WHATSAPP_ENQUIRY =
  'Namaste AD Nutrition Hub Israna! Mujhe supplements ke baare mein enquire karna hai.';

export interface QueryTypeConfig {
  queryType: WhatsAppQueryType;
  line: WhatsAppLine;
  label: string;
  shortLabel: string;
  description: string;
  phoneDisplay: string;
  defaultMessage: string;
  badgeColor: string;
}

export const QUERY_TYPE_CONFIG: Record<WhatsAppQueryType, QueryTypeConfig> = {
  orders: {
    queryType: 'orders',
    line: 'line1',
    label: 'Orders & Stock',
    shortLabel: 'Orders',
    description: 'Fast ordering, product price & in-store stock availability',
    phoneDisplay: STORE_INFO.phone,
    defaultMessage: 'Namaste AD Nutrition Hub Israna! 🙏 Mujhe product order karna hai aur store par stock check karni hai.',
    badgeColor: 'bg-amber-400 text-neutral-950',
  },
  general: {
    queryType: 'general',
    line: 'line2',
    label: 'General & Guidance',
    shortLabel: 'General',
    description: 'Supplement recommendations, dosage guidance & shop queries',
    phoneDisplay: STORE_INFO.phone2,
    defaultMessage: 'Namaste AD Nutrition Hub Israna! 🙏 Mujhe supplements aur nutrition guidance ke baare mein poochhna hai.',
    badgeColor: 'bg-emerald-400 text-neutral-950',
  },
};

/**
 * Returns raw phone number (country code + digits, e.g. 917015959517) for a given line
 */
export function getWhatsAppPhoneNumber(line: WhatsAppLine = 'line1'): string {
  return line === 'line2' ? STORE_INFO.rawPhone2 : STORE_INFO.rawPhone1;
}

/**
 * Returns formatted display phone number (e.g. +91 70159 59517) for a given line
 */
export function getWhatsAppDisplayNumber(line: WhatsAppLine = 'line1'): string {
  return line === 'line2' ? STORE_INFO.phone2 : STORE_INFO.phone;
}

/**
 * Standardized helper to generate WhatsApp wa.me URLs for store lines
 * Supports flexible invocations:
 *   - buildWhatsAppUrl() -> default enquiry on Line 1
 *   - buildWhatsAppUrl('line1') -> Line 1 default message
 *   - buildWhatsAppUrl('line2') -> Line 2 default message
 *   - buildWhatsAppUrl('line2', 'custom message') -> Line 2 with custom message
 *   - buildWhatsAppUrl({ queryType: 'orders' }) -> Orders on Line 1
 *   - buildWhatsAppUrl({ queryType: 'general' }) -> General on Line 2
 *   - buildWhatsAppUrl({ line: 'line1', message: '...' }) -> options object
 */
export function buildWhatsAppUrl(
  lineOrOptions?: WhatsAppLine | WhatsAppUrlOptions,
  customMessage?: string
): string {
  let targetPhone = STORE_INFO.rawPhone1;
  let text = DEFAULT_WHATSAPP_ENQUIRY;

  if (typeof lineOrOptions === 'string') {
    targetPhone = getWhatsAppPhoneNumber(lineOrOptions);
    if (customMessage !== undefined) {
      text = customMessage;
    }
  } else if (typeof lineOrOptions === 'object' && lineOrOptions !== null) {
    if (lineOrOptions.queryType) {
      const qConfig = QUERY_TYPE_CONFIG[lineOrOptions.queryType];
      targetPhone = getWhatsAppPhoneNumber(qConfig.line);
      text = lineOrOptions.message || qConfig.defaultMessage;
    } else {
      if (lineOrOptions.phoneNumber) {
        targetPhone = lineOrOptions.phoneNumber.replace(/[^\d]/g, '');
      } else if (lineOrOptions.line) {
        targetPhone = getWhatsAppPhoneNumber(lineOrOptions.line);
      }
      if (lineOrOptions.message !== undefined) {
        text = lineOrOptions.message;
      }
    }
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates WhatsApp URL tailored for a specific query type ('orders' vs 'general')
 */
export function buildWhatsAppUrlForQuery(
  queryType: WhatsAppQueryType,
  customMessage?: string
): string {
  const config = QUERY_TYPE_CONFIG[queryType];
  return buildWhatsAppUrl(config.line, customMessage || config.defaultMessage);
}

/**
 * Generates WhatsApp broadcast/share URL (opens WhatsApp share picker with prefilled text)
 */
export function buildWhatsAppShareUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
