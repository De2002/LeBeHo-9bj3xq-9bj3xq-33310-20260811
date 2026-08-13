import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CATEGORIES, Category } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { generateId, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  Globe, ChevronRight, ChevronDown, Send, Hash, Check,
  MapPin, Image as ImageIcon, X, Eye, Code2, Upload, RefreshCw,
  CloudOff, Cloud, Search, Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/features/MarkdownRenderer';

interface GeoRegion { continent: string; countries: GeoCountry[]; }
interface GeoCountry { name: string; code: string; states?: string[]; cities?: string[]; }

const GEO_HIERARCHY: GeoRegion[] = [
  { continent: 'Africa', countries: [
    { name: 'Nigeria', code: 'NG', states: ['Lagos State','Abuja FCT','Rivers State','Kano State','Ogun State','Oyo State','Enugu State','Anambra State'], cities: ['Lagos','Abuja','Kano','Ibadan','Port Harcourt','Enugu','Onitsha','Benin City','Warri','Aba'] },
    { name: 'Kenya', code: 'KE', states: ['Nairobi County','Mombasa County','Kisumu County','Nakuru County','Kiambu County'], cities: ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika'] },
    { name: 'Uganda', code: 'UG', cities: ['Kampala','Entebbe','Gulu','Jinja','Mbarara'] },
    { name: 'South Africa', code: 'ZA', states: ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo'], cities: ['Johannesburg','Cape Town','Durban','Pretoria','Port Elizabeth','Bloemfontein'] },
    { name: 'Ghana', code: 'GH', states: ['Greater Accra','Ashanti','Northern Region'], cities: ['Accra','Kumasi','Tamale','Cape Coast','Sekondi'] },
    { name: 'Ethiopia', code: 'ET', cities: ['Addis Ababa','Dire Dawa','Mekelle','Gondar','Hawassa'] },
    { name: 'Tanzania', code: 'TZ', cities: ['Dar es Salaam','Dodoma','Arusha','Zanzibar City','Mwanza'] },
    { name: 'Egypt', code: 'EG', states: ['Cairo Governorate','Alexandria Governorate','Giza Governorate'], cities: ['Cairo','Alexandria','Giza','Luxor','Aswan','Sharm el-Sheikh'] },
    { name: 'Morocco', code: 'MA', cities: ['Casablanca','Rabat','Marrakech','Fes','Tangier','Agadir'] },
    { name: 'Senegal', code: 'SN', cities: ['Dakar','Thiès','Saint-Louis','Ziguinchor'] },
    { name: 'Côte d\'Ivoire', code: 'CI', cities: ['Abidjan','Bouaké','Yamoussoukro','Daloa'] },
    { name: 'Cameroon', code: 'CM', cities: ['Douala','Yaoundé','Bamenda','Bafoussam'] },
    { name: 'Zimbabwe', code: 'ZW', cities: ['Harare','Bulawayo','Mutare','Gweru'] },
    { name: 'Rwanda', code: 'RW', cities: ['Kigali','Butare','Gitarama'] },
    { name: 'Zambia', code: 'ZM', cities: ['Lusaka','Ndola','Kitwe','Livingstone'] },
  ]},
  { continent: 'North America', countries: [
    { name: 'United States', code: 'US', states: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'], cities: ['New York City','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte','Indianapolis','San Francisco','Seattle','Denver','Nashville','Oklahoma City','El Paso','Washington DC','Las Vegas','Louisville','Portland','Memphis','Baltimore','Milwaukee','Albuquerque','Tucson','Fresno','Sacramento','Mesa','Kansas City','Atlanta','Omaha','Colorado Springs','Raleigh','Long Beach','Virginia Beach','Minneapolis','Tampa','New Orleans','Arlington','Bakersfield','Honolulu','Anaheim','Aurora','Santa Ana','Corpus Christi','Riverside','Lexington','St. Louis','Pittsburgh','Stockton','Cincinnati','St. Paul','Toledo','Greensboro','Newark','Plano','Henderson','Lincoln','Buffalo','Fort Wayne','Jersey City','Chandler','St. Petersburg','Laredo','Norfolk','Madison','Durham','Lubbock','Winston-Salem','Garland','Glendale','Hialeah','Reno','Baton Rouge','Irvine','Chesapeake','Scottsdale','North Las Vegas','Fremont','Gilbert','San Bernardino','Birmingham','Rochester','Richmond'] },
    { name: 'Canada', code: 'CA', states: ['Ontario','Quebec','British Columbia','Alberta','Manitoba','Saskatchewan','Nova Scotia','New Brunswick','Prince Edward Island','Newfoundland and Labrador'], cities: ['Toronto','Vancouver','Montreal','Calgary','Ottawa','Edmonton','Winnipeg','Quebec City','Hamilton','Kitchener','London','Halifax','Victoria','Windsor','Oshawa','Saskatoon','Regina','Kelowna','Abbotsford','Barrie'] },
    { name: 'Mexico', code: 'MX', states: ['Mexico City','Jalisco','Nuevo León','Puebla','Guanajuato','Veracruz','Chihuahua','Oaxaca','Michoacán','Guerrero'], cities: ['Mexico City','Guadalajara','Monterrey','Puebla','Tijuana','León','Ciudad Juárez','Torreón','San Luis Potosí','Mérida','Querétaro','Cancún','Acapulco','Cuernavaca'] },
    { name: 'Cuba', code: 'CU', cities: ['Havana','Santiago de Cuba','Camagüey','Holguín'] },
    { name: 'Dominican Republic', code: 'DO', cities: ['Santo Domingo','Santiago de los Caballeros','La Romana'] },
    { name: 'Guatemala', code: 'GT', cities: ['Guatemala City','Quetzaltenango','Escuintla'] },
    { name: 'Honduras', code: 'HN', cities: ['Tegucigalpa','San Pedro Sula','La Ceiba'] },
    { name: 'Costa Rica', code: 'CR', cities: ['San José','Alajuela','Liberia'] },
    { name: 'Panama', code: 'PA', cities: ['Panama City','Colón','David'] },
    { name: 'Jamaica', code: 'JM', cities: ['Kingston','Montego Bay','Spanish Town'] },
  ]},
  { continent: 'Europe', countries: [
    { name: 'United Kingdom', code: 'GB', states: ['England','Scotland','Wales','Northern Ireland'], cities: ['London','Birmingham','Manchester','Leeds','Glasgow','Edinburgh','Bristol','Liverpool','Sheffield','Bradford','Leicester','Edinburgh','Coventry','Nottingham','Newcastle','Southampton','Belfast','Brighton','Plymouth','Derby'] },
    { name: 'Germany', code: 'DE', states: ['Bavaria','Berlin','North Rhine-Westphalia','Baden-Württemberg','Hamburg','Saxony','Lower Saxony','Hesse','Brandenburg','Schleswig-Holstein'], cities: ['Berlin','Hamburg','Munich','Cologne','Frankfurt','Stuttgart','Düsseldorf','Leipzig','Dortmund','Essen','Bremen','Dresden','Hanover','Nuremberg','Duisburg','Bochum','Wuppertal','Bielefeld','Bonn','Münster'] },
    { name: 'France', code: 'FR', states: ['Île-de-France','Auvergne-Rhône-Alpes','Nouvelle-Aquitaine','Occitanie','Hauts-de-France','Grand Est','Normandy','Brittany','Pays de la Loire','Provence-Alpes-Côte d\'Azur'], cities: ['Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Bordeaux','Lille','Rennes','Reims','Toulon','Saint-Étienne','Le Havre','Grenoble','Dijon','Angers','Nîmes','Aix-en-Provence'] },
    { name: 'Netherlands', code: 'NL', states: ['North Holland','South Holland','Utrecht','Gelderland','North Brabant'], cities: ['Amsterdam','Rotterdam','The Hague','Utrecht','Eindhoven','Tilburg','Groningen','Almere','Breda','Nijmegen'] },
    { name: 'Spain', code: 'ES', states: ['Madrid','Catalonia','Andalusia','Valencia','Basque Country','Galicia','Castile and León','Castile-La Mancha'], cities: ['Madrid','Barcelona','Valencia','Seville','Zaragoza','Málaga','Murcia','Palma','Las Palmas','Bilbao','Alicante','Córdoba','Valladolid','Vigo','Gijón','Granada','A Coruña','Vitoria-Gasteiz','Elche'] },
    { name: 'Italy', code: 'IT', states: ['Lombardy','Lazio','Campania','Sicily','Piedmont','Veneto','Emilia-Romagna','Tuscany','Puglia'], cities: ['Rome','Milan','Naples','Turin','Palermo','Genoa','Bologna','Florence','Bari','Catania','Venice','Verona','Messina','Padua','Trieste','Taranto','Brescia','Prato','Parma','Reggio Calabria'] },
    { name: 'Poland', code: 'PL', states: ['Masovian','Silesian','Lesser Poland','Greater Poland'], cities: ['Warsaw','Kraków','Łódź','Wrocław','Poznań','Gdańsk','Szczecin','Bydgoszcz','Lublin','Katowice'] },
    { name: 'Portugal', code: 'PT', cities: ['Lisbon','Porto','Braga','Coimbra','Funchal','Faro','Setúbal'] },
    { name: 'Sweden', code: 'SE', cities: ['Stockholm','Gothenburg','Malmö','Uppsala','Västerås','Örebro','Linköping'] },
    { name: 'Norway', code: 'NO', cities: ['Oslo','Bergen','Trondheim','Stavanger','Drammen'] },
    { name: 'Denmark', code: 'DK', cities: ['Copenhagen','Aarhus','Odense','Aalborg','Frederiksberg'] },
    { name: 'Finland', code: 'FI', cities: ['Helsinki','Espoo','Tampere','Vantaa','Oulu','Turku'] },
    { name: 'Belgium', code: 'BE', cities: ['Brussels','Antwerp','Ghent','Charleroi','Liège','Bruges'] },
    { name: 'Switzerland', code: 'CH', cities: ['Zurich','Geneva','Basel','Lausanne','Bern','Winterthur'] },
    { name: 'Austria', code: 'AT', cities: ['Vienna','Graz','Linz','Salzburg','Innsbruck'] },
    { name: 'Greece', code: 'GR', cities: ['Athens','Thessaloniki','Patras','Heraklion','Piraeus','Larissa'] },
    { name: 'Czech Republic', code: 'CZ', cities: ['Prague','Brno','Ostrava','Plzeň','Liberec'] },
    { name: 'Hungary', code: 'HU', cities: ['Budapest','Debrecen','Miskolc','Szeged','Pécs'] },
    { name: 'Romania', code: 'RO', cities: ['Bucharest','Cluj-Napoca','Timișoara','Iași','Constanța','Craiova'] },
    { name: 'Ukraine', code: 'UA', cities: ['Kyiv','Kharkiv','Odessa','Dnipro','Donetsk','Lviv'] },
    { name: 'Ireland', code: 'IE', cities: ['Dublin','Cork','Limerick','Galway','Waterford'] },
  ]},
  { continent: 'Asia', countries: [
    { name: 'India', code: 'IN', states: ['Maharashtra','Delhi','Karnataka','Tamil Nadu','Gujarat','West Bengal','Telangana','Rajasthan','Kerala','Uttar Pradesh','Madhya Pradesh','Bihar','Punjab','Haryana','Andhra Pradesh'], cities: ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Hyderabad','Ahmedabad','Pune','Jaipur','Surat','Lucknow','Kanpur','Nagpur','Indore','Thane','Bhopal','Visakhapatnam','Patna','Vadodara','Ludhiana','Agra','Nashik','Faridabad','Meerut','Rajkot','Varanasi','Srinagar','Aurangabad','Dhanbad','Amritsar','Allahabad','Ranchi','Howrah','Coimbatore','Jabalpur','Gwalior','Vijayawada','Jodhpur','Madurai','Raipur','Kota'] },
    { name: 'China', code: 'CN', states: ['Guangdong','Shandong','Henan','Sichuan','Jiangsu','Zhejiang','Shanghai Municipality','Beijing Municipality','Tianjin Municipality','Hebei','Hunan','Hubei','Liaoning','Fujian','Shaanxi'], cities: ['Shanghai','Beijing','Guangzhou','Shenzhen','Chengdu','Hangzhou','Wuhan','Xi\'an','Chongqing','Nanjing','Tianjin','Dongguan','Shenyang','Qingdao','Zhengzhou','Changsha','Dalian','Kunming','Harbin','Xiamen','Jinan','Hefei','Fuzhou','Foshan','Suzhou','Wuxi','Nanchang','Ningbo','Guiyang','Wenzhou'] },
    { name: 'Japan', code: 'JP', states: ['Tokyo','Osaka','Kanagawa','Aichi','Kyoto','Hyogo','Fukuoka','Hokkaido','Saitama','Chiba'], cities: ['Tokyo','Osaka','Yokohama','Nagoya','Kyoto','Fukuoka','Sapporo','Kobe','Kawasaki','Saitama','Hiroshima','Sendai','Kitakyushu','Chiba','Sakai','Kumamoto','Okayama','Hamamatsu','Kagoshima','Niigata'] },
    { name: 'South Korea', code: 'KR', states: ['Seoul','Gyeonggi','Busan','Incheon','Daegu'], cities: ['Seoul','Busan','Incheon','Daegu','Daejeon','Gwangju','Suwon','Ulsan','Seongnam','Goyang'] },
    { name: 'Indonesia', code: 'ID', states: ['Java','Sumatra','Kalimantan','Sulawesi','Papua'], cities: ['Jakarta','Surabaya','Bandung','Medan','Bekasi','Tangerang','Depok','Semarang','Palembang','South Tangerang','Makassar','Batam','Pekanbaru','Denpasar (Bali)','Bogor'] },
    { name: 'Pakistan', code: 'PK', states: ['Punjab','Sindh','Khyber Pakhtunkhwa','Balochistan','Islamabad Capital Territory'], cities: ['Karachi','Lahore','Faisalabad','Rawalpindi','Islamabad','Gujranwala','Peshawar','Multan','Quetta','Hyderabad'] },
    { name: 'Bangladesh', code: 'BD', cities: ['Dhaka','Chittagong','Sylhet','Khulna','Rajshahi','Comilla','Mymensingh'] },
    { name: 'Philippines', code: 'PH', states: ['Metro Manila','Cebu','Davao','Central Visayas'], cities: ['Manila','Quezon City','Caloocan','Davao City','Cebu City','Zamboanga City','Taguig','Antipolo','Pasig','Cagayan de Oro','Makati','Parañaque','Las Piñas'] },
    { name: 'Vietnam', code: 'VN', cities: ['Ho Chi Minh City','Hanoi','Da Nang','Hue','Cần Thơ','Biên Hòa','Nha Trang','Vũng Tàu','Huế','Hải Phòng'] },
    { name: 'Thailand', code: 'TH', cities: ['Bangkok','Nonthaburi','Pak Kret','Chiang Mai','Hat Yai','Pattaya','Khon Kaen','Udon Thani','Nakhon Ratchasima'] },
    { name: 'Malaysia', code: 'MY', cities: ['Kuala Lumpur','George Town','Ipoh','Shah Alam','Petaling Jaya','Johor Bahru','Kota Kinabalu','Kuching'] },
    { name: 'Singapore', code: 'SG', cities: ['Singapore'] },
    { name: 'Myanmar', code: 'MM', cities: ['Naypyidaw','Yangon','Mandalay','Mawlamyine'] },
    { name: 'Sri Lanka', code: 'LK', cities: ['Colombo','Kandy','Galle','Jaffna','Negombo'] },
    { name: 'Nepal', code: 'NP', cities: ['Kathmandu','Pokhara','Lalitpur','Bharatpur','Biratnagar'] },
  ]},
  { continent: 'South America', countries: [
    { name: 'Brazil', code: 'BR', states: ['São Paulo','Rio de Janeiro','Minas Gerais','Bahia','Paraná','Rio Grande do Sul','Pernambuco','Ceará','Goiás','Maranhão','Santa Catarina','Espírito Santo','Amazonas','Mato Grosso','Pará'], cities: ['São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza','Belo Horizonte','Manaus','Curitiba','Recife','Porto Alegre','Goiânia','Belém','Guarulhos','Campinas','São Luís','São Gonçalo','Maceió','Duque de Caxias','Natal','Teresina','Florianópolis','Nova Iguaçu','Campo Grande','São Bernardo do Campo','João Pessoa'] },
    { name: 'Argentina', code: 'AR', states: ['Buenos Aires Province','Córdoba','Santa Fe','Mendoza','Tucumán','Entre Ríos','Salta','Misiones','Chaco','Corrientes'], cities: ['Buenos Aires','Córdoba','Rosario','Mendoza','Tucumán','Mar del Plata','La Plata','Salta','Santa Fe','San Juan'] },
    { name: 'Colombia', code: 'CO', states: ['Bogotá D.C.','Antioquia','Valle del Cauca','Cundinamarca','Atlántico'], cities: ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga','Cúcuta','Ibagué','Pereira','Manizales'] },
    { name: 'Chile', code: 'CL', cities: ['Santiago','Puente Alto','Antofagasta','Viña del Mar','Valparaíso','Concepción','Temuco','Rancagua','Talca','Arica'] },
    { name: 'Peru', code: 'PE', cities: ['Lima','Arequipa','Callao','Trujillo','Chiclayo','Iquitos','Piura','Cusco','Chimbote','Huancayo'] },
    { name: 'Venezuela', code: 'VE', cities: ['Caracas','Maracaibo','Valencia','Barquisimeto','Maracay','Ciudad Guayana'] },
    { name: 'Ecuador', code: 'EC', cities: ['Quito','Guayaquil','Cuenca','Santo Domingo','Machala','Manta'] },
    { name: 'Bolivia', code: 'BO', cities: ['Sucre','La Paz','Santa Cruz de la Sierra','Cochabamba','Oruro','Potosí'] },
    { name: 'Paraguay', code: 'PY', cities: ['Asunción','Ciudad del Este','San Lorenzo','Luque'] },
    { name: 'Uruguay', code: 'UY', cities: ['Montevideo','Salto','Paysandú','Las Piedras'] },
  ]},
  { continent: 'Oceania', countries: [
    { name: 'Australia', code: 'AU', states: ['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','Australian Capital Territory','Northern Territory'], cities: ['Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Newcastle','Canberra','Sunshine Coast','Wollongong','Logan City','Geelong','Hobart','Townsville','Cairns','Darwin','Toowoomba','Ballarat','Bendigo','Launceston'] },
    { name: 'New Zealand', code: 'NZ', cities: ['Auckland','Wellington','Christchurch','Hamilton','Tauranga','Napier-Hastings','Dunedin','Palmerston North','Nelson','Rotorua'] },
    { name: 'Papua New Guinea', code: 'PG', cities: ['Port Moresby','Lae','Arawa','Mount Hagen'] },
    { name: 'Fiji', code: 'FJ', cities: ['Suva','Nadi','Lautoka'] },
  ]},
  { continent: 'Middle East', countries: [
    { name: 'UAE', code: 'AE', states: ['Dubai','Abu Dhabi','Sharjah','Ajman','Fujairah','Ras Al Khaimah','Umm Al Quwain'], cities: ['Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Al Ain','Fujairah'] },
    { name: 'Saudi Arabia', code: 'SA', states: ['Riyadh Region','Makkah Region','Eastern Province','Madinah Region','Asir Region'], cities: ['Riyadh','Jeddah','Mecca','Medina','Dammam','Tabuk','Abha','Khobar','Taif','Buraidah'] },
    { name: 'Turkey', code: 'TR', states: ['Istanbul','Ankara','Izmir','Bursa','Antalya','Adana'], cities: ['Istanbul','Ankara','Izmir','Bursa','Adana','Gaziantep','Konya','Antalya','Kayseri','Mersin','Eskişehir','Diyarbakır','Samsun','Denizli'] },
    { name: 'Iran', code: 'IR', cities: ['Tehran','Mashhad','Isfahan','Karaj','Tabriz','Shiraz','Ahvaz','Qom','Bakhtaran'] },
    { name: 'Iraq', code: 'IQ', cities: ['Baghdad','Basra','Mosul','Erbil','Kirkuk','Sulaymaniyah'] },
    { name: 'Israel', code: 'IL', cities: ['Jerusalem','Tel Aviv','Haifa','Rishon LeZion','Petah Tikva','Ashdod','Netanya','Beer Sheva'] },
    { name: 'Jordan', code: 'JO', cities: ['Amman','Zarqa','Irbid','Aqaba','Russeifa'] },
    { name: 'Lebanon', code: 'LB', cities: ['Beirut','Tripoli','Sidon','Tyre'] },
    { name: 'Kuwait', code: 'KW', cities: ['Kuwait City','Al Ahmadi','Hawalli','As Salimiyyah'] },
    { name: 'Qatar', code: 'QA', cities: ['Doha','Al Rayyan','Umm Salal Muhammad','Al Wakrah'] },
    { name: 'Bahrain', code: 'BH', cities: ['Manama','Riffa','Muharraq','Hamad Town'] },
    { name: 'Oman', code: 'OM', cities: ['Muscat','Seeb','Salalah','Bawshar','Sohar'] },
    { name: 'Yemen', code: 'YE', cities: ['Sanaa','Aden','Taiz','Al Hudaydah'] },
    { name: 'Syria', code: 'SY', cities: ['Damascus','Aleppo','Homs','Latakia','Hama'] },
    { name: 'Azerbaijan', code: 'AZ', cities: ['Baku','Ganja','Sumqayit'] },
    { name: 'Armenia', code: 'AM', cities: ['Yerevan','Gyumri','Vanadzor'] },
    { name: 'Georgia', code: 'GE', cities: ['Tbilisi','Batumi','Kutaisi','Rustavi'] },
  ]},
  { continent: 'Central Asia', countries: [
    { name: 'Kazakhstan', code: 'KZ', cities: ['Almaty','Nur-Sultan (Astana)','Shymkent','Aktobe','Taraz'] },
    { name: 'Uzbekistan', code: 'UZ', cities: ['Tashkent','Samarkand','Namangan','Andijan','Bukhara'] },
    { name: 'Kyrgyzstan', code: 'KG', cities: ['Bishkek','Osh','Jalal-Abad'] },
    { name: 'Tajikistan', code: 'TJ', cities: ['Dushanbe','Khujand','Qurghonteppa'] },
    { name: 'Turkmenistan', code: 'TM', cities: ['Ashgabat','Türkmenabat','Mary','Balkanabat'] },
  ]},
];

type ScopeLevel = 'global' | 'continent' | 'country' | 'state' | 'city';
interface SelectedScope { level: ScopeLevel; continent?: string; country?: string; state?: string; city?: string; }

function scopeToDb(scope: SelectedScope): { geo_scope: string; geo_label: string } {
  if (scope.level === 'global') return { geo_scope: 'Global', geo_label: 'Global' };
  if (scope.level === 'continent') return { geo_scope: 'Country', geo_label: scope.continent! };
  if (scope.level === 'country') return { geo_scope: 'Country', geo_label: scope.country! };
  if (scope.level === 'state') return { geo_scope: 'Country', geo_label: `${scope.state}, ${scope.country}` };
  return { geo_scope: 'City', geo_label: scope.city! };
}
function scopeDisplayLabel(scope: SelectedScope): string {
  if (scope.level === 'global') return 'Global';
  if (scope.level === 'continent') return scope.continent!;
  if (scope.level === 'country') return scope.country!;
  if (scope.level === 'state') return scope.state!;
  return scope.city!;
}
function scopeSubLabel(scope: SelectedScope): string {
  if (scope.level === 'global') return 'Visible to everyone worldwide';
  if (scope.level === 'continent') return `Visible across ${scope.continent}`;
  if (scope.level === 'country') return `Visible across ${scope.country}`;
  if (scope.level === 'state') return `${scope.state}, ${scope.country}`;
  return 'City-level point';
}

function ScopeSelector({ value, onChange }: { value: SelectedScope; onChange: (s: SelectedScope) => void }) {
  const [step, setStep] = useState<'level' | 'continent' | 'country' | 'state-or-city'>('level');
  const [selContinent, setSelContinent] = useState<GeoRegion | null>(null);
  const [selCountry, setSelCountry] = useState<GeoCountry | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);

  const openAndReset = () => { setStep('level'); setSelContinent(null); setSelCountry(null); setSearchQuery(''); setIsOpen(true); };
  const close = () => { setIsOpen(false); setSearchQuery(''); };
  const choose = (s: SelectedScope) => { onChange(s); close(); };

  const detectLocation = async () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported in this browser'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const city = addr.city || addr.town || addr.village || addr.municipality || '';
          const country = addr.country || '';
          const continentMatch = GEO_HIERARCHY.find(r => r.countries.some(c => c.name.toLowerCase() === country.toLowerCase()));
          if (city) {
            choose({ level: 'city', continent: continentMatch?.continent, country: country || undefined, city });
            toast.success(`Scope set to ${city}`);
          } else if (country) {
            choose({ level: 'country', continent: continentMatch?.continent, country });
            toast.success(`Scope set to ${country}`);
          } else {
            choose({ level: 'global' });
          }
        } catch {
          toast.error('Could not determine location. Please select manually.');
        }
        setLocating(false);
      },
      () => { toast.error('Location access denied'); setLocating(false); }
    );
  };

  const searchResults = (() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { label: string; subLabel: string; scope: SelectedScope }[] = [];
    for (const region of GEO_HIERARCHY) {
      for (const country of region.countries) {
        if (country.name.toLowerCase().includes(q)) {
          results.push({ label: country.name, subLabel: region.continent, scope: { level: 'country', continent: region.continent, country: country.name } });
        }
        for (const state of country.states ?? []) {
          if (state.toLowerCase().includes(q)) {
            results.push({ label: state, subLabel: country.name, scope: { level: 'state', continent: region.continent, country: country.name, state } });
          }
        }
        for (const city of country.cities ?? []) {
          if (city.toLowerCase().includes(q)) {
            results.push({ label: city, subLabel: country.name, scope: { level: 'city', continent: region.continent, country: country.name, city } });
          }
        }
      }
    }
    return results.slice(0, 10);
  })();

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block">
        <Globe className="w-3 h-3 inline mr-1.5" />Scope <span className="text-[hsl(var(--accent-primary))]">*</span>
      </label>
      <button
        type="button"
        onClick={isOpen ? close : openAndReset}
        className="w-full flex items-center justify-between bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 hover:border-[hsl(var(--accent-primary))]/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--accent-primary))]/15 flex items-center justify-center">
            {value.level === 'global' ? <Globe className="w-4 h-4 text-[hsl(var(--accent-primary))]" /> : <MapPin className="w-4 h-4 text-[hsl(var(--accent-primary))]" />}
          </div>
          <div className="text-left min-w-0">
            <div className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">{scopeDisplayLabel(value)}</div>
            <div className="text-xs text-[hsl(var(--text-muted))] truncate">{scopeSubLabel(value)}</div>
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-[hsl(var(--text-muted))] flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl z-30 overflow-hidden">
          {/* Search + locate bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[hsl(var(--border-subtle))]">
            <Search className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none"
              placeholder="Search cities, states, countries…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-[hsl(var(--text-muted))]"><X className="w-3.5 h-3.5" /></button>}
            <button
              onClick={detectLocation}
              disabled={locating}
              title="Use my current location"
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-primary))]/10 disabled:opacity-50 transition-colors border border-[hsl(var(--accent-primary))]/20"
            >
              {locating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
              <span className="hidden sm:inline">{locating ? 'Locating…' : 'Locate me'}</span>
            </button>
          </div>

          {/* Search results OR browse */}
          {searchQuery.trim() ? (
            <div className="max-h-64 overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <p className="text-xs text-[hsl(var(--text-muted))] text-center py-6">No results for "{searchQuery}"</p>
              ) : searchResults.map((r, i) => (
                <button key={i} onClick={() => choose(r.scope)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--nav-hover-bg))] transition-colors text-left">
                  <MapPin className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[hsl(var(--text-primary))] font-medium">{r.label}</div>
                    <div className="text-xs text-[hsl(var(--text-muted))]">{r.subLabel} · {r.scope.level}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-[hsl(var(--text-muted))] border-b border-[hsl(var(--border-subtle))]/50">
                <button onClick={() => { setStep('level'); setSelContinent(null); setSelCountry(null); }} className={cn('hover:text-[hsl(var(--accent-primary))] transition-colors', step === 'level' && 'text-[hsl(var(--accent-primary))] font-semibold')}>Scope</button>
                {selContinent && <><ChevronRight className="w-3 h-3" /><button onClick={() => { setStep('continent'); setSelCountry(null); }} className={cn('hover:text-[hsl(var(--accent-primary))] transition-colors', step === 'continent' && 'text-[hsl(var(--accent-primary))] font-semibold')}>{selContinent.continent}</button></>}
                {selCountry && <><ChevronRight className="w-3 h-3" /><span className="text-[hsl(var(--accent-primary))] font-semibold">{selCountry.name}</span></>}
              </div>

              {step === 'level' && (
                <div className="p-2">
                  <button onClick={() => choose({ level: 'global' })} className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left', value.level === 'global' ? 'bg-[hsl(var(--accent-primary))]/10' : 'hover:bg-[hsl(var(--nav-hover-bg))]')}>
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0"><Globe className="w-4 h-4 text-blue-400" /></div>
                    <div><div className="text-sm font-semibold text-[hsl(var(--text-primary))]">Global</div><div className="text-xs text-[hsl(var(--text-muted))]">Visible to everyone worldwide</div></div>
                    {value.level === 'global' && <Check className="w-4 h-4 text-[hsl(var(--accent-primary))] ml-auto" />}
                  </button>
                  <div className="px-3 py-1.5"><div className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">By Region</div></div>
                  {GEO_HIERARCHY.map(region => (
                    <button key={region.continent} onClick={() => { setSelContinent(region); setStep('continent'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--nav-hover-bg))] transition-colors text-left">
                      <div className="flex-1 min-w-0"><div className="text-sm text-[hsl(var(--text-primary))]">{region.continent}</div><div className="text-xs text-[hsl(var(--text-muted))]">{region.countries.length} countries</div></div>
                      <ChevronRight className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                    </button>
                  ))}
                </div>
              )}
              {step === 'continent' && selContinent && (
                <div className="p-2">
                  <button onClick={() => choose({ level: 'continent', continent: selContinent.continent })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--nav-hover-bg))] transition-colors text-left mb-1">
                    <Globe className="w-4 h-4 text-[hsl(var(--text-muted))]" /><div className="flex-1"><div className="text-sm font-medium text-[hsl(var(--text-primary))]">All of {selContinent.continent}</div><div className="text-xs text-[hsl(var(--text-muted))]">Target the whole continent</div></div>
                    {value.level === 'continent' && value.continent === selContinent.continent && <Check className="w-4 h-4 text-[hsl(var(--accent-primary))]" />}
                  </button>
                  <div className="px-3 py-1"><div className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Specific Country</div></div>
                  {selContinent.countries.map(country => (
                    <button key={country.code} onClick={() => { setSelCountry(country); if (country.states || country.cities) { setStep('state-or-city'); } else { choose({ level: 'country', continent: selContinent.continent, country: country.name }); } }}
                      className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left', value.country === country.name && value.level === 'country' ? 'bg-[hsl(var(--accent-primary))]/10' : 'hover:bg-[hsl(var(--nav-hover-bg))]')}>
                      <div className="flex-1 text-sm text-[hsl(var(--text-primary))]">{country.name}</div>
                      {(country.states || country.cities) && <ChevronRight className="w-4 h-4 text-[hsl(var(--text-muted))]" />}
                      {value.country === country.name && value.level === 'country' && <Check className="w-4 h-4 text-[hsl(var(--accent-primary))]" />}
                    </button>
                  ))}
                </div>
              )}
              {step === 'state-or-city' && selCountry && (
                <div className="p-2">
                  <button onClick={() => choose({ level: 'country', continent: selContinent?.continent, country: selCountry.name })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--nav-hover-bg))] transition-colors text-left mb-1">
                    <Globe className="w-4 h-4 text-[hsl(var(--text-muted))]" /><div className="flex-1"><div className="text-sm font-medium text-[hsl(var(--text-primary))]">All of {selCountry.name}</div><div className="text-xs text-[hsl(var(--text-muted))]">Target the whole country</div></div>
                    {value.country === selCountry.name && value.level === 'country' && <Check className="w-4 h-4 text-[hsl(var(--accent-primary))]" />}
                  </button>
                  {selCountry.states && selCountry.states.length > 0 && (<>
                    <div className="px-3 py-1"><div className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">State / Region</div></div>
                    {selCountry.states.map(state => (
                      <button key={state} onClick={() => choose({ level: 'state', continent: selContinent?.continent, country: selCountry.name, state })}
                        className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left', value.state === state ? 'bg-[hsl(var(--accent-primary))]/10' : 'hover:bg-[hsl(var(--nav-hover-bg))]')}>
                        <div className="flex-1 text-sm text-[hsl(var(--text-primary))]">{state}</div>
                        {value.state === state && <Check className="w-4 h-4 text-[hsl(var(--accent-primary))]" />}
                      </button>
                    ))}
                  </>)}
                  {selCountry.cities && selCountry.cities.length > 0 && (<>
                    <div className="px-3 py-1 mt-1"><div className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">City</div></div>
                    {selCountry.cities.map(city => (
                      <button key={city} onClick={() => choose({ level: 'city', continent: selContinent?.continent, country: selCountry.name, city })}
                        className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left', value.city === city ? 'bg-[hsl(var(--accent-primary))]/10' : 'hover:bg-[hsl(var(--nav-hover-bg))]')}>
                        <MapPin className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] flex-shrink-0" />
                        <div className="flex-1 text-sm text-[hsl(var(--text-primary))]">{city}</div>
                        {value.city === city && <Check className="w-4 h-4 text-[hsl(var(--accent-primary))]" />}
                      </button>
                    ))}
                  </>)}
                </div>
              )}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-[hsl(var(--border-subtle))] text-xs text-[hsl(var(--text-muted))] flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />Scope controls who sees your point. Narrower = more targeted audience.
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setUploading(true);
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (!sbUser) { setUploading(false); toast.error('Not signed in'); return; }
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${sbUser.id}/thought-images/${generateId()}.${ext}`;
    const arrayBuf = await file.arrayBuffer();
    const { error } = await supabase.storage.from('avatars').upload(path, new Uint8Array(arrayBuf), { contentType: file.type, upsert: false });
    if (error) { setUploading(false); toast.error('Upload failed: ' + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    onChange(publicUrl);
    setUploading(false);
    toast.success('Image uploaded');
  };

  return (
    <div>
      <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block">
        <ImageIcon className="w-3 h-3 inline mr-1.5" />Point Image
        <span className="font-normal normal-case tracking-normal ml-1 text-[hsl(var(--text-muted))]/60">optional</span>
      </label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-[hsl(var(--border-subtle))]">
          <img src={value} alt="Point image" className="w-full aspect-video object-cover" />
          <button onClick={() => onChange(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[hsl(var(--border-subtle))] rounded-xl py-8 text-[hsl(var(--text-muted))] hover:border-[hsl(var(--accent-primary))]/30 hover:text-[hsl(var(--text-secondary))] transition-colors disabled:opacity-60">
          {uploading ? <><RefreshCw className="w-6 h-6 animate-spin" /><span className="text-xs">Uploading...</span></>
            : <><Upload className="w-6 h-6" /><span className="text-xs">Click to upload an image</span><span className="text-[10px] text-[hsl(var(--text-muted))]/60">JPG, PNG, WEBP · max 10MB</span></>}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}



type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function Compose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const { user: authUser } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category>('Life');
  const [scope, setScope] = useState<SelectedScope>({ level: 'global' });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(draftId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPublishing = useRef(false);

  useEffect(() => {
    if (!draftId || !authUser) return;
    supabase.from('thoughts').select('*').eq('id', draftId).eq('author_id', authUser.id).eq('is_draft', true).single().then(({ data }) => {
      if (!data) return;
      setTitle(data.title === 'Untitled draft' ? '' : (data.title ?? ''));
      setBody(data.body ?? '');
      setCategory((data.category as Category) ?? 'Life');
      setImageUrl(data.image_url ?? null);
    });
  }, [draftId, authUser]);

  const autoSave = useCallback(async (currentTitle: string, currentBody: string, currentCategory: Category, currentScope: SelectedScope, currentImageUrl: string | null) => {
    if (isPublishing.current) return;
    if (!currentTitle.trim() && !currentBody.trim()) return;
    if (!authUser) return;
    setSaveStatus('saving');
    const { geo_scope, geo_label } = scopeToDb(currentScope);
    const payload = { author_id: authUser.id, title: currentTitle.trim() || 'Untitled draft', body: currentBody.trim(), category: currentCategory, geo_scope, geo_label, image_url: currentImageUrl ?? null, is_draft: true, published_at: new Date().toISOString() };
    if (activeDraftId) {
      const { error } = await supabase.from('thoughts').update(payload).eq('id', activeDraftId);
      setSaveStatus(error ? 'error' : 'saved');
    } else {
      const { data, error } = await supabase.from('thoughts').insert(payload).select('id').single();
      if (!error && data) { setActiveDraftId(data.id); setSaveStatus('saved'); } else { setSaveStatus('error'); }
    }
  }, [authUser, activeDraftId]);

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (!title.trim() && !body.trim()) { setSaveStatus('idle'); return; }
    setSaveStatus('saving');
    autoSaveTimer.current = setTimeout(() => { autoSave(title, body, category, scope, imageUrl); }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [title, body, category, scope, imageUrl]);

  const handlePublish = async () => {
    if (!title.trim()) { toast.error('Your point needs a title'); return; }
    if (!body.trim()) { toast.error('Explain your reasoning'); return; }
    if (!authUser) { toast.error('Please sign in to publish'); return; }
    isPublishing.current = true;
    setPublishing(true);
    const { geo_scope, geo_label } = scopeToDb(scope);
    if (activeDraftId) {
      const { error } = await supabase.from('thoughts').update({ title: title.trim(), body: body.trim(), category, geo_scope, geo_label, image_url: imageUrl ?? null, is_draft: false, published_at: new Date().toISOString() }).eq('id', activeDraftId);
      setPublishing(false);
      if (error) { toast.error('Failed to publish: ' + error.message); isPublishing.current = false; return; }
    } else {
      const { error } = await supabase.from('thoughts').insert({ author_id: authUser.id, title: title.trim(), body: body.trim(), category, geo_scope, geo_label, image_url: imageUrl ?? null, is_draft: false, published_at: new Date().toISOString() });
      setPublishing(false);
      if (error) { toast.error('Failed to publish: ' + error.message); isPublishing.current = false; return; }
    }
    toast.success('Point published!');
    navigate('/my-thoughts');
  };

  const saveStatusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save failed' : '';

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-0.5">Make a Point</h1>
            <p className="text-sm text-[hsl(var(--text-muted))]">Be honest. State your truth. Explain your reasoning.</p>
          </div>
          {saveStatus !== 'idle' && (
            <div className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors',
              saveStatus === 'saved' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
              saveStatus === 'saving' ? 'text-[hsl(var(--text-muted))] border-[hsl(var(--border-subtle))]' :
              'text-red-400 border-red-500/30 bg-red-500/10')}>
              {saveStatus === 'saving' ? <RefreshCw className="w-3 h-3 animate-spin" /> : saveStatus === 'saved' ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
              {saveStatusLabel}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block">Your Point <span className="text-[hsl(var(--accent-primary))]">*</span></label>
            <input className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50 transition-colors font-serif text-lg"
              placeholder="What do you honestly believe?" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
            <div className="text-right text-xs text-[hsl(var(--text-muted))] mt-1">{title.length}/200</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Your Reasoning <span className="text-[hsl(var(--accent-primary))]">*</span></label>
              <div className="flex items-center gap-0.5 bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-lg p-0.5">
                <button onClick={() => setPreviewMode(false)} className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors', !previewMode ? 'bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}><Code2 className="w-3 h-3" />Write</button>
                <button onClick={() => setPreviewMode(true)} className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors', previewMode ? 'bg-[hsl(var(--accent-primary))] text-[hsl(var(--accent-fg))]' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]')}><Eye className="w-3 h-3" />Preview</button>
              </div>
            </div>
  {previewMode ? (
  <div className="min-h-[160px] bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
  {body ? <MarkdownRenderer content={body} /> : <p className="text-[hsl(var(--text-muted))]">Nothing to preview yet…</p>}
  </div>
  ) : (
              <>
                <textarea className="w-full bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] outline-none focus:border-[hsl(var(--accent-primary))]/50 transition-colors resize-none text-sm leading-relaxed min-h-[160px] font-mono"
  placeholder={"Why do you think this? Share your honest reasoning...\n\nSupports **bold**, *italic*, # headings, > quotes, - lists, and ![Alt text](https://example.com/image.gif)"} value={body} onChange={e => setBody(e.target.value)} rows={8} />
  <p className="text-[10px] text-[hsl(var(--text-muted))]/70 mt-1">Markdown: **bold** · *italic* · # Heading · {'>'} Quote · - List · ![Alt text](image-or-gif-url)</p>
              </>
            )}
          </div>

          <ImageUpload value={imageUrl} onChange={setImageUrl} />

          <div className="relative">
            <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 block"><Hash className="w-3 h-3 inline mr-1.5" />Topic <span className="text-[hsl(var(--accent-primary))]">*</span></label>
            <button onClick={() => setShowCatDropdown(v => !v)} className="w-full flex items-center justify-between bg-[hsl(var(--input-bg))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--text-primary))] hover:border-[hsl(var(--accent-primary))]/40 transition-colors">
              <span>{category}</span>
              <ChevronDown className={cn('w-4 h-4 text-[hsl(var(--text-muted))] transition-transform', showCatDropdown && 'rotate-180')} />
            </button>
            {showCatDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { setCategory(cat); setShowCatDropdown(false); }} className={cn('w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between', cat === category ? 'bg-[hsl(var(--accent-primary))]/15 text-[hsl(var(--accent-primary))]' : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--nav-hover-bg))]')}>
                    {cat} {cat === category && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ScopeSelector value={scope} onChange={setScope} />

          <div className="flex gap-3 pt-2">
            <button onClick={handlePublish} disabled={publishing}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[hsl(var(--accent-primary))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-fg))] font-semibold text-sm transition-colors disabled:opacity-60">
              {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {publishing ? 'Publishing…' : 'Publish Point'}
            </button>
          </div>

          <p className="text-xs text-center text-[hsl(var(--text-muted))]">
            Your work is auto-saved as a draft every 2 seconds. View drafts in <button onClick={() => navigate('/drafts')} className="underline hover:text-[hsl(var(--accent-primary))]">Drafts</button>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
