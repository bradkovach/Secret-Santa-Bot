import logger from './logger';

export interface Country {
	name: string;
	twoAlpha: string;
	threeAlpha: string;
}

const countryData: Country[] = [
	{ name: 'Afghanistan', twoAlpha: 'AF', threeAlpha: 'AFG' },
	{ name: 'Åland Islands', twoAlpha: 'AX', threeAlpha: 'ALA' },
	{ name: 'Albania', twoAlpha: 'AL', threeAlpha: 'ALB' },
	{ name: 'Algeria', twoAlpha: 'DZ', threeAlpha: 'DZA' },
	{ name: 'American Samoa', twoAlpha: 'AS', threeAlpha: 'ASM' },
	{ name: 'Andorra', twoAlpha: 'AD', threeAlpha: 'AND' },
	{ name: 'Angola', twoAlpha: 'AO', threeAlpha: 'AGO' },
	{ name: 'Anguilla', twoAlpha: 'AI', threeAlpha: 'AIA' },
	{ name: 'Antarctica', twoAlpha: 'AQ', threeAlpha: 'ATA' },
	{ name: 'Antigua and Barbuda', twoAlpha: 'AG', threeAlpha: 'ATG' },
	{ name: 'Argentina', twoAlpha: 'AR', threeAlpha: 'ARG' },
	{ name: 'Armenia', twoAlpha: 'AM', threeAlpha: 'ARM' },
	{ name: 'Aruba', twoAlpha: 'AW', threeAlpha: 'ABW' },
	{ name: 'Australia', twoAlpha: 'AU', threeAlpha: 'AUS' },
	{ name: 'Austria', twoAlpha: 'AT', threeAlpha: 'AUT' },
	{ name: 'Azerbaijan', twoAlpha: 'AZ', threeAlpha: 'AZE' },
	{ name: 'Bahamas (the)', twoAlpha: 'BS', threeAlpha: 'BHS' },
	{ name: 'Bahrain', twoAlpha: 'BH', threeAlpha: 'BHR' },
	{ name: 'Bangladesh', twoAlpha: 'BD', threeAlpha: 'BGD' },
	{ name: 'Barbados', twoAlpha: 'BB', threeAlpha: 'BRB' },
	{ name: 'Belarus', twoAlpha: 'BY', threeAlpha: 'BLR' },
	{ name: 'Belgium', twoAlpha: 'BE', threeAlpha: 'BEL' },
	{ name: 'Belize', twoAlpha: 'BZ', threeAlpha: 'BLZ' },
	{ name: 'Benin', twoAlpha: 'BJ', threeAlpha: 'BEN' },
	{ name: 'Bermuda', twoAlpha: 'BM', threeAlpha: 'BMU' },
	{ name: 'Bhutan', twoAlpha: 'BT', threeAlpha: 'BTN' },
	{
		name: 'Bolivia (Plurinational State of)',
		twoAlpha: 'BO',
		threeAlpha: 'BOL',
	},
	{
		name: 'Bonaire/Sint Eustatius/Saba',
		twoAlpha: 'BQ',
		threeAlpha: 'BES',
	},
	{ name: 'Bosnia and Herzegovina', twoAlpha: 'BA', threeAlpha: 'BIH' },
	{ name: 'Botswana', twoAlpha: 'BW', threeAlpha: 'BWA' },
	{ name: 'Bouvet Island', twoAlpha: 'BV', threeAlpha: 'BVT' },
	{ name: 'Brazil', twoAlpha: 'BR', threeAlpha: 'BRA' },
	{
		name: 'British Indian Ocean Territory (the)',
		twoAlpha: 'IO',
		threeAlpha: 'IOT',
	},
	{ name: 'Brunei Darussalam', twoAlpha: 'BN', threeAlpha: 'BRN' },
	{ name: 'Bulgaria', twoAlpha: 'BG', threeAlpha: 'BGR' },
	{ name: 'Burkina Faso', twoAlpha: 'BF', threeAlpha: 'BFA' },
	{ name: 'Burundi', twoAlpha: 'BI', threeAlpha: 'BDI' },
	{ name: 'Cabo Verde', twoAlpha: 'CV', threeAlpha: 'CPV' },
	{ name: 'Cambodia', twoAlpha: 'KH', threeAlpha: 'KHM' },
	{ name: 'Cameroon', twoAlpha: 'CM', threeAlpha: 'CMR' },
	{ name: 'Canada', twoAlpha: 'CA', threeAlpha: 'CAN' },
	{ name: 'Cayman Islands (the)', twoAlpha: 'KY', threeAlpha: 'CYM' },
	{
		name: 'Central African Republic (the)',
		twoAlpha: 'CF',
		threeAlpha: 'CAF',
	},
	{ name: 'Chad', twoAlpha: 'TD', threeAlpha: 'TCD' },
	{ name: 'Chile', twoAlpha: 'CL', threeAlpha: 'CHL' },
	{ name: 'China', twoAlpha: 'CN', threeAlpha: 'CHN' },
	{ name: 'Christmas Island', twoAlpha: 'CX', threeAlpha: 'CXR' },
	{
		name: 'Cocos (Keeling) Islands (the)',
		twoAlpha: 'CC',
		threeAlpha: 'CCK',
	},
	{ name: 'Colombia', twoAlpha: 'CO', threeAlpha: 'COL' },
	{ name: 'Comoros (the)', twoAlpha: 'KM', threeAlpha: 'COM' },
	{
		name: 'Congo (the Democratic Republic of the)',
		twoAlpha: 'CD',
		threeAlpha: 'COD',
	},
	{ name: 'Congo (the)', twoAlpha: 'CG', threeAlpha: 'COG' },
	{ name: 'Cook Islands (the)', twoAlpha: 'CK', threeAlpha: 'COK' },
	{ name: 'Costa Rica', twoAlpha: 'CR', threeAlpha: 'CRI' },
	{ name: "Côte d'Ivoire", twoAlpha: 'CI', threeAlpha: 'CIV' },
	{ name: 'Croatia', twoAlpha: 'HR', threeAlpha: 'HRV' },
	{ name: 'Cuba', twoAlpha: 'CU', threeAlpha: 'CUB' },
	{ name: 'Curaçao', twoAlpha: 'CW', threeAlpha: 'CUW' },
	{ name: 'Cyprus', twoAlpha: 'CY', threeAlpha: 'CYP' },
	{ name: 'Czechia', twoAlpha: 'CZ', threeAlpha: 'CZE' },
	{ name: 'Denmark', twoAlpha: 'DK', threeAlpha: 'DNK' },
	{ name: 'Djibouti', twoAlpha: 'DJ', threeAlpha: 'DJI' },
	{ name: 'Dominica', twoAlpha: 'DM', threeAlpha: 'DMA' },
	{ name: 'Dominican Republic (the)', twoAlpha: 'DO', threeAlpha: 'DOM' },
	{ name: 'Ecuador', twoAlpha: 'EC', threeAlpha: 'ECU' },
	{ name: 'Egypt', twoAlpha: 'EG', threeAlpha: 'EGY' },
	{ name: 'El Salvador', twoAlpha: 'SV', threeAlpha: 'SLV' },
	{ name: 'Equatorial Guinea', twoAlpha: 'GQ', threeAlpha: 'GNQ' },
	{ name: 'Eritrea', twoAlpha: 'ER', threeAlpha: 'ERI' },
	{ name: 'Estonia', twoAlpha: 'EE', threeAlpha: 'EST' },
	{ name: 'Eswatini', twoAlpha: 'SZ', threeAlpha: 'SWZ' },
	{ name: 'Ethiopia', twoAlpha: 'ET', threeAlpha: 'ETH' },
	{
		name: 'Falkland Islands (the) [Malvinas]',
		twoAlpha: 'FK',
		threeAlpha: 'FLK',
	},
	{ name: 'Faroe Islands (the)', twoAlpha: 'FO', threeAlpha: 'FRO' },
	{ name: 'Fiji', twoAlpha: 'FJ', threeAlpha: 'FJI' },
	{ name: 'Finland', twoAlpha: 'FI', threeAlpha: 'FIN' },
	{ name: 'France', twoAlpha: 'FR', threeAlpha: 'FRA' },
	{ name: 'French Guiana', twoAlpha: 'GF', threeAlpha: 'GUF' },
	{ name: 'French Polynesia', twoAlpha: 'PF', threeAlpha: 'PYF' },
	{
		name: 'French Southern Territories (the)',
		twoAlpha: 'TF',
		threeAlpha: 'ATF',
	},
	{ name: 'Gabon', twoAlpha: 'GA', threeAlpha: 'GAB' },
	{ name: 'Gambia (the)', twoAlpha: 'GM', threeAlpha: 'GMB' },
	{ name: 'Georgia', twoAlpha: 'GE', threeAlpha: 'GEO' },
	{ name: 'Germany', twoAlpha: 'DE', threeAlpha: 'DEU' },
	{ name: 'Ghana', twoAlpha: 'GH', threeAlpha: 'GHA' },
	{ name: 'Gibraltar', twoAlpha: 'GI', threeAlpha: 'GIB' },
	{ name: 'Greece', twoAlpha: 'GR', threeAlpha: 'GRC' },
	{ name: 'Greenland', twoAlpha: 'GL', threeAlpha: 'GRL' },
	{ name: 'Grenada', twoAlpha: 'GD', threeAlpha: 'GRD' },
	{ name: 'Guadeloupe', twoAlpha: 'GP', threeAlpha: 'GLP' },
	{ name: 'Guam', twoAlpha: 'GU', threeAlpha: 'GUM' },
	{ name: 'Guatemala', twoAlpha: 'GT', threeAlpha: 'GTM' },
	{ name: 'Guernsey', twoAlpha: 'GG', threeAlpha: 'GGY' },
	{ name: 'Guinea', twoAlpha: 'GN', threeAlpha: 'GIN' },
	{ name: 'Guinea-Bissau', twoAlpha: 'GW', threeAlpha: 'GNB' },
	{ name: 'Guyana', twoAlpha: 'GY', threeAlpha: 'GUY' },
	{ name: 'Haiti', twoAlpha: 'HT', threeAlpha: 'HTI' },
	{
		name: 'Heard Island and McDonald Islands',
		twoAlpha: 'HM',
		threeAlpha: 'HMD',
	},
	{ name: 'Holy See (the)', twoAlpha: 'VA', threeAlpha: 'VAT' },
	{ name: 'Honduras', twoAlpha: 'HN', threeAlpha: 'HND' },
	{ name: 'Hong Kong', twoAlpha: 'HK', threeAlpha: 'HKG' },
	{ name: 'Hungary', twoAlpha: 'HU', threeAlpha: 'HUN' },
	{ name: 'Iceland', twoAlpha: 'IS', threeAlpha: 'ISL' },
	{ name: 'India', twoAlpha: 'IN', threeAlpha: 'IND' },
	{ name: 'Indonesia', twoAlpha: 'ID', threeAlpha: 'IDN' },
	{
		name: 'Iran (Islamic Republic of)',
		twoAlpha: 'IR',
		threeAlpha: 'IRN',
	},
	{ name: 'Iraq', twoAlpha: 'IQ', threeAlpha: 'IRQ' },
	{ name: 'Ireland', twoAlpha: 'IE', threeAlpha: 'IRL' },
	{ name: 'Isle of Man', twoAlpha: 'IM', threeAlpha: 'IMN' },
	{ name: 'Israel', twoAlpha: 'IL', threeAlpha: 'ISR' },
	{ name: 'Italy', twoAlpha: 'IT', threeAlpha: 'ITA' },
	{ name: 'Jamaica', twoAlpha: 'JM', threeAlpha: 'JAM' },
	{ name: 'Japan', twoAlpha: 'JP', threeAlpha: 'JPN' },
	{ name: 'Jersey', twoAlpha: 'JE', threeAlpha: 'JEY' },
	{ name: 'Jordan', twoAlpha: 'JO', threeAlpha: 'JOR' },
	{ name: 'Kazakhstan', twoAlpha: 'KZ', threeAlpha: 'KAZ' },
	{ name: 'Kenya', twoAlpha: 'KE', threeAlpha: 'KEN' },
	{ name: 'Kiribati', twoAlpha: 'KI', threeAlpha: 'KIR' },
	{ name: 'North Korea', twoAlpha: 'KP', threeAlpha: 'PRK' },
	{ name: 'South Korea', twoAlpha: 'KR', threeAlpha: 'KOR' },
	{ name: 'Kuwait', twoAlpha: 'KW', threeAlpha: 'KWT' },
	{ name: 'Kyrgyzstan', twoAlpha: 'KG', threeAlpha: 'KGZ' },
	{
		name: "Lao People's Democratic Republic (the)",
		twoAlpha: 'LA',
		threeAlpha: 'LAO',
	},
	{ name: 'Latvia', twoAlpha: 'LV', threeAlpha: 'LVA' },
	{ name: 'Lebanon', twoAlpha: 'LB', threeAlpha: 'LBN' },
	{ name: 'Lesotho', twoAlpha: 'LS', threeAlpha: 'LSO' },
	{ name: 'Liberia', twoAlpha: 'LR', threeAlpha: 'LBR' },
	{ name: 'Libya', twoAlpha: 'LY', threeAlpha: 'LBY' },
	{ name: 'Liechtenstein', twoAlpha: 'LI', threeAlpha: 'LIE' },
	{ name: 'Lithuania', twoAlpha: 'LT', threeAlpha: 'LTU' },
	{ name: 'Luxembourg', twoAlpha: 'LU', threeAlpha: 'LUX' },
	{ name: 'Macao', twoAlpha: 'MO', threeAlpha: 'MAC' },
	{ name: 'North Macedonia', twoAlpha: 'MK', threeAlpha: 'MKD' },
	{ name: 'Madagascar', twoAlpha: 'MG', threeAlpha: 'MDG' },
	{ name: 'Malawi', twoAlpha: 'MW', threeAlpha: 'MWI' },
	{ name: 'Malaysia', twoAlpha: 'MY', threeAlpha: 'MYS' },
	{ name: 'Maldives', twoAlpha: 'MV', threeAlpha: 'MDV' },
	{ name: 'Mali', twoAlpha: 'ML', threeAlpha: 'MLI' },
	{ name: 'Malta', twoAlpha: 'MT', threeAlpha: 'MLT' },
	{ name: 'Marshall Islands (the)', twoAlpha: 'MH', threeAlpha: 'MHL' },
	{ name: 'Martinique', twoAlpha: 'MQ', threeAlpha: 'MTQ' },
	{ name: 'Mauritania', twoAlpha: 'MR', threeAlpha: 'MRT' },
	{ name: 'Mauritius', twoAlpha: 'MU', threeAlpha: 'MUS' },
	{ name: 'Mayotte', twoAlpha: 'YT', threeAlpha: 'MYT' },
	{ name: 'Mexico', twoAlpha: 'MX', threeAlpha: 'MEX' },
	{
		name: 'Micronesia (Federated States of)',
		twoAlpha: 'FM',
		threeAlpha: 'FSM',
	},
	{ name: 'Moldova (the Republic of)', twoAlpha: 'MD', threeAlpha: 'MDA' },
	{ name: 'Monaco', twoAlpha: 'MC', threeAlpha: 'MCO' },
	{ name: 'Mongolia', twoAlpha: 'MN', threeAlpha: 'MNG' },
	{ name: 'Montenegro', twoAlpha: 'ME', threeAlpha: 'MNE' },
	{ name: 'Montserrat', twoAlpha: 'MS', threeAlpha: 'MSR' },
	{ name: 'Morocco', twoAlpha: 'MA', threeAlpha: 'MAR' },
	{ name: 'Mozambique', twoAlpha: 'MZ', threeAlpha: 'MOZ' },
	{ name: 'Myanmar', twoAlpha: 'MM', threeAlpha: 'MMR' },
	{ name: 'Namibia', twoAlpha: 'NA', threeAlpha: 'NAM' },
	{ name: 'Nauru', twoAlpha: 'NR', threeAlpha: 'NRU' },
	{ name: 'Nepal', twoAlpha: 'NP', threeAlpha: 'NPL' },
	{ name: 'Netherlands (the)', twoAlpha: 'NL', threeAlpha: 'NLD' },
	{ name: 'New Caledonia', twoAlpha: 'NC', threeAlpha: 'NCL' },
	{ name: 'New Zealand', twoAlpha: 'NZ', threeAlpha: 'NZL' },
	{ name: 'Nicaragua', twoAlpha: 'NI', threeAlpha: 'NIC' },
	{ name: 'Niger (the)', twoAlpha: 'NE', threeAlpha: 'NER' },
	{ name: 'Nigeria', twoAlpha: 'NG', threeAlpha: 'NGA' },
	{ name: 'Niue', twoAlpha: 'NU', threeAlpha: 'NIU' },
	{ name: 'Norfolk Island', twoAlpha: 'NF', threeAlpha: 'NFK' },
	{
		name: 'Northern Mariana Islands (the)',
		twoAlpha: 'MP',
		threeAlpha: 'MNP',
	},
	{ name: 'Norway', twoAlpha: 'NO', threeAlpha: 'NOR' },
	{ name: 'Oman', twoAlpha: 'OM', threeAlpha: 'OMN' },
	{ name: 'Pakistan', twoAlpha: 'PK', threeAlpha: 'PAK' },
	{ name: 'Palau', twoAlpha: 'PW', threeAlpha: 'PLW' },
	{ name: 'Palestine', twoAlpha: 'PS', threeAlpha: 'PSE' },
	{ name: 'Panama', twoAlpha: 'PA', threeAlpha: 'PAN' },
	{ name: 'Papua New Guinea', twoAlpha: 'PG', threeAlpha: 'PNG' },
	{ name: 'Paraguay', twoAlpha: 'PY', threeAlpha: 'PRY' },
	{ name: 'Peru', twoAlpha: 'PE', threeAlpha: 'PER' },
	{ name: 'Philippines (the)', twoAlpha: 'PH', threeAlpha: 'PHL' },
	{ name: 'Pitcairn', twoAlpha: 'PN', threeAlpha: 'PCN' },
	{ name: 'Poland', twoAlpha: 'PL', threeAlpha: 'POL' },
	{ name: 'Portugal', twoAlpha: 'PT', threeAlpha: 'PRT' },
	{ name: 'Puerto Rico', twoAlpha: 'PR', threeAlpha: 'PRI' },
	{ name: 'Qatar', twoAlpha: 'QA', threeAlpha: 'QAT' },
	{ name: 'Réunion', twoAlpha: 'RE', threeAlpha: 'REU' },
	{ name: 'Romania', twoAlpha: 'RO', threeAlpha: 'ROU' },
	{ name: 'Russian Federation (the)', twoAlpha: 'RU', threeAlpha: 'RUS' },
	{ name: 'Rwanda', twoAlpha: 'RW', threeAlpha: 'RWA' },
	{ name: 'Saint Barthélemy', twoAlpha: 'BL', threeAlpha: 'BLM' },
	{
		name: 'Saint Helena/Ascension Island/Tristan da Cunha',
		twoAlpha: 'SH',
		threeAlpha: 'SHN',
	},
	{ name: 'Saint Kitts and Nevis', twoAlpha: 'KN', threeAlpha: 'KNA' },
	{ name: 'Saint Lucia', twoAlpha: 'LC', threeAlpha: 'LCA' },
	{
		name: 'Saint Martin (French part)',
		twoAlpha: 'MF',
		threeAlpha: 'MAF',
	},
	{ name: 'Saint Pierre and Miquelon', twoAlpha: 'PM', threeAlpha: 'SPM' },
	{
		name: 'Saint Vincent and the Grenadines',
		twoAlpha: 'VC',
		threeAlpha: 'VCT',
	},
	{ name: 'Samoa', twoAlpha: 'WS', threeAlpha: 'WSM' },
	{ name: 'San Marino', twoAlpha: 'SM', threeAlpha: 'SMR' },
	{ name: 'Sao Tome and Principe', twoAlpha: 'ST', threeAlpha: 'STP' },
	{ name: 'Saudi Arabia', twoAlpha: 'SA', threeAlpha: 'SAU' },
	{ name: 'Senegal', twoAlpha: 'SN', threeAlpha: 'SEN' },
	{ name: 'Serbia', twoAlpha: 'RS', threeAlpha: 'SRB' },
	{ name: 'Seychelles', twoAlpha: 'SC', threeAlpha: 'SYC' },
	{ name: 'Sierra Leone', twoAlpha: 'SL', threeAlpha: 'SLE' },
	{ name: 'Singapore', twoAlpha: 'SG', threeAlpha: 'SGP' },
	{ name: 'Sint Maarten (Dutch part)', twoAlpha: 'SX', threeAlpha: 'SXM' },
	{ name: 'Slovakia', twoAlpha: 'SK', threeAlpha: 'SVK' },
	{ name: 'Slovenia', twoAlpha: 'SI', threeAlpha: 'SVN' },
	{ name: 'Solomon Islands', twoAlpha: 'SB', threeAlpha: 'SLB' },
	{ name: 'Somalia', twoAlpha: 'SO', threeAlpha: 'SOM' },
	{ name: 'South Africa', twoAlpha: 'ZA', threeAlpha: 'ZAF' },
	{
		name: 'South Georgia and the South Sandwich Islands',
		twoAlpha: 'GS',
		threeAlpha: 'SGS',
	},
	{ name: 'South Sudan', twoAlpha: 'SS', threeAlpha: 'SSD' },
	{ name: 'Spain', twoAlpha: 'ES', threeAlpha: 'ESP' },
	{ name: 'Sri Lanka', twoAlpha: 'LK', threeAlpha: 'LKA' },
	{ name: 'Sudan (the)', twoAlpha: 'SD', threeAlpha: 'SDN' },
	{ name: 'Suriname', twoAlpha: 'SR', threeAlpha: 'SUR' },
	{ name: 'Svalbard and Jan Mayen', twoAlpha: 'SJ', threeAlpha: 'SJM' },
	{ name: 'Sweden', twoAlpha: 'SE', threeAlpha: 'SWE' },
	{ name: 'Switzerland', twoAlpha: 'CH', threeAlpha: 'CHE' },
	{
		name: 'Syrian Arab Republic (the)',
		twoAlpha: 'SY',
		threeAlpha: 'SYR',
	},
	{
		name: 'Taiwan (Province of China)',
		twoAlpha: 'TW',
		threeAlpha: 'TWN',
	},
	{ name: 'Tajikistan', twoAlpha: 'TJ', threeAlpha: 'TJK' },
	{ name: 'Tanzania', twoAlpha: 'TZ', threeAlpha: 'TZA' },
	{ name: 'Thailand', twoAlpha: 'TH', threeAlpha: 'THA' },
	{ name: 'Timor-Leste', twoAlpha: 'TL', threeAlpha: 'TLS' },
	{ name: 'Togo', twoAlpha: 'TG', threeAlpha: 'TGO' },
	{ name: 'Tokelau', twoAlpha: 'TK', threeAlpha: 'TKL' },
	{ name: 'Tonga', twoAlpha: 'TO', threeAlpha: 'TON' },
	{ name: 'Trinidad and Tobago', twoAlpha: 'TT', threeAlpha: 'TTO' },
	{ name: 'Tunisia', twoAlpha: 'TN', threeAlpha: 'TUN' },
	{ name: 'Türkiye', twoAlpha: 'TR', threeAlpha: 'TUR' },
	{ name: 'Turkmenistan', twoAlpha: 'TM', threeAlpha: 'TKM' },
	{
		name: 'Turks and Caicos Islands (the)',
		twoAlpha: 'TC',
		threeAlpha: 'TCA',
	},
	{ name: 'Tuvalu', twoAlpha: 'TV', threeAlpha: 'TUV' },
	{ name: 'Uganda', twoAlpha: 'UG', threeAlpha: 'UGA' },
	{ name: 'Ukraine', twoAlpha: 'UA', threeAlpha: 'UKR' },
	{
		name: 'United Arab Emirates (the)',
		twoAlpha: 'AE',
		threeAlpha: 'ARE',
	},
	{
		name: 'United Kingdom of Great Britain and Northern Ireland (the)',
		twoAlpha: 'GB',
		threeAlpha: 'GBR',
	},
	{
		name: 'United States Minor Outlying Islands (the)',
		twoAlpha: 'UM',
		threeAlpha: 'UMI',
	},
	{
		name: 'United States of America (the)',
		twoAlpha: 'US',
		threeAlpha: 'USA',
	},
	{ name: 'Uruguay', twoAlpha: 'UY', threeAlpha: 'URY' },
	{ name: 'Uzbekistan', twoAlpha: 'UZ', threeAlpha: 'UZB' },
	{ name: 'Vanuatu', twoAlpha: 'VU', threeAlpha: 'VUT' },
	{
		name: 'Venezuela (Bolivarian Republic of)',
		twoAlpha: 'VE',
		threeAlpha: 'VEN',
	},
	{ name: 'Viet Nam', twoAlpha: 'VN', threeAlpha: 'VNM' },
	{ name: 'Virgin Islands (British)', twoAlpha: 'VG', threeAlpha: 'VGB' },
	{ name: 'Virgin Islands (U.S.)', twoAlpha: 'VI', threeAlpha: 'VIR' },
	{ name: 'Wallis and Futuna', twoAlpha: 'WF', threeAlpha: 'WLF' },
	{ name: 'Western Sahara', twoAlpha: 'EH', threeAlpha: 'ESH' },
	{ name: 'Yemen', twoAlpha: 'YE', threeAlpha: 'YEM' },
	{ name: 'Zambia', twoAlpha: 'ZM', threeAlpha: 'ZMB' },
	{ name: 'Zimbabwe', twoAlpha: 'ZW', threeAlpha: 'ZWE' },
];

