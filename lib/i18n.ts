import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ar' | 'tn';

interface TranslationState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<TranslationState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
);

export const translations = {
  en: {
    // Landing Page
    hero_badge: "Next Generation Streaming",
    hero_title: "Private Streaming",
    hero_simplified: "Simplified.",
    hero_desc: "Create secure, private live streaming rooms in seconds. Invite guests with a single link, QR code, or email. No complicated setup.",
    start_stream: "Start Your Stream",
    join_room: "Join a Room",
    feature_private_title: "Fully Private",
    feature_private_desc: "Your stream, your rules. Only invited guests can join your secure room.",
    feature_sharing_title: "Easy Sharing",
    feature_sharing_desc: "Share via unique links, dynamic QR codes, or direct email invitations.",
    feature_pwa_title: "PWA Ready",
    feature_pwa_desc: "Install on your home screen and stream from anywhere with our mobile-first design.",

    // Dashboard
    dashboard_title: "Your Live Rooms",
    dashboard_desc: "Manage and create your private streaming spaces.",
    new_room_label: "New Room Name",
    room_placeholder: "e.g. My Awesome Stream",
    create_room: "Create Room",
    active_past_rooms: "Active & Past Rooms",
    loading_rooms: "Loading your rooms...",
    no_rooms_title: "No rooms yet",
    no_rooms_desc: "Create your first private streaming room above.",

    // Room
    back_to_dashboard: "Back to Dashboard",
    share_room: "Share Room",
    invite_others: "Invite Others",
    copy_link: "Copy Link",
    send_email: "Send Email",
    scan_qr: "Scan QR Code",
    participants: "Participants",
    chat: "Chat",
    end_stream: "End Stream",

    // Common
    loading: "Loading...",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    signup: "Sign Up"
  },
  ar: {
    // Landing Page
    hero_badge: "الجيل القادم من البث",
    hero_title: "بث مباشر خاص",
    hero_simplified: "ببساطة.",
    hero_desc: "أنشئ غرف بث مباشر آمنة وخاصة في ثوانٍ. ادعُ الضيوف برابط واحد، أو رمز QR، أو بريد إلكتروني. لا إعدادات معقدة.",
    start_stream: "ابدأ بثك الخاص",
    join_room: "انضم إلى غرفة",
    feature_private_title: "خصوصية كاملة",
    feature_private_desc: "بثك، قواعدك. فقط الضيوف المدعوون يمكنهم الانضمام إلى غرفتك الآمنة.",
    feature_sharing_title: "مشاركة سهلة",
    feature_sharing_desc: "شارك عبر روابط فريدة، رموز QR ديناميكية، أو دعوات بريد إلكتروني مباشرة.",
    feature_pwa_title: "جاهز للتثبيت",
    feature_pwa_desc: "ثبته على شاشتك الرئيسية وابدأ البث من أي مكان بتصميمنا المتوافق مع الجوال.",

    // Dashboard
    dashboard_title: "غرف البث الخاصة بك",
    dashboard_desc: "إدارة وإنشاء مساحات البث المباشر الخاصة بك.",
    new_room_label: "اسم الغرفة الجديدة",
    room_placeholder: "مثال: بثي الرائع",
    create_room: "إنشاء غرفة",
    active_past_rooms: "الغرف النشطة والسابقة",
    loading_rooms: "جاري تحميل غرفك...",
    no_rooms_title: "لا توجد غرف بعد",
    no_rooms_desc: "أنشئ غرفتك الأولى للبث المباشر أعلاه.",

    // Room
    back_to_dashboard: "العودة إلى لوحة القيادة",
    share_room: "مشاركة الغرفة",
    invite_others: "دعوة الآخرين",
    copy_link: "نسخ الرابط",
    send_email: "إرسال بريد",
    scan_qr: "مسح رمز QR",
    participants: "المشاركون",
    chat: "الدردشة",
    end_stream: "إنهاء البث",

    // Common
    loading: "جاري التحميل...",
    settings: "الإعدادات",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب"
  },
  tn: {
    // Landing Page
    hero_badge: "الجيل الجديد متع الـ Streaming",
    hero_title: "ستريمينغ بريـفي",
    hero_simplified: "بسهولة.",
    hero_desc: "أعمل بيت ستريمينغ خاصة بيك في ثواني. استدعى صحابك بليان، QR code، ولا إيميل. من غير تعقيدات.",
    start_stream: "ابدأ الستريم متاعك",
    join_room: "أدخل لبيت",
    feature_private_title: "بريـفي 100%",
    feature_private_desc: "الستريم متاعك، القوانين متاعك. كان اللي تستدعيهم ينجموا يدخلوا.",
    feature_sharing_title: "بارتاج ساهل",
    feature_sharing_desc: "بارتاجي بليان، QR code، ولا إيميلات ديريكت.",
    feature_pwa_title: "تطبيق على التلفون",
    feature_pwa_desc: "صوبو في تلفونك وابدأ ستريمي من أي بلاصة.",

    // Dashboard
    dashboard_title: "Dashboard متاعك",
    dashboard_desc: "نظم واعمل Room الستريمينغ الخاصة بيك.",
    new_room_label: "اسم البيت الجديدة",
    room_placeholder: "مثلا: الستريم الهبال متاعي",
    create_room: "اعمل بيت",
    active_past_rooms: "البيوت اللي حليتهم",
    loading_rooms: "قاعدين نشرجيو في البيوت...",
    no_rooms_title: "ما فماش بيوت لتوا",
    no_rooms_desc: "أعمل أول بيت ستريمينغ متاعك الفوق.",

    // Room
    back_to_dashboard: "أرجع Dashboard",
    share_room: "بارتاجي Room",
    invite_others: "استدعى عباد",
    copy_link: "كوبي lien",
    send_email: "إبعث إيميل",
    scan_qr: "سكاني الـ QR",
    participants: "اللي موجودين",
    chat: "شات",
    end_stream: "قص الستريم",

    // Common
    loading: "قاعد يشرجي...",
    settings: "الإعدادات",
    profile: "البروفيل",
    logout: "أخرج",
    login: "أدخل",
    signup: "أعمل كونت"
  }
};

export const useTranslation = () => {
  const { language } = useLanguageStore();
  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key];
  };
  return { t, language, setLanguage: useLanguageStore.getState().setLanguage };
};
