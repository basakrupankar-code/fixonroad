export type Language = 'en' | 'bn' | 'hi';

export interface TranslationDictionary {
  nav: {
    services: string;
    howItWorks: string;
    trackOrders: string;
    forMechanics: string;
    signIn: string;
    partnerLogin: string;
    emergencyHelp: string;
    switchToRider: string;
    switchToMechanic: string;
    logout: string;
    myProfile: string;
    myBookings: string;
    language: string;
  };
  hero: {
    badge: string;
    liveIn: string;
    title: string;
    heading1: string;
    heading2: string;
    heading3: string;
    subtitle: string;
    requestHelp: string;
    useCurrentLocation: string;
    locating: string;
    titleTag: string;
    introSubtitle: string;
  };
  radar: {
    title: string;
    liveRadar: string;
    searching: string;
    matched: string;
    enRoute: string;
    scanning: string;
    findingMechanic: string;
    tapToViewRoute: string;
  };
  stats: {
    avgResponse: string;
    verifiedMechanics: string;
    userRating: string;
    fixedPricing: string;
    min15: string;
    count500: string;
    rating49: string;
  };
  services: {
    title: string;
    subtitle: string;
    flatTire: string;
    flatTireDesc: string;
    deadBattery: string;
    deadBatteryDesc: string;
    chain: string;
    chainDesc: string;
    engine: string;
    engineDesc: string;
    fuel: string;
    fuelDesc: string;
    towing: string;
    towingDesc: string;
    bookService: string;
    fixedPrice: string;
  };
  track: {
    title: string;
    liveDispatchTracking: string;
    trackingCode: string;
    eta: string;
    bikeEta: string;
    distance: string;
    roadDistance: string;
    findingMechanic: string;
    enRouteBike: string;
    dispatchedFrom: string;
    breakdownSpot: string;
    paymentMode: string;
    callMechanic: string;
    verifiedBadge: string;
    backHome: string;
    myBookings: string;
    osrmGeometry: string;
    calculating: string;
  };
  howItWorks: {
    badge: string;
    heading1: string;
    heading2: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
  };
  checkout: {
    confirmBooking: string;
    selectPayment: string;
    cashOnDelivery: string;
    onlinePayment: string;
    totalAmount: string;
    payNow: string;
    bookingConfirmed: string;
    roadsideGuarantee: string;
    basePrice: string;
    platformFee: string;
    proceedToCheckout: string;
    addToCart: string;
    removeFromCart: string;
  };
  triage: {
    badge: string;
    heading1: string;
    heading2: string;
    subheading: string;
    flatTire: string;
    deadBattery: string;
    chainSnapped: string;
    wontStart: string;
  };
  common: {
    loading: string;
    success: string;
    error: string;
    cancel: string;
    confirm: string;
    close: string;
    back: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  // ─── English (Default) ────────────────────────────────────────────────────────
  en: {
    nav: {
      services: 'Services',
      howItWorks: 'How It Works',
      trackOrders: 'Track Orders',
      forMechanics: 'For Mechanics',
      signIn: 'Sign In',
      partnerLogin: 'Partner Login',
      emergencyHelp: 'Emergency Help',
      switchToRider: 'Switch to Rider',
      switchToMechanic: 'Mechanic Portal',
      logout: 'Logout',
      myProfile: 'My Profile',
      myBookings: 'My Bookings',
      language: 'Language'
    },
    hero: {
      badge: 'LIVE IN KALYANI, WEST BENGAL',
      liveIn: 'Live in',
      title: 'On-Demand Roadside Help for Bikes & Cars.',
      heading1: 'On-Demand',
      heading2: 'Roadside Help',
      heading3: 'for Bikes & Cars.',
      subtitle: 'Stranded on your vehicle? Request a verified mechanic instantly. Fixed pricing, live tracking, and fast response times.',
      requestHelp: 'Request Help',
      useCurrentLocation: 'Use Current Location',
      locating: 'Locating GPS...',
      titleTag: 'FixOnRoad — On-Demand Roadside Help for Bikes & Cars',
      introSubtitle: 'Two-Wheeler Assistance · Reimagined'
    },
    radar: {
      title: 'Live Dispatch Radar',
      liveRadar: 'LIVE RADAR',
      searching: 'Searching',
      matched: 'Matched',
      enRoute: 'EN ROUTE',
      scanning: 'Scanning 5 km radius in sector...',
      findingMechanic: 'Finding nearest mechanic…',
      tapToViewRoute: 'Tap to view live route map →'
    },
    stats: {
      avgResponse: 'Avg Response',
      verifiedMechanics: 'Verified Mechanics',
      userRating: 'User Rating',
      fixedPricing: 'Fixed Transparent Pricing',
      min15: '15 min',
      count500: '500+',
      rating49: '4.9/5'
    },
    services: {
      title: 'Roadside Assistance Services',
      subtitle: 'Standardized roadside solutions delivered right to your breakdown location by certified mechanics.',
      flatTire: 'Flat Tire Repair',
      flatTireDesc: 'Tubeless puncture repair, tube replacement, and high-pressure tire inflation.',
      deadBattery: 'Dead Battery / Jump Start',
      deadBatteryDesc: 'Heavy-duty jump start pack and battery terminal voltage health check.',
      chain: 'Chain Fix',
      chainDesc: 'Drive chain re-tensioning, master link replacement, and high-viscosity lubrication.',
      engine: 'Engine Diagnosis',
      engineDesc: 'Spark plug diagnosis, fuel block recovery, and electrical wiring inspection.',
      fuel: 'Fuel Delivery',
      fuelDesc: 'Emergency delivery of 2.5L unadulterated petrol/diesel directly to your spot.',
      towing: 'Two-Wheeler Towing',
      towingDesc: 'Hydraulic ramp pickup and safe transport to the nearest partner service garage.',
      bookService: 'Book Service',
      fixedPrice: 'Fixed Upfront Price'
    },
    track: {
      title: 'Live Dispatch Tracking',
      liveDispatchTracking: 'Live Dispatch Tracking',
      trackingCode: 'Tracking Code',
      eta: 'Bike ETA',
      bikeEta: 'Bike ETA',
      distance: 'Road Distance',
      roadDistance: 'Road Distance',
      findingMechanic: 'Assigning Nearest Mechanic...',
      enRouteBike: 'En Route on Service Bike',
      dispatchedFrom: 'Dispatched From Hub',
      breakdownSpot: 'Your Breakdown Spot',
      paymentMode: 'Payment Mode',
      callMechanic: 'Call Technician',
      verifiedBadge: 'Background Verified',
      backHome: 'Back to Home',
      myBookings: 'My Bookings',
      osrmGeometry: 'OSRM Road Geometry',
      calculating: 'Calculating...'
    },
    howItWorks: {
      badge: 'HOW IT WORKS',
      heading1: 'Roadside Help in',
      heading2: '4 Simple Steps',
      step1Title: 'Pin Your Location',
      step1Desc: 'Instant GPS auto-detection or landmark selection across Bengal.',
      step2Title: 'Select Issue & Get Price',
      step2Desc: 'Choose puncture, jumpstart, chain, or fuel. Fixed upfront price with zero hidden fees.',
      step3Title: 'Mechanic Dispatched',
      step3Desc: 'Live GPS radar tracking as your certified mechanic arrives in minutes.',
      step4Title: 'Pay Digitally or Cash',
      step4Desc: 'Inspect the resolved fix and pay via UPI (GPay/PhonePe/Paytm) or cash.'
    },
    checkout: {
      confirmBooking: 'Confirm Breakdown Service',
      selectPayment: 'Select Payment Method',
      cashOnDelivery: 'Cash on Arrival',
      onlinePayment: 'Online Payment (UPI / Card)',
      totalAmount: 'Total Guaranteed Price',
      payNow: 'Confirm & Dispatch',
      bookingConfirmed: 'Service Confirmed & Mechanic Dispatched!',
      roadsideGuarantee: 'FixOnRoad 100% Satisfaction & Safety Guarantee',
      basePrice: 'Base Price',
      platformFee: 'Platform Fee',
      proceedToCheckout: 'Proceed to Checkout',
      addToCart: 'Add to Cart',
      removeFromCart: 'Remove from Cart'
    },
    triage: {
      badge: 'Instant Assistance',
      heading1: 'What happened to',
      heading2: 'your vehicle?',
      subheading: 'Select your issue for transparent, fixed pricing and instant mechanic dispatch.',
      flatTire: 'Flat Tire',
      deadBattery: 'Dead Battery',
      chainSnapped: 'Chain Snapped',
      wontStart: "Won't Start"
    },
    common: {
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back'
    }
  },

  // ─── Bengali (বাংলা) ─────────────────────────────────────────────────────────
  bn: {
    nav: {
      services: 'পরিষেবা',
      howItWorks: 'কীভাবে কাজ করে',
      trackOrders: 'অর্ডার ট্র্যাক করুন',
      forMechanics: 'মেকানিকদের জন্য',
      signIn: 'সাইন ইন',
      partnerLogin: 'পার্টনার লগইন',
      emergencyHelp: 'জরুরি সহায়তা',
      switchToRider: 'রাইডার ভিউ',
      switchToMechanic: 'মেকানিক পোর্টাল',
      logout: 'লগআউট',
      myProfile: 'আমার প্রোফাইল',
      myBookings: 'আমার বুকিং',
      language: 'ভাষা'
    },
    hero: {
      badge: 'কল্যাণী, পশ্চিমবঙ্গে সরাসরি উপলব্ধ',
      liveIn: 'সরাসরি উপলব্ধ',
      title: 'বাইক ও গাড়ির জন্য তাৎক্ষণিক অন-ডিমান্ড রোডসাইড সাহায্য।',
      heading1: 'তাৎক্ষণিক অন-ডিমান্ড',
      heading2: 'রোডসাইড সাহায্য',
      heading3: 'বাইক ও গাড়ির জন্য।',
      subtitle: 'গাড়ি নষ্ট হয়ে আটকে পড়েছেন? তৎক্ষণাৎ ভেরিফাইড মেকানিক ডাকুন। নির্ধারিত মূল্য, লাইভ ট্র্যাকিং এবং দ্রুত পৌঁছানোর নিশ্চয়তা।',
      requestHelp: 'সাহায্য চান',
      useCurrentLocation: 'বর্তমান লোকেশন ব্যবহার করুন',
      locating: 'জিপিএস খোঁজা হচ্ছে...',
      titleTag: 'FixOnRoad — বাইক ও গাড়ির জন্য নির্ভরযোগ্য রোডসাইড সাহায্য',
      introSubtitle: 'দ্বিচক্রযান সহায়তা · নতুন রূপে'
    },
    radar: {
      title: 'লাইভ ডিসপ্যাচ রাডার',
      liveRadar: 'লাইভ রাডার',
      searching: 'সন্ধান চলছে',
      matched: 'যুক্ত হয়েছে',
      enRoute: 'আসছেন',
      scanning: '৫ কিমি ব্যাসার্ধে মেকানিক খোঁজা হচ্ছে...',
      findingMechanic: 'নিকটবর্তী মেকানিক খোঁজা হচ্ছে…',
      tapToViewRoute: 'লাইভ রুট ম্যাপ দেখতে ট্যাপ করুন →'
    },
    stats: {
      avgResponse: 'গড় পৌঁছানোর সময়',
      verifiedMechanics: 'ভেরিফাইড মেকানিক',
      userRating: 'ইউজার রেটিং',
      fixedPricing: 'নির্ধারিত স্বচ্ছ মূল্য',
      min15: '১৫ মিনিট',
      count500: '৫০০+ জন',
      rating49: '৪.৯/৫'
    },
    services: {
      title: 'আমাদের রোডসাইড পরিষেবা',
      subtitle: 'অন-স্পট নির্ধারিত মূল্যে সার্টিফাইড মেকানিক দ্বারা নির্ভরযোগ্য সার্ভিসিং।',
      flatTire: 'টায়ার পাংচার মেরামত',
      flatTireDesc: 'টিউবলেস পাংচার রিপেয়ার, টিউব পরিবর্তন এবং সঠিক প্রেশারে বাতাস রিফিল।',
      deadBattery: 'ব্যাটারি জাম্প স্টার্ট',
      deadBatteryDesc: 'পাওয়ারফুল জাম্প স্টার্টার দিয়ে তাত্ক্ষণিক স্টার্ট এবং ভোল্টেজ পরীক্ষা।',
      chain: 'চেইন মেরামত',
      chainDesc: 'চেইন টাইট করা, লক লাগানো এবং উচ্চমানের লুব্রিকেশন সার্ভিস।',
      engine: 'ইঞ্জিন ডায়াগনসিস',
      engineDesc: 'স্পার্ক প্লাগ সমস্যা, ফুয়েল সাপ্লাই ব্লকেজ ও ওয়্যারিং সমাধান।',
      fuel: 'তেল/ফুয়েল ডেলিভারি',
      fuelDesc: 'জরুরি পরিস্থিতিতে সরাসরি স্পটে ২.৫ লিটার খাঁটি পেট্রোল/ডিজেল সরবরাহ।',
      towing: 'টু-হুইলার টোয়িং সার্ভিস',
      towingDesc: 'হাইড্রোলিক পিকআপের মাধ্যমে নিকটতম গ্যারেজে নিরাপদ পরিবহন।',
      bookService: 'বুক করুন',
      fixedPrice: 'নির্ধারিত মূল্য'
    },
    track: {
      title: 'লাইভ ডিসপ্যাচ ট্র্যাকিং',
      liveDispatchTracking: 'লাইভ ডিসপ্যাচ ট্র্যাকিং',
      trackingCode: 'ট্র্যাকিং কোড',
      eta: 'বাইক পৌঁছানোর সময়',
      bikeEta: 'বাইক পৌঁছানোর সময়',
      distance: 'সড়কের দূরত্ব',
      roadDistance: 'সড়কের দূরত্ব',
      findingMechanic: 'নিকটবর্তী মেকানিক খোঁজা হচ্ছে...',
      enRouteBike: 'সার্ভিস বাইকে রওয়ানা হয়েছেন',
      dispatchedFrom: 'ডিসপ্যাচ হাব থেকে',
      breakdownSpot: 'আপনার গাড়ি নষ্টের স্থান',
      paymentMode: 'পেমেন্ট মাধ্যম',
      callMechanic: 'মেকানিককে কল করুন',
      verifiedBadge: 'ভেরিফাইড টেকনিশিয়ান',
      backHome: 'হোমে ফিরে যান',
      myBookings: 'আমার বুকিং',
      osrmGeometry: 'সড়ক নেটওয়ার্ক রুট',
      calculating: 'গণনা করা হচ্ছে...'
    },
    howItWorks: {
      badge: 'কীভাবে কাজ করে',
      heading1: 'রোডসাইড সাহায্য মাত্র',
      heading2: '৪টি সহজ ধাপে',
      step1Title: 'আপনার লোকেশন দিন',
      step1Desc: 'স্বয়ংক্রিয় জিপিএস লোকেশন সনাক্তকরণ অথবা ম্যানুয়াল ল্যান্ডমার্ক দিন।',
      step2Title: 'সমস্যা নির্বাচন করুন',
      step2Desc: 'পাংচার, জাম্প স্টার্ট, চেইন বা তেল নির্বাচন করুন। কোনো গোপন চার্জ নেই।',
      step3Title: 'মেকানিক রওয়ানা হলেন',
      step3Desc: 'লাইভ জিপিএস রাডারে মেকানিকের গতিবিধি রিয়েল-টাইমে দেখুন।',
      step4Title: 'কাজ শেষে পেমেন্ট দিন',
      step4Desc: 'কাজ সন্তোষজনক হলে ইউপিআই (PhonePe/GPay/Paytm) অথবা ক্যাশে পেমেন্ট করুন।'
    },
    checkout: {
      confirmBooking: 'বুকিং নিশ্চিত করুন',
      selectPayment: 'পেমেন্ট পদ্ধতি বাছুন',
      cashOnDelivery: 'সার্ভিস শেষে ক্যাশ পেমেন্ট',
      onlinePayment: 'অনলাইন পেমেন্ট (UPI / Card)',
      totalAmount: 'সর্বমোট নির্ধারিত মূল্য',
      payNow: 'নিশ্চিত ও ডিসপ্যাচ করুন',
      bookingConfirmed: 'বুকিং সফল! মেকানিক পাঠানো হয়েছে',
      roadsideGuarantee: 'FixOnRoad ১০০% নিরাপত্তা ও সন্তুষ্টির গ্যারান্টি',
      basePrice: 'মূল সার্ভিস চার্জ',
      platformFee: 'প্ল্যাটফর্ম ফি',
      proceedToCheckout: 'পেমেন্ট ও বুকিংয়ে এগিয়ে যান',
      addToCart: 'কার্টে যোগ করুন',
      removeFromCart: 'কার্ট থেকে মুছুন'
    },
    triage: {
      badge: 'তাৎক্ষণিক সহায়তা',
      heading1: 'আপনার গাড়ির',
      heading2: 'কী সমস্যা হয়েছে?',
      subheading: 'নির্ধারিত স্বচ্ছ মূল্য ও দ্রুত মেকানিকের জন্য আপনার সমস্যাটি বেছে নিন।',
      flatTire: 'টায়ার পাংচার',
      deadBattery: 'ব্যাটারি শেষ',
      chainSnapped: 'চেইন ছিঁড়েছে',
      wontStart: 'স্টার্ট নিচ্ছে না'
    },
    common: {
      loading: 'লোড হচ্ছে...',
      success: 'সফল',
      error: 'ত্রুটি',
      cancel: 'বাতিল',
      confirm: 'নিশ্চিত',
      close: 'বন্ধ',
      back: 'পেছনে'
    }
  },

  // ─── Hindi (हिन्दी) ──────────────────────────────────────────────────────────
  hi: {
    nav: {
      services: 'सेवाएं',
      howItWorks: 'यह कैसे काम करता है',
      trackOrders: 'ऑर्डर ट्रैक करें',
      forMechanics: 'मैकेनिकों के लिए',
      signIn: 'साइन इन',
      partnerLogin: 'पार्टनर लॉगिन',
      emergencyHelp: 'आपातकालीन सहायता',
      switchToRider: 'राइडर दृश्य',
      switchToMechanic: 'मैकेनिक पोर्टल',
      logout: 'लॉगआउट',
      myProfile: 'मेरी प्रोफाइल',
      myBookings: 'मेरी बुकिंग',
      language: 'भाषा'
    },
    hero: {
      badge: 'कल्याणी, पश्चिम बंगाल में लाइव',
      liveIn: 'उपलब्ध है',
      title: 'बाइक और कारों के लिए तुरंत ऑन-डिमांड रोडसाइड सहायता।',
      heading1: 'ऑन-डिमांड',
      heading2: 'रोडसाइड सहायता',
      heading3: 'बाइक और कारों के लिए।',
      subtitle: 'गाड़ी खराब हो गई? तुरंत सत्यापित मैकेनिक बुलाएं। तय कीमत, लाइव ट्रैकिंग और तेज प्रतिक्रिया।',
      requestHelp: 'मदद का अनुरोध करें',
      useCurrentLocation: 'वर्तमान लोकेशन का उपयोग करें',
      locating: 'लोकेशन खोजी जा रही है...',
      titleTag: 'FixOnRoad — बाइक और कार के लिए ऑन-डिमांड रोडसाइड मदद',
      introSubtitle: 'टू-व्हीलर सहायता · नए रूप में'
    },
    radar: {
      title: 'लाइव डिस्पैच रडार',
      liveRadar: 'लाइव रडार',
      searching: 'खोज जारी है',
      matched: 'मैच हुआ',
      enRoute: 'रास्ते में',
      scanning: '5 किमी के दायरे में खोज की जा रही है...',
      findingMechanic: 'निकटतम मैकेनिक खोजा जा रहा है…',
      tapToViewRoute: 'लाइव रूट मैप देखने के लिए टैप करें →'
    },
    stats: {
      avgResponse: 'औसत समय',
      verifiedMechanics: 'सत्यापित मैकेनिक',
      userRating: 'उपयोगकर्ता रेटिंग',
      fixedPricing: 'पारदर्शी तय कीमतें',
      min15: '15 मिनट',
      count500: '500+',
      rating49: '4.9/5'
    },
    services: {
      title: 'हमारी रोडसाइड सेवाएं',
      subtitle: 'प्रमाणित मैकेनिकों द्वारा सीधे आपकी लोकेशन पर विश्वसनीय और तय कीमतों पर सेवा।',
      flatTire: 'पंचर मरम्मत',
      flatTireDesc: 'ट्यूबलेस पंचर रिपेयर, ट्यूब बदलना और हवा भरना।',
      deadBattery: 'बैटरी जंप स्टार्ट',
      deadBatteryDesc: 'शक्तिशाली बूस्टर से तुरंत स्टार्ट और बैटरी वोल्टेज की जांच।',
      chain: 'चेन मरम्मत',
      chainDesc: 'चेन टाइट करना, लिंक रिप्लेसमेंट और उच्च गुणवत्ता वाली लूब्रिकेशन।',
      engine: 'इंजन की जांच',
      engineDesc: 'स्पार्क प्लग, फ्यूल लाइन रुकावट और वायरिंग की मरम्मत।',
      fuel: 'ईंधन वितरण',
      fuelDesc: 'आपातकाल में 2.5 लीटर शुद्ध पेट्रोल/डीजल सीधे मौके पर पहुंचाना।',
      towing: 'टू-व्हीलर टोइंग',
      towingDesc: 'हाइड्रोलिक रैंप द्वारा नजदीकी वर्कशॉप तक सुरक्षित वाहन परिवहन।',
      bookService: 'बुक करें',
      fixedPrice: 'तय कीमत'
    },
    track: {
      title: 'लाइव डिस्पैच ट्रैकिंग',
      liveDispatchTracking: 'लाइव डिस्पैच ट्रैकिंग',
      trackingCode: 'ट्रैकिंग कोड',
      eta: 'बाइक पहुंचने का समय',
      bikeEta: 'बाइक पहुंचने का समय',
      distance: 'सड़क की दूरी',
      roadDistance: 'सड़क की दूरी',
      findingMechanic: 'निकटतम मैकेनिक खोजा जा रहा है...',
      enRouteBike: 'सर्विस बाइक पर रास्ते में हैं',
      dispatchedFrom: 'डिस्पैच हब से',
      breakdownSpot: 'आपकी लोकेशन',
      paymentMode: 'भुगतान का तरीका',
      callMechanic: 'मैकेनिक को कॉल करें',
      verifiedBadge: 'सत्यापित तकनीशियन',
      backHome: 'होम पर वापस जाएं',
      myBookings: 'मेरी बुकिंग',
      osrmGeometry: 'सड़क नेटवर्क रूट',
      calculating: 'गणना हो रही है...'
    },
    howItWorks: {
      badge: 'यह कैसे काम करता है',
      heading1: 'रोडसाइड मदद केवल',
      heading2: '4 आसान चरणों में',
      step1Title: 'लोकेशन दर्ज करें',
      step1Desc: 'जीपीएस से तुरंत लोकेशन पहचानें या लैंडमार्क चुनें।',
      step2Title: 'समस्या चुनें व कीमत देखें',
      step2Desc: 'पंचर, बैटरी, चेन या फ्यूल चुनें। पहले से तय पारदर्शी कीमतें।',
      step3Title: 'मैकेनिक रवाना हुआ',
      step3Desc: 'लाइव जीपीएस रडार पर मैकेनिक का रियल-टाइम मूवमेंट देखें।',
      step4Title: 'डिजिटल या नकद भुगतान करें',
      step4Desc: 'काम पूरा होने पर UPI (PhonePe/GPay/Paytm) या नकद भुगतान करें।'
    },
    checkout: {
      confirmBooking: 'बुकिंग की पुष्टि करें',
      selectPayment: 'भुगतान विधि चुनें',
      cashOnDelivery: 'काम के बाद नकद भुगतान',
      onlinePayment: 'ऑनलाइन भुगतान (UPI / कार्ड)',
      totalAmount: 'कुल तय मूल्य',
      payNow: 'पुष्टि करें और भेजें',
      bookingConfirmed: 'बुकिंग सफल! मैकेनिक भेजा गया है',
      roadsideGuarantee: 'FixOnRoad 100% सुरक्षा और संतुष्टि गारंटी',
      basePrice: 'मूल सर्विस शुल्क',
      platformFee: 'प्लेटफ़ॉर्म शुल्क',
      proceedToCheckout: 'चेकआउट के लिए आगे बढ़ें',
      addToCart: 'कार्ट में जोड़ें',
      removeFromCart: 'कार्ट से हटाएं'
    },
    triage: {
      badge: 'त्वरित सहायता',
      heading1: 'आपके वाहन में',
      heading2: 'क्या समस्या आई?',
      subheading: 'पारदर्शी तय कीमतों और तुरंत मैकेनिक के लिए अपनी समस्या चुनें।',
      flatTire: 'टायर पंचर',
      deadBattery: 'बैटरी डिस्चार्ज',
      chainSnapped: 'चेन टूट गई',
      wontStart: 'स्टार्ट नहीं हो रही'
    },
    common: {
      loading: 'लोड हो रहा है...',
      success: 'सफलता',
      error: 'त्रुटि',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      close: 'बंद करें',
      back: 'वापस'
    }
  }
};