const indexedByTwo = new Map(
	countryData.map((country) => [country['twoAlpha'], country])
);
const indexedByThree = new Map(
	countryData.map((country) => [country['threeAlpha'], country])
);

export const REGIONAL_IDENTIFIERS_START = 127397;
export const REGIONAL_IDENTIFIERS_END =
	REGIONAL_IDENTIFIERS_START + 'Z'.charCodeAt(0);

export function flagFromTwo(twoAlpha: string) {
	try {
		const codePoints = twoAlpha
			.trim()
			.slice(0, 2)
			.toUpperCase()
			.split('')
			.map((char) => REGIONAL_IDENTIFIERS_START + char.charCodeAt(0));
		return String.fromCodePoint(...codePoints);
	} catch (error) {
		logger.warn(`Unable to get flag emoji from string '${twoAlpha}'.`);
		return twoAlpha;
	}
}

export function flagFromThree(threeAlpha: string) {
	let country = indexedByThree.get(threeAlpha);
	return country ? flagFromTwo(country.twoAlpha) : '';
}

const indexedByEmoji = new Map(
	countryData.map((country) => [flagFromTwo(country.twoAlpha), country])
);

export function countryFromEmoji(emoji: string) {
	let country = indexedByEmoji.get(emoji);
	return country ? country : null;
}

export function isFlagEmoji(emoji: string): boolean {
	return indexedByEmoji.has(emoji.trim());
}

// console.log("CA", flagFromTwo('CA'));
// console.log("US", flagFromTwo("US"));

// console.log("CAN", flagFromThree('CAN'));
// console.log("USA", flagFromThree('USA'));
