/**
 * Official Company Logo Resolver and Mapping Utility
 * Uses official Simple Icons SVG CDN & trusted domain logo resolvers
 */

export interface CompanyLogoInfo {
  name: string;
  slug: string;
  officialUrl: string;
  domain?: string;
  contrastBgNeeded?: boolean;
}

const COMPANY_SLUG_MAP: Record<string, CompanyLogoInfo> = {
  // Major Tech Companies
  google: { name: 'Google', slug: 'google', officialUrl: 'https://cdn.simpleicons.org/google' },
  microsoft: { name: 'Microsoft', slug: 'microsoft', officialUrl: 'https://cdn.simpleicons.org/microsoft' },
  amazon: { name: 'Amazon', slug: 'amazon', officialUrl: 'https://cdn.simpleicons.org/amazon' },
  apple: { name: 'Apple', slug: 'apple', officialUrl: 'https://cdn.simpleicons.org/apple', contrastBgNeeded: true },
  meta: { name: 'Meta', slug: 'meta', officialUrl: 'https://cdn.simpleicons.org/meta' },
  facebook: { name: 'Meta', slug: 'meta', officialUrl: 'https://cdn.simpleicons.org/meta' },
  netflix: { name: 'Netflix', slug: 'netflix', officialUrl: 'https://cdn.simpleicons.org/netflix' },
  adobe: { name: 'Adobe', slug: 'adobe', officialUrl: 'https://cdn.simpleicons.org/adobe' },
  oracle: { name: 'Oracle', slug: 'oracle', officialUrl: 'https://cdn.simpleicons.org/oracle' },
  ibm: { name: 'IBM', slug: 'ibm', officialUrl: 'https://cdn.simpleicons.org/ibm' },
  cisco: { name: 'Cisco', slug: 'cisco', officialUrl: 'https://cdn.simpleicons.org/cisco' },
  intel: { name: 'Intel', slug: 'intel', officialUrl: 'https://cdn.simpleicons.org/intel' },
  nvidia: { name: 'NVIDIA', slug: 'nvidia', officialUrl: 'https://cdn.simpleicons.org/nvidia' },
  salesforce: { name: 'Salesforce', slug: 'salesforce', officialUrl: 'https://cdn.simpleicons.org/salesforce' },
  accenture: { name: 'Accenture', slug: 'accenture', officialUrl: 'https://cdn.simpleicons.org/accenture' },
  
  // IT & Global Consulting
  tcs: { name: 'TCS', slug: 'tata', officialUrl: 'https://cdn.simpleicons.org/tata', domain: 'tcs.com' },
  'tata consultancy services': { name: 'TCS', slug: 'tata', officialUrl: 'https://cdn.simpleicons.org/tata', domain: 'tcs.com' },
  infosys: { name: 'Infosys', slug: 'infosys', officialUrl: 'https://cdn.simpleicons.org/infosys' },
  wipro: { name: 'Wipro', slug: 'wipro', officialUrl: 'https://cdn.simpleicons.org/wipro' },
  capgemini: { name: 'Capgemini', slug: 'capgemini', officialUrl: 'https://cdn.simpleicons.org/capgemini' },
  cognizant: { name: 'Cognizant', slug: 'cognizant', officialUrl: 'https://cdn.simpleicons.org/cognizant' },
  deloitte: { name: 'Deloitte', slug: 'deloitte', officialUrl: 'https://cdn.simpleicons.org/deloitte' },
  ey: { name: 'EY', slug: 'ey', officialUrl: 'https://cdn.simpleicons.org/ey' },
  'ernst & young': { name: 'EY', slug: 'ey', officialUrl: 'https://cdn.simpleicons.org/ey' },
  pwc: { name: 'PwC', slug: 'pwc', officialUrl: 'https://cdn.simpleicons.org/pwc' },
  pricewaterhousecoopers: { name: 'PwC', slug: 'pwc', officialUrl: 'https://cdn.simpleicons.org/pwc' },
  kpmg: { name: 'KPMG', slug: 'kpmg', officialUrl: 'https://cdn.simpleicons.org/kpmg' },
  hcltech: { name: 'HCLTech', slug: 'hcl', officialUrl: 'https://cdn.simpleicons.org/hcl', domain: 'hcltech.com' },
  hcl: { name: 'HCLTech', slug: 'hcl', officialUrl: 'https://cdn.simpleicons.org/hcl', domain: 'hcltech.com' },
  techmahindra: { name: 'Tech Mahindra', slug: 'techmahindra', officialUrl: 'https://logo.clearbit.com/techmahindra.com', domain: 'techmahindra.com' },
  'tech mahindra': { name: 'Tech Mahindra', slug: 'techmahindra', officialUrl: 'https://logo.clearbit.com/techmahindra.com', domain: 'techmahindra.com' },

  // Additional High-Tech & Finance
  uber: { name: 'Uber', slug: 'uber', officialUrl: 'https://cdn.simpleicons.org/uber', contrastBgNeeded: true },
  goldmansachs: { name: 'Goldman Sachs', slug: 'goldmansachs', officialUrl: 'https://cdn.simpleicons.org/goldmansachs' },
  'goldman sachs': { name: 'Goldman Sachs', slug: 'goldmansachs', officialUrl: 'https://cdn.simpleicons.org/goldmansachs' },
  jpmorgan: { name: 'JPMorgan Chase', slug: 'jpmorgan', officialUrl: 'https://cdn.simpleicons.org/jpmorgan' },
  'jpmorgan chase': { name: 'JPMorgan Chase', slug: 'jpmorgan', officialUrl: 'https://cdn.simpleicons.org/jpmorgan' },
  atlassian: { name: 'Atlassian', slug: 'atlassian', officialUrl: 'https://cdn.simpleicons.org/atlassian' },
  vmware: { name: 'VMware', slug: 'vmware', officialUrl: 'https://cdn.simpleicons.org/vmware' },
  sap: { name: 'SAP', slug: 'sap', officialUrl: 'https://cdn.simpleicons.org/sap' },
  databricks: { name: 'Databricks', slug: 'databricks', officialUrl: 'https://cdn.simpleicons.org/databricks' },
  snowflake: { name: 'Snowflake', slug: 'snowflake', officialUrl: 'https://cdn.simpleicons.org/snowflake' },
  stripe: { name: 'Stripe', slug: 'stripe', officialUrl: 'https://cdn.simpleicons.org/stripe' },
  tesla: { name: 'Tesla', slug: 'tesla', officialUrl: 'https://cdn.simpleicons.org/tesla' },
  siemens: { name: 'Siemens', slug: 'siemens', officialUrl: 'https://cdn.simpleicons.org/siemens' },
  bosch: { name: 'Bosch', slug: 'bosch', officialUrl: 'https://cdn.simpleicons.org/bosch' },
  datadog: { name: 'Datadog', slug: 'datadog', officialUrl: 'https://cdn.simpleicons.org/datadog' },

  // Mock / Practice Companies Mapped to High Quality Tech Logos
  techcorp: { name: 'TechCorp Solutions', slug: 'googlecloud', officialUrl: 'https://cdn.simpleicons.org/googlecloud' },
  'techcorp solutions': { name: 'TechCorp Solutions', slug: 'googlecloud', officialUrl: 'https://cdn.simpleicons.org/googlecloud' },
  datapulse: { name: 'DataPulse Analytics', slug: 'databricks', officialUrl: 'https://cdn.simpleicons.org/databricks' },
  'datapulse analytics': { name: 'DataPulse Analytics', slug: 'databricks', officialUrl: 'https://cdn.simpleicons.org/databricks' },
  cloudscale: { name: 'CloudScale Dynamics', slug: 'kubernetes', officialUrl: 'https://cdn.simpleicons.org/kubernetes' },
  'cloudscale dynamics': { name: 'CloudScale Dynamics', slug: 'kubernetes', officialUrl: 'https://cdn.simpleicons.org/kubernetes' },
  quantum: { name: 'Quantum Financial', slug: 'bloomberg', officialUrl: 'https://cdn.simpleicons.org/bloomberg' },
  'quantum financial technologies': { name: 'Quantum Financial', slug: 'bloomberg', officialUrl: 'https://cdn.simpleicons.org/bloomberg' },
  apex: { name: 'Apex Robotics', slug: 'siemens', officialUrl: 'https://cdn.simpleicons.org/siemens' },
  'apex robotics & industrial ai': { name: 'Apex Robotics', slug: 'siemens', officialUrl: 'https://cdn.simpleicons.org/siemens' },
};

