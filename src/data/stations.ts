// Major Indian railway station coordinates
// Format: { code: { name, lat, lng, state } }

export interface StationInfo {
  name: string;
  lat: number;
  lng: number;
  state: string;
}

export const stationCoordinates: Record<string, StationInfo> = {
  // Karnataka
  SMVB: { name: "SMVT Bengaluru", lat: 13.0165, lng: 77.5681, state: "Karnataka" },
  SBC: { name: "KSR Bengaluru", lat: 12.9784, lng: 77.5713, state: "Karnataka" },
  YPR: { name: "Yesvantpur Jn", lat: 13.0358, lng: 77.5543, state: "Karnataka" },
  BNC: { name: "Bangalore Cantt", lat: 12.9956, lng: 77.5653, state: "Karnataka" },
  WFD: { name: "Whitefield", lat: 12.9948, lng: 77.7530, state: "Karnataka" },
  BWT: { name: "Bangarapet", lat: 12.9913, lng: 78.1784, state: "Karnataka" },
  KJM: { name: "Krishnarajapuram", lat: 13.0094, lng: 77.6807, state: "Karnataka" },
  HSRA: { name: "Hosur", lat: 12.7409, lng: 77.8253, state: "Karnataka" },
  MYS: { name: "Mysuru Jn", lat: 12.3059, lng: 76.6553, state: "Karnataka" },
  UBL: { name: "Hubballi Jn", lat: 15.3518, lng: 75.0921, state: "Karnataka" },
  GDG: { name: "Gadag Jn", lat: 15.4168, lng: 75.6264, state: "Karnataka" },
  BJU: { name: "Belgaum", lat: 15.8497, lng: 74.4977, state: "Karnataka" },
  DWR: { name: "Dharwad", lat: 15.4624, lng: 74.9987, state: "Karnataka" },
  BAND: { name: "Banaswadi", lat: 13.0167, lng: 77.6396, state: "Karnataka" },
  SUR: { name: "Solapur Jn", lat: 17.6719, lng: 75.9064, state: "Maharashtra" },
  SMET: { name: "Shivamogga Town", lat: 13.9299, lng: 75.5681, state: "Karnataka" },
  DVG: { name: "Davanagere", lat: 14.4644, lng: 75.9218, state: "Karnataka" },
  BAY: { name: "Ballari Jn", lat: 15.1394, lng: 76.9214, state: "Karnataka" },
  GTL: { name: "Guntakal Jn", lat: 15.1711, lng: 77.3674, state: "Andhra Pradesh" },

  // Tamil Nadu
  JTJ: { name: "Jolarpettai Jn", lat: 12.5689, lng: 78.5731, state: "Tamil Nadu" },
  KPD: { name: "Katpadi Jn", lat: 12.9693, lng: 79.1451, state: "Tamil Nadu" },
  PER: { name: "Perambur", lat: 13.1119, lng: 80.2401, state: "Tamil Nadu" },
  MAS: { name: "Chennai Central", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  MS: { name: "Chennai Egmore", lat: 13.0732, lng: 80.2609, state: "Tamil Nadu" },
  MSB: { name: "Chennai Beach", lat: 13.0991, lng: 80.2944, state: "Tamil Nadu" },
  MDU: { name: "Madurai Jn", lat: 9.9201, lng: 78.1197, state: "Tamil Nadu" },
  TPJ: { name: "Tiruchirappalli Jn", lat: 10.8190, lng: 78.6900, state: "Tamil Nadu" },
  SA: { name: "Salem Jn", lat: 11.6596, lng: 78.1530, state: "Tamil Nadu" },
  CBE: { name: "Coimbatore Jn", lat: 11.0018, lng: 76.9629, state: "Tamil Nadu" },
  ED: { name: "Erode Jn", lat: 11.3480, lng: 77.7148, state: "Tamil Nadu" },
  TEN: { name: "Tirunelveli Jn", lat: 8.7110, lng: 77.7106, state: "Tamil Nadu" },
  NCJ: { name: "Nagercoil Jn", lat: 8.1758, lng: 77.4290, state: "Tamil Nadu" },
  RMM: { name: "Rameswaram", lat: 9.2876, lng: 79.3129, state: "Tamil Nadu" },
  AJJ: { name: "Arakkonam Jn", lat: 13.0793, lng: 79.6710, state: "Tamil Nadu" },
  PDY: { name: "Puducherry", lat: 11.9345, lng: 79.8297, state: "Puducherry" },
  VM: { name: "Villupuram Jn", lat: 11.9326, lng: 79.4877, state: "Tamil Nadu" },

  // Andhra Pradesh
  GDR: { name: "Gudur Jn", lat: 14.1483, lng: 79.8477, state: "Andhra Pradesh" },
  OGL: { name: "Ongole", lat: 15.5057, lng: 80.0499, state: "Andhra Pradesh" },
  BZA: { name: "Vijayawada Jn", lat: 16.5175, lng: 80.6186, state: "Andhra Pradesh" },
  VSKP: { name: "Visakhapatnam", lat: 17.7215, lng: 83.2972, state: "Andhra Pradesh" },
  RJY: { name: "Rajahmundry", lat: 17.0005, lng: 81.7799, state: "Andhra Pradesh" },
  GNT: { name: "Guntur Jn", lat: 16.3060, lng: 80.4365, state: "Andhra Pradesh" },
  TPTY: { name: "Tirupati", lat: 13.6288, lng: 79.4192, state: "Andhra Pradesh" },
  NDL: { name: "Nandyal", lat: 15.4750, lng: 78.4836, state: "Andhra Pradesh" },
  KCP: { name: "Kakinada Port", lat: 16.9602, lng: 82.2475, state: "Andhra Pradesh" },
  NLDA: { name: "Nellore", lat: 14.4426, lng: 79.9865, state: "Andhra Pradesh" },
  RU: { name: "Renigunta Jn", lat: 13.6507, lng: 79.5134, state: "Andhra Pradesh" },
  ATP: { name: "Anantapur", lat: 14.6819, lng: 77.6006, state: "Andhra Pradesh" },

  // Telangana
  WL: { name: "Warangal", lat: 17.9784, lng: 79.5941, state: "Telangana" },
  SC: { name: "Secunderabad Jn", lat: 17.4337, lng: 78.5016, state: "Telangana" },
  HYB: { name: "Hyderabad Deccan", lat: 17.3616, lng: 78.4747, state: "Telangana" },
  KZJ: { name: "Kazipet Jn", lat: 17.9573, lng: 79.5368, state: "Telangana" },
  KRNT: { name: "Kurnool Town", lat: 15.8281, lng: 78.0373, state: "Andhra Pradesh" },
  NZB: { name: "Nizamabad", lat: 18.6780, lng: 78.0920, state: "Telangana" },
  KMT: { name: "Khammam", lat: 17.2473, lng: 80.1514, state: "Telangana" },

  // Maharashtra
  BPQ: { name: "Balharshah", lat: 19.8460, lng: 79.3363, state: "Maharashtra" },
  CD: { name: "Chandrapur", lat: 19.9615, lng: 79.2961, state: "Maharashtra" },
  SEGM: { name: "Sevagram", lat: 20.7308, lng: 78.6773, state: "Maharashtra" },
  NGP: { name: "Nagpur", lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
  BSL: { name: "Bhusaval Jn", lat: 21.0473, lng: 75.7789, state: "Maharashtra" },
  MMR: { name: "Manmad Jn", lat: 20.2510, lng: 74.4363, state: "Maharashtra" },
  CSMT: { name: "Mumbai CSMT", lat: 18.9398, lng: 72.8355, state: "Maharashtra" },
  LTT: { name: "Mumbai LTT", lat: 19.0692, lng: 72.8889, state: "Maharashtra" },
  PNVL: { name: "Panvel", lat: 18.9936, lng: 73.1198, state: "Maharashtra" },
  PNE: { name: "Pune Jn", lat: 18.5285, lng: 73.8743, state: "Maharashtra" },
  KYN: { name: "Kalyan Jn", lat: 19.2437, lng: 73.1355, state: "Maharashtra" },
  NED: { name: "Nanded", lat: 19.1520, lng: 77.3184, state: "Maharashtra" },
  AK: { name: "Akola Jn", lat: 20.7073, lng: 77.0079, state: "Maharashtra" },
  AWB: { name: "Aurangabad", lat: 19.8640, lng: 75.3177, state: "Maharashtra" },
  KOL: { name: "Kolhapur", lat: 16.6913, lng: 74.2337, state: "Maharashtra" },
  SNSI: { name: "Sainagar Shirdi", lat: 19.7990, lng: 74.4783, state: "Maharashtra" },
  WD: { name: "Wardha", lat: 20.7453, lng: 78.5990, state: "Maharashtra" },

  // Madhya Pradesh
  ET: { name: "Itarsi Jn", lat: 22.6132, lng: 77.7590, state: "Madhya Pradesh" },
  JBP: { name: "Jabalpur", lat: 23.1702, lng: 79.9493, state: "Madhya Pradesh" },
  STA: { name: "Satna", lat: 24.5672, lng: 80.8322, state: "Madhya Pradesh" },
  MKP: { name: "Manikpur Jn", lat: 25.0541, lng: 80.6120, state: "Madhya Pradesh" },
  BPL: { name: "Bhopal Jn", lat: 23.2688, lng: 77.4122, state: "Madhya Pradesh" },
  BIH: { name: "Bina Jn", lat: 24.1769, lng: 78.1340, state: "Madhya Pradesh" },
  GWL: { name: "Gwalior Jn", lat: 26.2183, lng: 78.1828, state: "Madhya Pradesh" },
  KOTA: { name: "Kota Jn", lat: 25.1724, lng: 75.8429, state: "Rajasthan" },
  UJN: { name: "Ujjain Jn", lat: 23.1793, lng: 75.7849, state: "Madhya Pradesh" },
  RTM: { name: "Ratlam Jn", lat: 23.3307, lng: 75.0389, state: "Madhya Pradesh" },
  IDR: { name: "Indore Jn", lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
  KTE: { name: "Katni Jn", lat: 23.8308, lng: 80.3929, state: "Madhya Pradesh" },
  HBJ: { name: "Habibganj", lat: 23.2331, lng: 77.4382, state: "Madhya Pradesh" },
  RWA: { name: "Rewa", lat: 24.5373, lng: 81.3042, state: "Madhya Pradesh" },

  // Uttar Pradesh
  PCOI: { name: "Prayagraj Cheoki", lat: 25.3169, lng: 81.8772, state: "Uttar Pradesh" },
  DDU: { name: "Pt. DD Upadhyaya Jn", lat: 25.2736, lng: 83.0078, state: "Uttar Pradesh" },
  ALD: { name: "Prayagraj Jn", lat: 25.4358, lng: 81.8463, state: "Uttar Pradesh" },
  PRYJ: { name: "Prayagraj Jn", lat: 25.4358, lng: 81.8463, state: "Uttar Pradesh" },
  SFG: { name: "Subedarganj", lat: 25.4210, lng: 81.8680, state: "Uttar Pradesh" },
  MZP: { name: "Mirzapur", lat: 25.1460, lng: 82.5690, state: "Uttar Pradesh" },
  BSB: { name: "Varanasi Jn", lat: 25.3176, lng: 83.0107, state: "Uttar Pradesh" },
  LKO: { name: "Lucknow Charbagh", lat: 26.8355, lng: 80.9180, state: "Uttar Pradesh" },
  LJN: { name: "Lucknow Jn", lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
  CNB: { name: "Kanpur Central", lat: 26.4535, lng: 80.3487, state: "Uttar Pradesh" },
  AGC: { name: "Agra Cantt", lat: 27.1631, lng: 78.0081, state: "Uttar Pradesh" },
  MTJ: { name: "Mathura Jn", lat: 27.4924, lng: 77.6737, state: "Uttar Pradesh" },
  GKP: { name: "Gorakhpur", lat: 26.7451, lng: 83.3640, state: "Uttar Pradesh" },
  MB: { name: "Moradabad", lat: 28.8376, lng: 78.7733, state: "Uttar Pradesh" },
  JHS: { name: "Jhansi Jn", lat: 25.4431, lng: 78.5706, state: "Uttar Pradesh" },
  AF: { name: "Agra Fort", lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
  MEE: { name: "Meerut City", lat: 28.9845, lng: 77.7064, state: "Uttar Pradesh" },
  NDLS: { name: "New Delhi", lat: 28.6429, lng: 77.2195, state: "Delhi" },

  // Delhi
  DLI: { name: "Old Delhi", lat: 28.6615, lng: 77.2278, state: "Delhi" },
  DEE: { name: "Delhi Sarai Rohilla", lat: 28.6647, lng: 77.1866, state: "Delhi" },
  NZM: { name: "Hazrat Nizamuddin", lat: 28.5897, lng: 77.2527, state: "Delhi" },
  ANVT: { name: "Anand Vihar Terminal", lat: 28.6507, lng: 77.3152, state: "Delhi" },
  ANVR: { name: "Anand Vihar", lat: 28.6507, lng: 77.3152, state: "Delhi" },

  // Bihar
  BXR: { name: "Buxar", lat: 25.5745, lng: 83.9784, state: "Bihar" },
  ARA: { name: "Ara Jn", lat: 25.5657, lng: 84.6611, state: "Bihar" },
  DNR: { name: "Danapur", lat: 25.6228, lng: 85.0482, state: "Bihar" },
  PNBE: { name: "Patna Jn", lat: 25.6069, lng: 85.1349, state: "Bihar" },
  PPTA: { name: "Patliputra Jn", lat: 25.6255, lng: 85.0878, state: "Bihar" },
  RJPB: { name: "Rajendra Nagar Patna", lat: 25.5867, lng: 85.0899, state: "Bihar" },
  BGP: { name: "Bhagalpur", lat: 25.2425, lng: 87.0040, state: "Bihar" },
  MKA: { name: "Mokama Jn", lat: 25.3870, lng: 85.9185, state: "Bihar" },
  JMP: { name: "Jamalpur Jn", lat: 25.3119, lng: 86.4886, state: "Bihar" },
  KIR: { name: "Katihar Jn", lat: 25.5523, lng: 87.5720, state: "Bihar" },
  MFP: { name: "Muzaffarpur Jn", lat: 26.1197, lng: 85.3910, state: "Bihar" },
  DBG: { name: "Darbhanga Jn", lat: 26.1542, lng: 85.9006, state: "Bihar" },
  SPJ: { name: "Samastipur Jn", lat: 25.8560, lng: 85.7898, state: "Bihar" },
  SEE: { name: "Sonpur Jn", lat: 25.6725, lng: 85.1782, state: "Bihar" },
  RGD: { name: "Rajgir", lat: 25.0284, lng: 85.4196, state: "Bihar" },
  GAYA: { name: "Gaya Jn", lat: 24.7979, lng: 84.9991, state: "Bihar" },
  PNME: { name: "Parasnath", lat: 24.0121, lng: 86.1266, state: "Jharkhand" },

  // West Bengal
  HWH: { name: "Howrah Jn", lat: 22.5839, lng: 88.3428, state: "West Bengal" },
  SDAH: { name: "Sealdah", lat: 22.5699, lng: 88.3705, state: "West Bengal" },
  BWN: { name: "Barddhaman Jn", lat: 23.2518, lng: 87.8618, state: "West Bengal" },
  ASN: { name: "Asansol Jn", lat: 23.6832, lng: 86.9525, state: "West Bengal" },
  DGR: { name: "Durgapur", lat: 23.4851, lng: 87.3190, state: "West Bengal" },
  BHP: { name: "Bolpur", lat: 23.6693, lng: 87.7094, state: "West Bengal" },
  RPH: { name: "Rampurhat", lat: 24.1768, lng: 87.7834, state: "West Bengal" },
  NJP: { name: "New Jalpaiguri", lat: 26.7050, lng: 88.4296, state: "West Bengal" },
  KGP: { name: "Kharagpur Jn", lat: 22.3460, lng: 87.3236, state: "West Bengal" },

  // Jharkhand
  RNC: { name: "Ranchi", lat: 23.3145, lng: 85.3218, state: "Jharkhand" },
  TATA: { name: "Tatanagar Jn", lat: 22.7854, lng: 86.1893, state: "Jharkhand" },
  DHN: { name: "Dhanbad Jn", lat: 23.7957, lng: 86.4304, state: "Jharkhand" },
  BKSC: { name: "Bokaro Steel City", lat: 23.6693, lng: 86.1511, state: "Jharkhand" },
  JSG: { name: "Jasidih Jn", lat: 24.5146, lng: 86.6448, state: "Jharkhand" },
  GMO: { name: "Gomoh Jn", lat: 23.8781, lng: 86.1571, state: "Jharkhand" },
  HZD: { name: "Hazaribagh Road", lat: 24.0053, lng: 85.4229, state: "Jharkhand" },

  // Odisha
  BBS: { name: "Bhubaneswar", lat: 20.2700, lng: 85.8393, state: "Odisha" },
  CTC: { name: "Cuttack Jn", lat: 20.4625, lng: 85.8830, state: "Odisha" },
  PURI: { name: "Puri", lat: 19.8050, lng: 85.8190, state: "Odisha" },
  SBP: { name: "Sambalpur Jn", lat: 21.4562, lng: 83.9686, state: "Odisha" },
  ROU: { name: "Rourkela Jn", lat: 22.2604, lng: 84.8536, state: "Odisha" },
  BAM: { name: "Brahmapur", lat: 19.3150, lng: 84.7941, state: "Odisha" },
  BHC: { name: "Balasore", lat: 21.4934, lng: 86.9135, state: "Odisha" },
  KUR: { name: "Khurda Road Jn", lat: 20.1818, lng: 85.6298, state: "Odisha" },
  VSKP2: { name: "Vizianagaram Jn", lat: 18.1175, lng: 83.4110, state: "Andhra Pradesh" },

  // Rajasthan
  JP: { name: "Jaipur Jn", lat: 26.9196, lng: 75.7878, state: "Rajasthan" },
  JU: { name: "Jodhpur Jn", lat: 26.2879, lng: 73.0175, state: "Rajasthan" },
  UDZ: { name: "Udaipur City", lat: 24.5812, lng: 73.6847, state: "Rajasthan" },
  AII: { name: "Ajmer Jn", lat: 26.4534, lng: 74.6399, state: "Rajasthan" },
  BKN: { name: "Bikaner Jn", lat: 28.0229, lng: 73.3069, state: "Rajasthan" },
  ABR: { name: "Abu Road", lat: 24.4782, lng: 72.7811, state: "Rajasthan" },
  AWR: { name: "Alwar", lat: 27.5559, lng: 76.6110, state: "Rajasthan" },
  SGNR: { name: "Sri Ganganagar", lat: 29.9208, lng: 73.8734, state: "Rajasthan" },
  SWM: { name: "Sawai Madhopur", lat: 26.0224, lng: 76.3558, state: "Rajasthan" },

  // Gujarat
  ADI: { name: "Ahmedabad Jn", lat: 23.0258, lng: 72.6003, state: "Gujarat" },
  ST: { name: "Surat", lat: 21.2051, lng: 72.8411, state: "Gujarat" },
  BRC: { name: "Vadodara Jn", lat: 22.3102, lng: 73.1818, state: "Gujarat" },
  RJT: { name: "Rajkot Jn", lat: 22.2916, lng: 70.7840, state: "Gujarat" },
  BDTS: { name: "Bandra Terminus", lat: 19.0543, lng: 72.8398, state: "Maharashtra" },
  UDN: { name: "Udhna Jn", lat: 21.1780, lng: 72.8398, state: "Gujarat" },
  BH: { name: "Bharuch Jn", lat: 21.7051, lng: 72.9959, state: "Gujarat" },
  GNC: { name: "Gandhinagar Capital", lat: 23.2228, lng: 72.6515, state: "Gujarat" },

  // Punjab
  CDG: { name: "Chandigarh", lat: 30.6920, lng: 76.7841, state: "Chandigarh" },
  ASR: { name: "Amritsar Jn", lat: 31.6340, lng: 74.8723, state: "Punjab" },
  LDH: { name: "Ludhiana Jn", lat: 30.8864, lng: 75.8524, state: "Punjab" },
  JUC: { name: "Jalandhar City", lat: 31.3135, lng: 75.5749, state: "Punjab" },
  PTK: { name: "Pathankot", lat: 32.2643, lng: 75.6399, state: "Punjab" },
  FZR: { name: "Firozpur Cantt", lat: 30.9330, lng: 74.6196, state: "Punjab" },
  BTI: { name: "Bhatinda Jn", lat: 30.2110, lng: 74.9455, state: "Punjab" },

  // Haryana
  GGN: { name: "Gurugram", lat: 28.4595, lng: 77.0266, state: "Haryana" },
  AMB: { name: "Ambala Cantt", lat: 30.3752, lng: 76.7911, state: "Haryana" },
  KKDE: { name: "Kurukshetra", lat: 29.9695, lng: 76.8783, state: "Haryana" },
  HSR: { name: "Hisar", lat: 29.1526, lng: 75.7266, state: "Haryana" },
  ROK: { name: "Rohtak Jn", lat: 28.8927, lng: 76.5994, state: "Haryana" },
  PNP: { name: "Panipat Jn", lat: 29.3883, lng: 76.9694, state: "Haryana" },
  KUN: { name: "Karnal", lat: 29.6857, lng: 76.9905, state: "Haryana" },

  // Kerala
  ERS: { name: "Ernakulam Jn", lat: 9.9816, lng: 76.2999, state: "Kerala" },
  TVC: { name: "Thiruvananthapuram", lat: 8.4889, lng: 76.9525, state: "Kerala" },
  CLT: { name: "Kozhikode", lat: 11.2588, lng: 75.7804, state: "Kerala" },
  TCR: { name: "Thrissur", lat: 10.5276, lng: 76.2144, state: "Kerala" },
  SRR: { name: "Shoranur Jn", lat: 10.7620, lng: 76.2695, state: "Kerala" },
  PGT: { name: "Palakkad Jn", lat: 10.7759, lng: 76.6534, state: "Kerala" },
  CAN: { name: "Kannur", lat: 11.8745, lng: 75.3704, state: "Kerala" },
  QLN: { name: "Kollam Jn", lat: 8.8932, lng: 76.6141, state: "Kerala" },
  AWY: { name: "Alappuzha", lat: 9.4981, lng: 76.3388, state: "Kerala" },
  KTYM: { name: "Kottayam", lat: 9.5916, lng: 76.5222, state: "Kerala" },
  MAQ: { name: "Mangaluru Central", lat: 12.8700, lng: 74.8815, state: "Karnataka" },

  // Goa
  MAO: { name: "Madgaon", lat: 15.2832, lng: 74.0465, state: "Goa" },
  KRMI: { name: "Karmali", lat: 15.4872, lng: 73.9044, state: "Goa" },
  THVM: { name: "Thivim", lat: 15.5366, lng: 73.9528, state: "Goa" },

  // Chhattisgarh
  R: { name: "Raipur Jn", lat: 21.2514, lng: 81.6296, state: "Chhattisgarh" },
  BSP: { name: "Bilaspur Jn", lat: 22.0796, lng: 82.1409, state: "Chhattisgarh" },
  DURG: { name: "Durg Jn", lat: 21.1904, lng: 81.2849, state: "Chhattisgarh" },

  // Assam & NE
  GHY: { name: "Guwahati", lat: 26.1734, lng: 91.7534, state: "Assam" },
  DPR: { name: "Dibrugarh", lat: 27.4728, lng: 94.9120, state: "Assam" },
  DBRG: { name: "Dibrugarh Town", lat: 27.4728, lng: 94.9120, state: "Assam" },
  RNY: { name: "Rangiya Jn", lat: 26.4528, lng: 91.6132, state: "Assam" },
  LMG: { name: "Lumding Jn", lat: 25.7501, lng: 93.1699, state: "Assam" },
  SCL: { name: "Silchar", lat: 24.8333, lng: 92.7789, state: "Assam" },
  AGTL: { name: "Agartala", lat: 23.8863, lng: 91.2752, state: "Tripura" },

  // Uttarakhand
  DDN: { name: "Dehradun", lat: 30.3165, lng: 78.0322, state: "Uttarakhand" },
  HW: { name: "Haridwar Jn", lat: 29.9457, lng: 78.1642, state: "Uttarakhand" },
  RKSH: { name: "Rishikesh", lat: 30.0693, lng: 78.2668, state: "Uttarakhand" },
  KGM: { name: "Kathgodam", lat: 29.2756, lng: 79.5228, state: "Uttarakhand" },

  // Jammu & Kashmir
  JAT: { name: "Jammu Tawi", lat: 32.7266, lng: 74.8570, state: "Jammu & Kashmir" },
  SVDK: { name: "Shri Mata Vaishno Devi Katra", lat: 32.9915, lng: 74.9318, state: "Jammu & Kashmir" },
  SGNR2: { name: "Srinagar", lat: 34.0837, lng: 74.7973, state: "Jammu & Kashmir" },
  UHP: { name: "Udhampur", lat: 32.9161, lng: 75.1419, state: "Jammu & Kashmir" },

  // Himachal Pradesh
  UHL: { name: "Una Himachal", lat: 31.4685, lng: 76.2708, state: "Himachal Pradesh" },
  KLK: { name: "Kalka", lat: 30.8449, lng: 76.9411, state: "Haryana" },
  SML: { name: "Shimla", lat: 31.1048, lng: 77.1734, state: "Himachal Pradesh" },
};

// Reverse geocoding: determine state from lat/lng (approximate, for India)
export function getStateFromCoordinates(lat: number, lng: number): string {
  // Simple nearest-station approach
  let minDist = Infinity;
  let nearestState = "Unknown";

  for (const station of Object.values(stationCoordinates)) {
    const dist = Math.sqrt(Math.pow(lat - station.lat, 2) + Math.pow(lng - station.lng, 2));
    if (dist < minDist) {
      minDist = dist;
      nearestState = station.state;
    }
  }

  return nearestState;
}
