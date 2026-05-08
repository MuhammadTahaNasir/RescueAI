import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  AlertCircle, 
  MapPin, 
  Send, 
  Activity, 
  MessageSquare, 
  Mic, 
  Phone, 
  ChevronRight, 
  History, 
  ShieldAlert,
  Clock,
  CheckCircle2,
  Volume2,
  Square,
  Trash2,
  Play,
  Layers,
  ArrowRight,
  Globe,
  RefreshCw,
  X,
  Mail,
  FileText,
  Shield,
  Zap,
  Lock,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { api } from './api';

const App = () => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('rescue_activeTab') || 'sos');
  const [sosName, setSosName] = useState('');
  const [sosPhone, setSosPhone] = useState('');
  const [sosLocation, setSosLocation] = useState('');
  const [sosCoords, setSosCoords] = useState<{lat: number, lon: number} | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [alertRecord, setAlertRecord] = useState<any>(null);
  
  const [reportData, setReportData] = useState({
    alert_id: '',
    incident_type: 'Medical',
    incident_spot: '',
    description: ''
  });
  const [reportResult, setReportResult] = useState<any>(null);
  const [aiGuidance, setAiGuidance] = useState('');

  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: 'assistant', content: 'I am ARIA. I can guide you through emergencies like CPR, severe bleeding, or choking. How can I help you right now?' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [interimText, setInterimText] = useState(''); // live speech interim preview

  // --- Voice State ---
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(() => localStorage.getItem('rescue_showDashboard') === 'true');
  const [appLang, setAppLang] = useState(() => localStorage.getItem('rescue_appLang') || 'English');

  // --- Modal State ---
  const [activeModal, setActiveModal] = useState<'support' | 'network' | 'protocol' | 'privacy' | 'terms' | 'licensing' | null>(null);
  const openModal = (modal: typeof activeModal) => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('rescue_activeTab', activeTab);
    localStorage.setItem('rescue_showDashboard', showDashboard.toString());
    localStorage.setItem('rescue_appLang', appLang);
  }, [activeTab, showDashboard, appLang]);

  const translations: any = {
    English: {
      system_online: "SYSTEM ONLINE",
      operational_center: "Operational Command Center",
      emergency_response: "EMERGENCY RESPONSE SYSTEM",
      sos: "Emergency SOS",
      report: "Report Incident",
      track: "Live Tracking",
      aria: "ARIA Assistant",
      full_name: "Full Name",
      phone_number: "Phone Number",
      emergency_gps: "Emergency GPS Location",
      search_placeholder: "Type address or click map...",
      trigger_sos: "TRIGGER EMERGENCY SOS",
      processing: "Processing...",
      alert_registered: "ALERT REGISTERED",
      eta_notice: "Help is on the way. Your ETA is",
      minutes: "minutes",
      incident_type: "Incident Type",
      incident_spot: "Incident Spot (e.g. Kitchen)",
      description: "Description",
      alert_id: "Alert ID",
      submit_report: "SUBMIT REPORT",
      tactical_guidance: "AI Guidance",
      ai_protocol: "AI Protocol Generation",
      awaiting_report: "Awaiting incident report...",
      tactical_tracking: "Live Tracking",
      active_dispatch: "Active Dispatch Monitoring",
      initiate_trace: "Initiate Trace",
      awaiting_telemetry: "Awaiting telemetry...",
      how_help: "How can I help you?",
      tap_speak: "Tap the mic and speak",
      message_aria: "Message ARIA...",
      aria_mistakes: "ARIA can make mistakes. Verify critical protocols.",
      clear_chat: "Clear Log",
      listen: "Listen",
      stop: "Stop",
      landing_title: "RescueAI",
      landing_subtitle: "Fast, reliable emergency response powered by AI.",
      launch_system: "Open Dashboard",
      feature_1_title: "Instant SOS",
      feature_1_desc: "One-tap emergency alert with precise GPS location.",
      feature_2_title: "Live Tracking",
      feature_2_desc: "Real-time responder dispatch monitoring.",
      feature_3_title: "ARIA AI",
      feature_3_desc: "Intelligent emergency guidance and situational analysis.",
      medical_label: "Medical Emergency",
      fire_label: "Fire Incident",
      accident_label: "Road Accident",
      crime_label: "Security Threat",
      disaster_label: "Natural Disaster",
      step1: "Data Input",
      step2: "Analysis",
      search_tip: "Click map to set precise coordinates",
      neural_core: "AI Core Active",
      rec: "REC",
      intercepting: "Listening...",
      primary_node: "Node: 001-X",
      system_live: "RESCUEAI • LIVE",
      ticker_sync: "System: Online",
      ticker_latency: "Response: Fast",
      ticker_enc: "Secure Connection",
      ticker_neural: "AI: Ready",
      ticker_range: "Coverage: Nationwide",
      stability: "Uptime",
      core: "AI Core",
      telemetry: "Response",
      global_network: "Network",
      protocol: "Protocol",
      support: "Support",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      licensing: "Licensing",
      incident_analysis: "Incident Analysis & AI Protocol Unit",
      reset_analysis: "Reset",
      recalibrate_sos: "Reset SOS",
      recalibrate_trace: "Reset Trace",
      locate: "Get My Location",
      abort_audio: "Stop Audio",
      tactical_sync: "Dispatch confirmed. Response unit 00-7 has received coordinates. Live tracking active.",
      dispatch_steps: ["Alert", "Dispatch", "En Route", "Nearby", "Arrived"],
      aria_header: "ARIA Assistant",
      aria_footer: "RescueAI © 2026",
      aria_tagline: "Emergency response and AI guidance platform.",
    },
    Urdu: {
      system_online: "سسٹم آن لائن",
      operational_center: "آپریشنل کمانڈ سینٹر",
      emergency_response: "ہنگامی رسپانس سسٹم",
      sos: "ہنگامی ایس او ایس",
      report: "رپورٹ واقعہ",
      track: "براہ راست ٹریکنگ",
      aria: "آریا اسسٹنٹ",
      full_name: "پورا نام",
      phone_number: "فون نمبر",
      emergency_gps: "ہنگامی جی پی ایس مقام",
      search_placeholder: "پتہ لکھیں یا نقشے پر کلک کریں...",
      trigger_sos: "ہنگامی ایس او ایس جاری کریں",
      processing: "عمل جاری ہے...",
      alert_registered: "الرٹ رجسٹرڈ",
      eta_notice: "مدد آ رہی ہے۔ آپ کا متوقع وقت",
      minutes: "منٹ ہے",
      incident_type: "واقعہ کی قسم",
      incident_spot: "واقعہ کی جگہ (مثلاً کچن)",
      description: "تفصیل",
      alert_id: "الرٹ آئی ڈی",
      submit_report: "رپورٹ جمع کریں",
      tactical_guidance: "اے آئی رہنمائی",
      ai_protocol: "مصنوعی ذہانت پروٹوکول",
      awaiting_report: "واقعہ کی رپورٹ کا انتظار ہے...",
      tactical_tracking: "براہ راست ٹریکنگ",
      active_dispatch: "فعال ڈسپیچ مانیٹرنگ",
      initiate_trace: "ٹریس شروع کریں",
      awaiting_telemetry: "ٹیلی میٹری کا انتظار ہے...",
      how_help: "میں آپ کی کیسے مدد کر سکتا ہوں؟",
      tap_speak: "مائیک پر کلک کریں اور بولیں",
      message_aria: "آریا کو پیغام لکھیں...",
      aria_mistakes: "آریا غلطی کر سکتا ہے۔ اہم پروٹوکول کی تصدیق کریں۔",
      clear_chat: "لاگ صاف کریں",
      listen: "سنیں",
      stop: "رکیں",
      landing_title: "ریسکیو اے آئی",
      landing_subtitle: "اے آئی سے چلنے والا تیز اور قابل اعتماد ہنگامی رسپانس۔",
      launch_system: "ڈیش بورڈ کھولیں",
      feature_1_title: "فوری ایس او ایس",
      feature_1_desc: "درست جی پی ایس کے ساتھ ایک کلک الرٹ۔",
      feature_2_title: "براہ راست ٹریکنگ",
      feature_2_desc: "ریئل ٹائم رسپونڈر ڈسپیچ مانیٹرنگ۔",
      feature_3_title: "آریا اے آئی",
      feature_3_desc: "ذہین ہنگامی رہنمائی اور صورتحال کا تجزیہ۔",
      medical_label: "طبی ایمرجنسی",
      fire_label: "آگ لگنا",
      accident_label: "سڑک حادثہ",
      crime_label: "سیکورٹی خطرہ",
      disaster_label: "قدرتی آفت",
      step1: "ڈیٹا ان پٹ",
      step2: "تجزیہ",
      search_tip: "درست مقام کے لیے نقشے پر کلک کریں",
      neural_core: "اے آئی کور فعال",
      rec: "ریکارڈ",
      intercepting: "سن رہا ہوں...",
      primary_node: "نوڈ: ۰۰۱-ایکس",
      system_live: "ریسکیو اے آئی • لائیو",
      ticker_sync: "سسٹم: آن لائن",
      ticker_latency: "رسپانس: تیز",
      ticker_enc: "محفوظ کنکشن",
      ticker_neural: "اے آئی: تیار",
      ticker_range: "کوریج: ملک گیر",
      stability: "اپ ٹائم",
      core: "اے آئی کور",
      telemetry: "رسپانس",
      global_network: "نیٹ ورک",
      protocol: "پروٹوکول",
      support: "سپورٹ",
      privacy: "رازداری پالیسی",
      terms: "سروس کی شرائط",
      licensing: "لائسنسنگ",
      incident_analysis: "واقعہ تجزیہ اور اے آئی پروٹوکول یونٹ",
      reset_analysis: "دوبارہ ترتیب",
      recalibrate_sos: "ایس او ایس دوبارہ ترتیب",
      recalibrate_trace: "ٹریس دوبارہ ترتیب",
      locate: "میرا مقام حاصل کریں",
      abort_audio: "آڈیو بند کریں",
      tactical_sync: "ڈسپیچ تصدیق شدہ۔ رسپانس یونٹ ۰۰-۷ کو کوآرڈینیٹ مل گئے۔ لائیو ٹریکنگ فعال ہے۔",
      dispatch_steps: ["الرٹ", "ڈسپیچ", "راستے میں", "قریب", "پہنچ گئے"],
      aria_header: "آریا اسسٹنٹ",
      aria_footer: "ریسکیو اے آئی © ۲۰۲۶",
      aria_tagline: "اے آئی سے چلنے والا ہنگامی رسپانس اور رہنمائی پلیٹ فارم۔",
    }
  };

  const T = translations[appLang];

  // --- Nominatim address search debounce ---
  useEffect(() => {
    if (!sosLocation || sosLocation.length < 3) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sosLocation)}&limit=5`)
        .then(r => r.json())
        .then(data => setSearchResults(data))
        .catch(() => setSearchResults([]));
    }, 400);
    return () => clearTimeout(timer);
  }, [sosLocation]);

  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setSosCoords(coords);
          setIsSearching(false);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`)
            .then(res => res.json())
            .then(data => setSosLocation(data.display_name || `${coords.lat}, ${coords.lon}`))
            .catch(() => setSosLocation(`${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`));
        },
        () => alert(appLang === 'Urdu' ? 'مقام تک رسائی سے انکار کر دیا گیا۔' : 'Location access denied.'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleSos = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/sos', {
        name: sosName,
        phone: sosPhone,
        lat: sosCoords?.lat || 0,
        lon: sosCoords?.lon || 0,
        location: sosLocation   // backend expects 'location', not 'address'
      });
      setAlertRecord(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/report', reportData);
      setReportResult(res.data);
      setAiGuidance(res.data.ai_guidance);
      playAudio(res.data.ai_guidance, appLang);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrack = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/track/${trackId}`);
      setTrackResult(res.data);
    } catch (e) {
      alert("Trace ID not found in global registry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsLoading(true);
    try {
      const res = await api.post('/chat', { message: userMsg.content, language: appLang });
      const assistantMsg = { role: 'assistant', content: res.data.answer };
      setChatHistory(prev => [...prev, assistantMsg]);
      playAudio(assistantMsg.content, appLang);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    // Stop browser speech synthesis
    window.speechSynthesis.cancel();
    // Stop HTML5 audio (used for Urdu gTTS)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
  };

  const playAudio = (text: string, lang: string) => {
    if (!text) return;

    // Always stop whatever is currently playing first
    stopAudio();

    const cleanText = text.replace(/\*\*/g, '').replace(/[*#]/g, '').trim();

    if (lang === 'Urdu') {
      // Urdu: use backend gTTS (Google TTS) for proper Urdu pronunciation
      const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const audioUrl = `${backendBase}/tts?text=${encodeURIComponent(cleanText)}&lang=urdu`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.onended = () => { currentAudioRef.current = null; };
      audio.play().catch(e => {
        console.warn("Urdu TTS playback failed:", e);
        currentAudioRef.current = null;
      });
    } else {
      // English: use browser Web Speech API (instant, no network delay, no overlap)
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const recognitionRef = useRef<any>(null);

  const toggleRecordingFor = (field: string) => {
    // If already recording this field — stop
    if (recordingField === field) {
      recognitionRef.current?.stop();
      setRecordingField(null);
      return;
    }

    // Stop any existing recognition first
    recognitionRef.current?.abort();
    setRecordingField(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(appLang === 'Urdu'
        ? 'آپ کا براؤزر آواز کی پہچان کو سپورٹ نہیں کرتا۔ Chrome یا Edge استعمال کریں۔'
        : 'Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = appLang === 'Urdu' ? 'ur-PK' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      setRecordingField(field);
      setInterimText('');
      finalTranscript = '';
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interim += t;
        }
      }
      // Show live interim text
      setInterimText(finalTranscript + interim);
      if (field === 'chat') {
        setChatMessage(finalTranscript + interim);
      }
    };

    recognition.onend = () => {
      setRecordingField(null);
      setInterimText('');
      recognitionRef.current = null;
      const text = finalTranscript.trim();
      if (!text) return;

      if (field === 'report') {
        setReportData(prev => {
          const base = (prev.description || '').trim();
          return { ...prev, description: base ? base + ' ' + text : text };
        });
      }

      if (field === 'chat') {
        // Leave final text in the input — user presses send manually
        setChatMessage(text);
      }
    };

    recognition.onerror = (event: any) => {
      setRecordingField(null);
      setInterimText('');
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        alert(appLang === 'Urdu'
          ? 'مائیکروفون تک رسائی سے انکار کر دیا گیا۔'
          : 'Microphone access denied.');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  function MapUpdater({ coords }: { coords: { lat: number; lon: number } }) {
    const map = useMap();
    useEffect(() => { map.setView([coords.lat, coords.lon], 15); }, [coords, map]);
    return null;
  }

  function LocationMarker() {
    useMapEvents({ click(e) { 
      setSosCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(res => res.json())
        .then(data => setSosLocation(data.display_name));
    } });
    return sosCoords ? <Marker position={[sosCoords.lat, sosCoords.lon]} /> : null;
  }

  if (!showDashboard) {
    return (
      <div className={`min-h-screen bg-slate-950 text-white selection:bg-rose-500/30 overflow-x-hidden ${appLang === 'Urdu' ? 'font-urdu' : ''}`} dir={appLang === 'Urdu' ? 'rtl' : 'ltr'}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]"></div>
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        </div>

        <header className="fixed top-0 w-full z-50 py-8 glass-nav">
          <div className="container mx-auto px-8 md:px-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="relative p-2.5 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                 <ShieldAlert className="text-rose-500 relative z-10" size={28} strokeWidth={2.5} />
                 <div className="absolute inset-0 bg-rose-500/30 blur-lg rounded-full animate-pulse"></div>
               </div>
               <div>
                 <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">RESCUE<span className="text-rose-500">AI</span></h1>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Emergency Response</p>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="hidden md:flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span className="hover:text-white cursor-pointer transition-colors" onClick={() => openModal('network')}>{T.global_network}</span>
                 <span className="hover:text-white cursor-pointer transition-colors" onClick={() => openModal('protocol')}>{T.protocol}</span>
                 <span className="hover:text-white cursor-pointer transition-colors" onClick={() => openModal('support')}>{T.support}</span>
               </div>
               <select 
                  value={appLang} 
                  onChange={(e) => setAppLang(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer hover:bg-white/10"
                >
                  <option value="English" className="bg-slate-950">EN</option>
                  <option value="Urdu" className="bg-slate-950">UR</option>
                </select>
            </div>
          </div>
        </header>

        <main className="relative pt-48 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-16"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-900/40 border border-white/5 rounded-full mb-4 backdrop-blur-md shadow-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">
                {T.system_live}
              </span>
            </div>
            
            <h2 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.95] md:leading-[0.85] uppercase max-w-6xl mx-auto px-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30">{T.landing_title}</span>
            </h2>
            
            <p className="text-xl md:text-3xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed italic opacity-90 font-serif">
              "{T.landing_subtitle}"
            </p>

            <div className="pt-16 flex flex-col items-center gap-8">
              <button 
                onClick={() => setShowDashboard(true)}
                className="group relative px-12 md:px-24 py-8 md:py-10 bg-white text-black font-black uppercase tracking-[0.4em] rounded-[32px] overflow-hidden shadow-[0_0_80px_rgba(255,255,255,0.15)] hover:shadow-[0_0_100px_rgba(225,29,72,0.3)] transition-all active:scale-95 text-base md:text-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-6 group-hover:text-white transition-colors">
                  {T.launch_system}
                  <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform duration-500" />
                </div>
              </button>
              
              <div className="flex items-center gap-12 opacity-50">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black">100%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{T.stability}</span>
                </div>
                <div className="w-[1px] h-10 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black">ARIA</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{T.core}</span>
                </div>
                <div className="w-[1px] h-10 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black">50ms</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{T.telemetry}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-40 w-full">
            {[
              { title: T.feature_1_title, desc: T.feature_1_desc, icon: <Activity size={32} className="text-rose-500" /> },
              { title: T.feature_2_title, desc: T.feature_2_desc, icon: <MapPin size={32} className="text-blue-500" /> },
              { title: T.feature_3_title, desc: T.feature_3_desc, icon: <ShieldAlert size={32} className="text-emerald-500" /> }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="p-10 bg-slate-900/40 border border-white/5 rounded-[40px] backdrop-blur-3xl hover:bg-slate-900/60 transition-all text-start group cursor-default shadow-2xl"
              >
                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/5 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 text-slate-100 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </main>

        <div className="w-full bg-slate-900/20 border-y border-white/5 py-6 overflow-hidden relative backdrop-blur-md">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-24 whitespace-nowrap"
          >
            {[1,2,3,4].map((_, i) => (
              <div key={i} className="flex gap-24 items-center">
                <span className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                  {T.ticker_sync}
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                  {T.ticker_latency}
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                  {T.ticker_enc}
                </span>
                <span className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">
                  <Activity size={14} /> {T.ticker_neural}
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                  {T.ticker_range}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        <footer className="py-24 border-t border-white/5 relative overflow-hidden bg-slate-950">
          <div className="container mx-auto px-8 flex flex-col items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-2xl">
                <ShieldAlert size={32} className="text-rose-500" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-2xl font-black text-slate-100 uppercase tracking-tight leading-none">RescueAI</span>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">{T.aria_footer}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] max-w-2xl">
                {T.aria_tagline}
              </p>
              <div className="flex items-center gap-8 mt-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                <span className="hover:text-slate-400 cursor-pointer transition-colors" onClick={() => openModal('privacy')}>{T.privacy}</span>
                <span className="hover:text-slate-400 cursor-pointer transition-colors" onClick={() => openModal('terms')}>{T.terms}</span>
                <span className="hover:text-slate-400 cursor-pointer transition-colors" onClick={() => openModal('licensing')}>{T.licensing}</span>
              </div>
            </div>
          </div>
        </footer>

        {/* ── MODALS via Portal ── */}
        {activeModal && ReactDOM.createPortal(
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={closeModal}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,36,29,0.88)', backdropFilter: 'blur(16px)' }} />

            <div
              style={{ position: 'relative', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', background: '#0a3d31', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
              >
                <X size={18} />
              </button>

              {activeModal === 'support' && (
                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="p-4 bg-rose-500/10 rounded-[24px] border border-rose-500/20">
                        <Mail size={28} className="text-rose-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Support</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Get in touch with us</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                      Have a question, found a bug, or need help with RescueAI? Reach out directly — we respond within 24 hours.
                    </p>
                    <a
                      href="mailto:m.tahanasir.cs@gmail.com"
                      className="flex items-center gap-4 w-full p-6 bg-slate-950/60 border border-white/10 rounded-[24px] hover:border-rose-500/40 hover:bg-rose-500/5 transition-all group"
                    >
                      <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                        <Mail size={20} className="text-rose-500" />
                      </div>
                      <div className="text-start">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email</p>
                        <p className="text-white font-bold text-sm">m.tahanasir.cs@gmail.com</p>
                      </div>
                      <ArrowRight size={18} className="ml-auto text-slate-600 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                    </a>
                    <p className="text-center text-[10px] font-black text-slate-700 uppercase tracking-widest mt-6">
                      RescueAI Emergency Response Platform
                    </p>
                  </div>
                )}

                {activeModal === 'network' && (
                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="p-4 bg-emerald-500/10 rounded-[24px] border border-emerald-500/20">
                        <Globe size={28} className="text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Network</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Infrastructure overview</p>
                      </div>
                    </div>
                    <div className="space-y-4 mb-6">
                      {[
                        { icon: <Zap size={18} className="text-rose-500" />, label: 'Response Time', value: '< 50ms average latency' },
                        { icon: <Activity size={18} className="text-emerald-500" />, label: 'Uptime', value: '99.9% guaranteed SLA' },
                        { icon: <Lock size={18} className="text-blue-400" />, label: 'Encryption', value: 'End-to-end TLS 1.3' },
                        { icon: <MapPin size={18} className="text-rose-500" />, label: 'Coverage', value: 'Nationwide — all major cities' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/60 border border-white/5 rounded-[20px]">
                          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">{item.icon}</div>
                          <div className="text-start">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                            <p className="text-white font-bold text-sm mt-0.5">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-[20px]">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#3ce5a4] shrink-0"></div>
                      <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">All systems operational</p>
                    </div>
                  </div>
                )}

                {activeModal === 'protocol' && (
                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="p-4 bg-blue-500/10 rounded-[24px] border border-blue-500/20">
                        <FileText size={28} className="text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Protocol</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Emergency response standards</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[
                        { step: '01', title: 'SOS Trigger', desc: 'User submits name, phone, and GPS coordinates. Alert is registered instantly.' },
                        { step: '02', title: 'AI Analysis', desc: 'ARIA processes incident type and generates a tailored response protocol.' },
                        { step: '03', title: 'Dispatch', desc: 'Nearest response unit is notified with full incident data and live coordinates.' },
                        { step: '04', title: 'Live Tracking', desc: 'User can monitor responder ETA and dispatch status in real time.' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-5 p-5 bg-slate-950/60 border border-white/5 rounded-[20px] text-start">
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest shrink-0 mt-0.5">{item.step}</span>
                          <div>
                            <p className="text-white font-black text-sm uppercase tracking-tight mb-1">{item.title}</p>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === 'privacy' && (
                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="p-4 bg-blue-500/10 rounded-[24px] border border-blue-500/20">
                        <Shield size={28} className="text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Privacy Policy</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">How we handle your data</p>
                      </div>
                    </div>
                    <div className="space-y-5 text-start">
                      {[
                        { title: 'Data Collection', body: 'We collect only what is necessary to process your emergency — name, phone number, and GPS coordinates. No account creation required.' },
                        { title: 'Data Usage', body: 'Your data is used solely to dispatch emergency responders and generate AI guidance. It is never sold or shared with third parties.' },
                        { title: 'Data Retention', body: 'Emergency records are retained for 30 days for audit purposes, then permanently deleted from our servers.' },
                        { title: 'Your Rights', body: 'You may request deletion of your data at any time by contacting us at m.tahanasir.cs@gmail.com.' },
                      ].map((item, i) => (
                        <div key={i} className="p-5 bg-slate-950/60 border border-white/5 rounded-[20px]">
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">{item.title}</p>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === 'terms' && (
                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="p-4 bg-rose-500/10 rounded-[24px] border border-rose-500/20">
                        <BookOpen size={28} className="text-rose-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Terms of Service</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Usage agreement</p>
                      </div>
                    </div>
                    <div className="space-y-5 text-start">
                      {[
                        { title: 'Intended Use', body: 'RescueAI is designed exclusively for genuine emergency situations. Misuse or false alerts is strictly prohibited and may result in legal consequences.' },
                        { title: 'AI Guidance Disclaimer', body: "ARIA's guidance is AI-generated and intended as supplementary support only. Always follow instructions from certified emergency professionals." },
                        { title: 'Availability', body: 'We strive for 99.9% uptime but cannot guarantee uninterrupted service. In critical situations, always call emergency services directly (1122, 115, 15).' },
                        { title: 'Liability', body: 'RescueAI is provided as-is. We are not liable for outcomes resulting from reliance on AI-generated guidance in place of professional emergency services.' },
                      ].map((item, i) => (
                        <div key={i} className="p-5 bg-slate-950/60 border border-white/5 rounded-[20px]">
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">{item.title}</p>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === 'licensing' && (
                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="p-4 bg-emerald-500/10 rounded-[24px] border border-emerald-500/20">
                        <Lock size={28} className="text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Licensing</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Software license information</p>
                      </div>
                    </div>
                    <div className="space-y-5 text-start">
                      {[
                        { title: 'License Type', body: 'Proprietary — All Rights Reserved.' },
                        { title: 'Copyright', body: '© 2026 RescueAI. All source code, design, and AI models are the exclusive property of RescueAI and may not be reproduced, distributed, or modified without written permission.' },
                        { title: 'Open Source Components', body: 'This product uses open-source libraries including React, Tailwind CSS, Leaflet, and FastAPI, each governed by their respective licenses.' },
                        { title: 'Licensing Inquiries', body: 'For commercial licensing or partnership inquiries, contact m.tahanasir.cs@gmail.com' },
                      ].map((item, i) => (
                        <div key={i} className="p-5 bg-slate-950/60 border border-white/5 rounded-[20px]">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">{item.title}</p>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-white selection:bg-rose-500/30 pb-32 ${appLang === 'Urdu' ? 'font-urdu' : ''}`} dir={appLang === 'Urdu' ? 'rtl' : 'ltr'}>
      <header className="py-4 md:py-6 border-b border-white/5 bg-slate-900/60 backdrop-blur-3xl shadow-2xl sticky top-0 z-[1000]">
        <div className="container mx-auto px-4 md:px-12 flex justify-between items-center gap-3">
          <button 
            onClick={() => setShowDashboard(false)}
            className="flex items-center gap-4 hover:opacity-80 transition-all group"
          >
            <div className="p-2.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 group-hover:bg-rose-500/20 transition-all shadow-lg text-start">
              <ShieldAlert className="text-rose-500" size={28} />
            </div>
            <div className="flex flex-col items-start text-start">
              <span className="text-2xl font-black text-slate-100 uppercase tracking-tight leading-none">RescueAI</span>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Emergency Response</span>
            </div>
          </button>

          <div className="hidden md:flex bg-slate-950/80 p-1.5 rounded-[20px] border border-white/10 shadow-2xl backdrop-blur-md">
            {[
              { id: 'sos', icon: AlertCircle, label: T.sos },
              { id: 'report', icon: Send, label: T.report },
              { id: 'track', icon: Activity, label: T.track },
              { id: 'chat', icon: MessageSquare, label: T.aria },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 relative overflow-hidden whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-rose-500 text-slate-950 shadow-[0_8px_24px_rgba(225,29,72,0.4)] scale-105 z-10' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={14} strokeWidth={3} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-6 items-center">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{T.system_online}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{T.primary_node}</span>
            </div>
            <select 
              value={appLang}
              onChange={e => setAppLang(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 focus:ring-0 cursor-pointer outline-none hover:border-rose-500/50 transition-all shadow-inner"
            >
              <option value="English">EN</option>
              <option value="Urdu">UR</option>
            </select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-36 max-w-7xl">
        <section className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'sos' && (
              <motion.div
                key="sos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 md:p-16 relative overflow-hidden group shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/5"
              >
                <div className="flex flex-col md:flex-row items-center gap-6 mb-10 md:mb-16 relative z-10">
                  <div className="relative p-6 md:p-8 bg-gradient-to-br from-red-600/20 to-rose-600/10 border border-red-500/20 rounded-[32px] md:rounded-[40px] text-red-500 shadow-[0_0_40px_rgba(225,29,72,0.2)] animate-pulse">
                    <AlertCircle size={48} strokeWidth={3} className="md:hidden" />
                    <AlertCircle size={64} strokeWidth={3} className="hidden md:block" />
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                  </div>
                  <div className="text-center md:text-start">
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none mb-2 md:mb-3">{T.sos}</h2>
                    <p className="text-slate-400 text-base md:text-xl font-medium tracking-wide italic opacity-80">{T.emergency_gps}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSosName(''); setSosPhone(''); setSosLocation(''); setSosCoords(null); setAlertRecord(null); }}
                    className="md:ml-auto p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all hover:rotate-180 duration-700 shadow-2xl"
                    title={T.recalibrate_sos}
                  >
                    <RefreshCw size={20} className="md:hidden" />
                    <RefreshCw size={24} className="hidden md:block" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                  <div className="input-group">
                    <label>{T.full_name}</label>
                    <input 
                      placeholder={T.full_name} 
                      value={sosName} 
                      onChange={e => setSosName(e.target.value)} 
                      className="!py-6 !px-8 !text-lg !rounded-[24px]"
                    />
                  </div>
                  <div className="input-group">
                    <label>{T.phone_number}</label>
                    <input 
                      placeholder="+92..." 
                      value={sosPhone} 
                      onChange={e => setSosPhone(e.target.value)} 
                      className="!py-6 !px-8 !text-lg !rounded-[24px]"
                    />
                  </div>
                </div>

                <div className="input-group relative mb-12">
                  <label>{T.emergency_gps}</label>
                  <div className="flex gap-4 mb-6">
                    <div className="relative flex-1 text-start">
                      <input 
                        placeholder={T.search_placeholder} 
                        value={sosLocation}
                        onChange={e => {
                          setSosLocation(e.target.value);
                          setIsSearching(true);
                        }}
                        onFocus={() => setIsSearching(true)}
                        className="!py-6 !px-8 !text-lg !rounded-[24px]"
                      />
                      <AnimatePresence>
                        {isSearching && searchResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[1000] top-full left-0 w-full mt-4 bg-slate-900 border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl"
                          >
                            {searchResults.map((result, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  const newCoords = { lat: parseFloat(result.lat), lon: parseFloat(result.lon) };
                                  setSosCoords(newCoords);
                                  setSosLocation(result.display_name);
                                  setSearchResults([]);
                                  setIsSearching(false);
                                }}
                                className="w-full text-left px-8 py-5 text-sm text-slate-300 hover:bg-white/5 border-b border-white/5 last:border-0 transition-all font-medium"
                              >
                                {result.display_name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button onClick={fetchLocation} className="p-6 bg-slate-900 text-slate-400 hover:text-rose-500 border border-white/5 hover:border-rose-500/50 hover:bg-slate-800 shrink-0 w-20 flex items-center justify-center rounded-[24px] transition-all shadow-2xl group" title={T.locate}>
                      <MapPin size={32} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                  
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`w-full h-64 md:h-[500px] rounded-[24px] md:rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)] mt-4 relative z-10 ${mapStyle === 'satellite' ? 'map-satellite' : 'map-streets'}`}>
                    <MapContainer 
                      center={sosCoords ? [sosCoords.lat, sosCoords.lon] : [30.3753, 69.3451]}
                      zoom={sosCoords ? 15 : 5} 
                      className="h-full w-full"
                      attributionControl={false}
                      zoomControl={true}
                    >
                      {mapStyle === 'streets' ? (
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          maxZoom={19}
                        />
                      ) : (
                        <TileLayer
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                          maxZoom={19}
                        />
                      )}
                      {sosCoords && <MapUpdater coords={sosCoords} />}
                      <LocationMarker />
                    </MapContainer>

                    <div className="absolute top-4 right-4 z-[1001] flex flex-col gap-2">
                      <button 
                        onClick={() => setMapStyle(mapStyle === 'streets' ? 'satellite' : 'streets')}
                        className="p-3 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[16px] text-white shadow-2xl hover:bg-rose-500 hover:text-slate-950 transition-all"
                        title={mapStyle === 'streets' ? 'Satellite View' : 'Street View'}
                      >
                        <Layers size={20} />
                      </button>
                    </div>
                    
                    {!sosCoords && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-[1001] pointer-events-none">
                        <div className="text-center p-8">
                          <MapPin size={64} className="mx-auto mb-6 text-rose-500 animate-bounce" />
                          <p className="text-sm text-white/40 font-black uppercase tracking-[0.3em]">{T.search_tip}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                <button 
                  onClick={handleSos}
                  disabled={isLoading}
                  className="w-full min-h-[80px] md:h-32 flex items-center justify-center gap-4 md:gap-6 text-lg md:text-3xl font-black tracking-[0.15em] md:tracking-[0.3em] uppercase bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 bg-[length:200%_auto] animate-gradient text-slate-950 rounded-[32px] md:rounded-[40px] shadow-[0_0_60px_rgba(225,29,72,0.4)] border border-black/10 hover:shadow-[0_0_100px_rgba(225,29,72,0.6)] hover:scale-[1.01] transition-all pulse relative overflow-hidden group mt-8 md:mt-10 px-6 md:px-8 text-center"
                >
                  <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                  <span className="relative z-10 text-slate-950">{isLoading ? T.processing : T.trigger_sos}</span>
                  {!isLoading && <ShieldAlert className="relative z-10 hidden md:block text-slate-950" size={40} strokeWidth={3} />}
                </button>

                {alertRecord && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-8 md:p-10 bg-emerald-500/10 border border-emerald-500/30 rounded-[32px] md:rounded-[40px]"
                  >
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h3 className="text-emerald-400 font-black text-xl md:text-2xl uppercase tracking-tighter flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping shrink-0"></div>
                        {T.alert_registered}
                      </h3>
                      <span className="text-2xl md:text-4xl font-black text-white tracking-widest">{alertRecord.alert_id}</span>
                    </div>

                    {/* ETA line */}
                    <p className="text-lg md:text-xl text-slate-300 font-medium mb-6">
                      {T.eta_notice}{' '}
                      <span className="text-emerald-400 font-black text-2xl mx-1">{alertRecord.eta}</span>
                      {' '}{T.minutes}
                    </p>

                    {/* Emergency numbers */}
                    <div className="flex flex-wrap gap-3 pt-5 border-t border-emerald-500/20">
                      {[
                        { label: appLang === 'Urdu' ? 'ریسکیو' : 'Rescue', num: '1122' },
                        { label: appLang === 'Urdu' ? 'ایمبولینس' : 'Ambulance', num: '115' },
                        { label: appLang === 'Urdu' ? 'پولیس' : 'Police', num: '15' },
                      ].map(({ label, num }) => (
                        <a key={num} href={`tel:${num}`}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border border-white/10 rounded-2xl hover:border-emerald-500/40 transition-all group"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">{label}</span>
                          <span className="text-lg font-black text-white">{num}</span>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-10"
              >
                <div className="glass-card p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 border-rose-500/5 shadow-2xl">
                  <div className="flex items-center gap-8">
                    <div className="p-6 bg-rose-500/10 rounded-[32px] border border-rose-500/20 shadow-inner">
                      <Send size={40} className="text-rose-500" />
                    </div>
                    <div className="text-center md:text-start">
                      <h2 className="text-4xl font-black text-slate-100 uppercase tracking-tighter mb-2">
                        {T.report}
                      </h2>
                      <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-80">
                        {T.incident_analysis}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportData({ alert_id: '', incident_type: 'Medical', incident_spot: '', description: '' }); setAiGuidance(''); }}
                    className="p-5 bg-white/5 border border-white/10 rounded-[24px] text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all hover:rotate-180 duration-700 shadow-xl"
                    title={T.reset_analysis}
                  >
                    <RefreshCw size={28} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="glass-card p-6 md:p-12 flex flex-col gap-8 md:gap-10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                    <div className="input-group !mb-0">
                      <label>{T.alert_id}</label>
                      <input 
                        placeholder="e.g. EMG-12345" 
                        value={reportData.alert_id}
                        onChange={e => setReportData({...reportData, alert_id: e.target.value})}
                        className="!py-6 !px-8 !text-lg !rounded-[24px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="input-group !mb-0 text-start">
                        <label>{T.emergency_gps}</label>
                        <input 
                          disabled 
                          className="opacity-40 cursor-not-allowed !py-6 !px-8 !text-lg !rounded-[24px]" 
                          placeholder={T.processing}
                        />
                      </div>
                      <div className="input-group !mb-0 text-start">
                        <label>{T.incident_type}</label>
                        <select 
                          value={reportData.incident_type}
                          onChange={e => setReportData({...reportData, incident_type: e.target.value})}
                          className="!py-6 !px-8 !text-lg !rounded-[24px] cursor-pointer"
                        >
                          <option value="Medical" className="bg-slate-900">{T.medical_label}</option>
                          <option value="Fire" className="bg-slate-900">{T.fire_label}</option>
                          <option value="Accident" className="bg-slate-900">{T.accident_label}</option>
                          <option value="Crime" className="bg-slate-900">{T.crime_label}</option>
                          <option value="Disaster" className="bg-slate-900">{T.disaster_label}</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group !mb-0 text-start">
                      <label>{T.incident_spot}</label>
                      <input 
                        placeholder={T.incident_spot}
                        value={reportData.incident_spot}
                        onChange={e => setReportData({...reportData, incident_spot: e.target.value})}
                        className="!py-6 !px-8 !text-lg !rounded-[24px]"
                      />
                    </div>

                    <div className="input-group !mb-0 text-start">
                      <label>{T.description}</label>
                      <div className="flex gap-4">
                        <textarea 
                          rows={4} 
                          placeholder={recordingField === 'report' ? (appLang === 'Urdu' ? 'سن رہا ہوں...' : 'Listening...') : T.description}
                          value={recordingField === 'report' ? (reportData.description ? reportData.description + ' ' + interimText : interimText) || reportData.description : reportData.description}
                          onChange={e => setReportData({...reportData, description: e.target.value})}
                          className="resize-none flex-1 !py-6 !px-8 !text-lg !rounded-[32px]"
                        />
                        <button 
                          onClick={() => toggleRecordingFor('report')}
                          className={`btn ${recordingField === 'report' ? 'bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.6)] animate-pulse' : 'bg-slate-900 hover:bg-slate-800'} px-8 shrink-0 flex-col gap-3 text-[11px] font-black tracking-widest rounded-[32px] transition-all border border-white/5`}
                        >
                          {recordingField === 'report' ? <Square size={28} fill="currentColor" /> : <Mic size={28} />}
                          <span>{T.rec}</span>
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={handleReport} 
                      disabled={isLoading}
                      className="w-full h-24 flex items-center justify-center gap-4 text-xl font-black tracking-[0.2em] uppercase bg-rose-500 hover:bg-rose-600 text-white rounded-[32px] shadow-2xl transition-all active:scale-95 border border-white/10 mt-6"
                    >
                      <Send size={28} strokeWidth={3} />
                      {isLoading ? T.processing : T.submit_report}
                    </button>
                  </div>

                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-8 flex-1 min-h-[500px]">
                      <div className="glass-card p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-blue-500/10 shadow-2xl">
                        <div className="flex items-center gap-6">
                           <div className="p-4 bg-blue-500/10 rounded-[24px] border border-blue-500/20 shadow-inner">
                            <Activity size={32} className="text-blue-500" />
                           </div>
                           <div className="text-start">
                            <h3 className="font-black text-2xl text-slate-100 uppercase tracking-tighter">
                              {T.tactical_guidance}
                            </h3>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
                              {T.ai_protocol}
                            </p>
                           </div>
                        </div>
                        {aiGuidance && (
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => playAudio(aiGuidance, appLang)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-2xl"
                            >
                              <Volume2 size={18} strokeWidth={3} /> {T.listen}
                            </button>
                            <button 
                              onClick={() => stopAudio()} 
                              className="p-4 text-slate-500 hover:text-rose-500 bg-white/5 hover:bg-rose-500/10 rounded-2xl transition-all border border-white/10"
                              title={T.abort_audio}
                            >
                              <Square size={20} fill="currentColor" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                        {aiGuidance ? (
                          <div className="space-y-8">
                            {aiGuidance.split('\n\n').map((section: string, idx: number) => {
                              let cleanSection = section.replace(/\*\*/g, '').replace(/[*#]/g, '').trim();
                              if (!cleanSection) return null;
                              
                              const isUrdu = /[\u0600-\u06FF]/.test(cleanSection);
                              
                              if (idx !== 2) {
                                cleanSection = cleanSection.replace(/^[۱-۹\d][.-]\s*/, '').replace(/^[۱-۹\d]\s/, '');
                              }

                              const isHeading = isUrdu ? (cleanSection.includes(':') && cleanSection.length < 60) : (cleanSection === cleanSection.toUpperCase() && cleanSection.length < 50);

                              return (
                                <motion.div 
                                  initial={{ opacity: 0, x: -20 }} 
                                  animate={{ opacity: 1, x: 0 }} 
                                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                                  key={idx} 
                                  className={`p-10 rounded-[40px] border transition-all ${isHeading ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-900/60 border-white/5 hover:border-white/10 shadow-2xl'} ${isUrdu ? 'text-right' : 'text-start'}`}
                                >
                                  {isHeading ? (
                                    <h4 className="text-lg font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-4">
                                      <div className="w-2 h-6 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.5)]"></div>
                                      {cleanSection}
                                    </h4>
                                  ) : (
                                    <p className={`leading-relaxed ${isUrdu ? 'text-emerald-100 font-bold text-2xl leading-loose' : 'text-slate-300 text-lg font-medium opacity-90'}`}>
                                      {cleanSection}
                                    </p>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-32">
                            <ShieldAlert size={100} className="mb-10 text-slate-800" />
                            <p className="text-sm font-black text-slate-600 uppercase tracking-[0.4em]">{T.awaiting_report}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'track' && (
              <motion.div
                key="track"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-5xl mx-auto"
              >
                <div className="glass-card overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/5">
                  <div className="p-10 md:p-16 border-b border-white/5 bg-slate-900/40">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                      <div className="flex items-center gap-8">
                        <div className="p-6 bg-emerald-500/10 rounded-[32px] border border-emerald-500/20 shadow-inner">
                          <Activity className="text-emerald-500" size={40} />
                        </div>
                        <div className="text-center md:text-start">
                          <h2 className="text-4xl font-black text-slate-100 uppercase tracking-tighter mb-2">{T.tactical_tracking}</h2>
                          <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-80">{T.active_dispatch}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTrackId(''); setTrackResult(null); }}
                        className="p-5 bg-white/5 border border-white/10 rounded-[24px] text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all hover:rotate-180 duration-700 shadow-xl"
                        title={T.recalibrate_trace}
                      >
                        <RefreshCw size={28} />
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative flex-1">
                        <input 
                          placeholder={T.alert_id} 
                          value={trackId}
                          onChange={e => setTrackId(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-[28px] px-10 py-6 text-xl text-white focus:border-emerald-500/50 outline-none transition-all shadow-inner placeholder:text-slate-800 font-bold"
                        />
                      </div>
                      <button 
                        onClick={handleTrack} 
                        className="px-12 py-6 bg-emerald-500 text-slate-950 font-black uppercase tracking-[0.2em] text-lg rounded-[28px] hover:bg-emerald-400 hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] active:scale-95 transition-all shadow-2xl border border-white/10"
                      >
                        {T.initiate_trace}
                      </button>
                    </div>
                  </div>

                  <div className="p-8 md:p-16 space-y-12 bg-slate-950/40">
                    {trackResult ? (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 md:space-y-16">
                        {/* Progress bar — always LTR so bar grows left→right in both languages */}
                        <div className="relative py-12 md:py-20 px-4 md:px-12 bg-slate-900/60 border border-white/5 rounded-[32px] md:rounded-[48px] shadow-inner overflow-hidden" dir="ltr">
                          {/* Track line */}
                          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2"></div>
                          {/* Active fill line */}
                          <div
                            className="absolute top-1/2 left-0 h-[2px] bg-emerald-500 -translate-y-1/2 transition-all duration-1000 shadow-[0_0_12px_rgba(60,229,164,0.8)]"
                            style={{ width: `${Math.min(100, (trackResult.elapsed_minutes / 15) * 100)}%` }}
                          ></div>
                          {/* Steps */}
                          <div className="relative flex justify-between items-center">
                            {T.dispatch_steps.map((stepLabel: string, i: number) => {
                               const isActive = i <= Math.floor(trackResult.elapsed_minutes / 3);
                               return (
                                 <div key={i} className="flex flex-col items-center gap-3 md:gap-6 relative z-10">
                                   <div className={`w-12 h-12 md:w-20 md:h-20 rounded-[20px] md:rounded-[32px] flex items-center justify-center border-2 md:border-4 transition-all duration-1000 ${isActive ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_30px_rgba(60,229,164,0.6)] rotate-45' : 'bg-slate-950 border-white/5'}`}>
                                     <div className={`${isActive ? '-rotate-45 text-slate-950' : 'text-slate-700'}`}>
                                       {i === 0 ? <ShieldAlert size={18} strokeWidth={3} className="md:hidden" /> : 
                                        i === 1 ? <Mic size={18} strokeWidth={3} className="md:hidden" /> : 
                                        i === 2 ? <MapPin size={18} strokeWidth={3} className="md:hidden" /> : 
                                        i === 3 ? <Activity size={18} strokeWidth={3} className="md:hidden" /> : 
                                        <CheckCircle2 size={18} strokeWidth={3} className="md:hidden" />}
                                       {i === 0 ? <ShieldAlert size={28} strokeWidth={3} className="hidden md:block" /> : 
                                        i === 1 ? <Mic size={28} strokeWidth={3} className="hidden md:block" /> : 
                                        i === 2 ? <MapPin size={28} strokeWidth={3} className="hidden md:block" /> : 
                                        i === 3 ? <Activity size={28} strokeWidth={3} className="hidden md:block" /> : 
                                        <CheckCircle2 size={28} strokeWidth={3} className="hidden md:block" />}
                                     </div>
                                   </div>
                                   <div className="flex flex-col items-center gap-1">
                                     <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-wide text-center transition-colors duration-1000 max-w-[50px] md:max-w-none leading-tight ${isActive ? 'text-emerald-400' : 'text-slate-600'}`}>{stepLabel}</span>
                                     {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shadow-[0_0_8px_#3ce5a4]"></div>}
                                   </div>
                                 </div>
                               );
                            })}
                          </div>
                        </div>

                        {/* Status message */}
                        <div className="flex items-center gap-4 p-6 md:p-8 bg-emerald-500/5 rounded-[24px] md:rounded-[32px] border border-emerald-500/20">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#3ce5a4] shrink-0"></div>
                          <p className={`text-sm font-semibold text-slate-300 leading-relaxed ${appLang === 'Urdu' ? 'text-right' : 'text-left'}`}>
                            {T.tactical_sync}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="py-40 text-center opacity-30">
                        <div className="w-32 h-32 bg-slate-900 rounded-[40px] flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-inner">
                          <Activity className="text-slate-700" size={64} strokeWidth={1} />
                        </div>
                        <h3 className="text-xl font-black text-slate-600 uppercase tracking-[0.4em] mb-4">{T.awaiting_telemetry}</h3>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col bg-slate-900/60 rounded-[32px] md:rounded-[48px] overflow-hidden border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
                style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
              >
                {/* Chat Header */}
                <div className="px-10 py-5 flex items-center justify-between bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                       <MessageSquare className="text-rose-500" size={20} strokeWidth={3} />
                     </div>
                     <div className="text-start">
                       <h2 className="text-lg font-black text-slate-100 uppercase tracking-tighter leading-none">{T.aria_header}</h2>
                       <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">{T.neural_core}</p>
                     </div>
                  </div>
                   {chatHistory.length > 0 && (
                     <button onClick={() => setChatHistory([])} className="text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/5">
                       <Trash2 size={14} /> {T.clear_chat}
                     </button>
                   )}
                </div>

                {/* Messages area — flex-1 so it fills remaining space */}
                <div className="flex-1 overflow-y-auto px-8 md:px-12 py-8 space-y-10 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 opacity-50">
                      <div className="w-24 h-24 bg-slate-950 rounded-full flex items-center justify-center mb-10 border border-white/5 shadow-inner">
                        <MessageSquare size={48} className="text-rose-500 opacity-60" strokeWidth={1} />
                      </div>
                      <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tighter mb-4">{T.how_help}</h3>
                      <p className="text-sm font-medium uppercase tracking-[0.2em]">{T.tap_speak}</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'user' ? (
                        <div className="max-w-[80%] bg-gradient-to-br from-rose-500 to-red-600 text-slate-950 px-8 py-5 rounded-[32px] rounded-tr-lg text-lg font-medium leading-relaxed shadow-2xl border border-rose-400/20 text-start">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="max-w-[90%] flex flex-col gap-4 text-start">
                          <div className="bg-slate-950 border border-white/10 shadow-inner text-slate-200 text-lg leading-relaxed px-8 py-6 rounded-[32px] rounded-tl-lg font-medium">
                            {msg.content}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 px-4">
                            <button 
                              onClick={() => playAudio(msg.content, appLang)}
                              className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl transition-all flex items-center gap-3 border border-white/5 shadow-xl"
                            >
                              <Volume2 size={16} strokeWidth={3} /> {T.listen}
                            </button>
                            <button 
                              onClick={() => stopAudio()}
                              className="text-[11px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-6 py-3 rounded-2xl transition-all flex items-center gap-3 border border-rose-500/10 shadow-xl"
                            >
                              <Square size={14} fill="currentColor" /> {T.stop}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                     <div className="flex justify-start px-4">
                       <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                         <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                         <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                       </div>
                     </div>
                  )}
                </div>

                {/* Input bar — part of normal flex flow, never overlaps messages */}
                <div className="shrink-0 bg-slate-950/90 border-t border-white/5 px-6 py-5 backdrop-blur-md">
                  <div className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-950 border border-white/10 rounded-[40px] p-3 shadow-[0_30px_60px_rgba(0,0,0,0.8)] focus-within:ring-2 focus-within:ring-rose-500/50 transition-all duration-500">
                    <div className={`flex items-center rounded-[28px] shrink-0 transition-all border border-transparent p-1 ${recordingField === 'chat' ? 'bg-rose-500 shadow-[0_0_20px_#e11d48]' : 'bg-white/5 hover:bg-white/10'}`}>
                      <button 
                        onClick={() => toggleRecordingFor('chat')}
                        className={`pl-5 pr-3 py-4 transition-all ${recordingField === 'chat' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        {recordingField === 'chat' ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}
                      </button>
                      <div className="w-[1px] h-6 mx-1 bg-white/10"></div>
                      <div className="text-[11px] font-black uppercase tracking-widest px-3 py-4 text-slate-400 select-none">
                        {appLang === 'Urdu' ? 'اردو' : 'EN'}
                      </div>
                    </div>
                    <textarea 
                      className="w-full bg-transparent border-none px-3 md:px-6 py-5 text-lg focus:ring-0 resize-none h-[68px] max-h-[200px] text-white leading-relaxed placeholder:text-slate-600 font-medium placeholder:truncate placeholder:whitespace-nowrap"
                      placeholder={recordingField === 'chat' ? T.intercepting : T.message_aria}
                      value={chatMessage}
                      onChange={e => {
                        setChatMessage(e.target.value);
                        e.target.style.height = '68px';
                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                      }}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChat();
                        }
                      }}
                    />
                    <button 
                      onClick={() => handleChat()} 
                      disabled={!chatMessage.trim() && !isLoading}
                      className={`p-5 rounded-[28px] shrink-0 transition-all shadow-2xl ${!chatMessage.trim() ? 'text-slate-700 cursor-not-allowed opacity-30' : 'text-white bg-rose-500 hover:bg-rose-600 hover:scale-105 active:scale-95'}`}
                    >
                      <ArrowRight size={24} strokeWidth={4} />
                    </button>
                  </div>
                  <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mt-3">{T.aria_mistakes}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-white/10 px-2 py-3 flex justify-around items-center z-[2000] backdrop-blur-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        {[
          { id: 'sos', label: T.sos, icon: <AlertCircle size={22} strokeWidth={3} /> },
          { id: 'report', label: T.report, icon: <Send size={22} strokeWidth={3} /> },
          { id: 'track', label: T.track, icon: <MapPin size={22} strokeWidth={3} /> },
          { id: 'chat', label: T.aria, icon: <MessageSquare size={22} strokeWidth={3} /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 transition-all flex-1 py-1.5 rounded-2xl ${
              activeTab === item.id ? 'text-rose-500 bg-rose-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-black uppercase tracking-wide leading-none max-w-[60px] text-center truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