/**
 * Returns official SVG logo URL for a company name or explicit logoUrl
 */
export function getOfficialCompanyLogoUrl(companyName?: string, explicitLogoUrl?: string): string | null {
  if (!companyName && !explicitLogoUrl) return null;

  // If explicit logo URL is provided and it's already an SVG or SimpleIcons URL or valid image URL
  if (explicitLogoUrl && (explicitLogoUrl.startsWith('http') || explicitLogoUrl.startsWith('/'))) {
    // If it's unsplash placeholder, convert to official simple icons logo by matching name
    if (!explicitLogoUrl.includes('unsplash.com')) {
      return explicitLogoUrl;
    }
  }

  if (!companyName) return explicitLogoUrl || null;

  const normalized = companyName.toLowerCase().trim();
  
  // Exact match in slug map
  if (COMPANY_SLUG_MAP[normalized]) {
    return COMPANY_SLUG_MAP[normalized].officialUrl;
  }

  // Partial match search
  for (const [key, value] of Object.entries(COMPANY_SLUG_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value.officialUrl;
    }
  }

  // Fallback to simpleicons slug directly if valid single word
  const cleanSlug = normalized.replace(/[^a-z0-9]/g, '');
  if (cleanSlug.length > 2) {
    return `https://cdn.simpleicons.org/${cleanSlug}`;
  }

  return null;
}
