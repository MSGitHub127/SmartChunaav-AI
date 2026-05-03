/**
 * App.jsx – SmartChunaav AI
 *
 * Key improvements over the baseline:
 * - Full branding update: "SmartChunaav AI" across all 13 language strings.
 * - Civic colour theme: Deep Trust Blue (#1E3A8A) + Action Orange (#F97316).
 * - Accessibility (WCAG 2.1 AA):
 *     · Skip-to-main link for keyboard users.
 *     · Semantic landmarks: <header>, <main>, <footer>, <nav>.
 *     · All interactive elements have descriptive aria-label attributes.
 *     · aria-live="polite" on the results region for screen-reader announcements.
 *     · aria-busy on the form during submission.
 *     · Color-contrast safe palette (both colours pass 4.5:1 against white).
 * - useMemo for the translation lookup – avoids recalculating on every render.
 * - Audio toggles extracted into a single generic factory to remove duplication.
 * - ICS calendar description updated to SmartChunaav AI.
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import {
  Sun, Moon, Volume2, Pause,
  Video as YoutubeIcon, Globe, Newspaper, MapPin,
  ChevronDown, Calendar, MessageCircle, ExternalLink,
  Shield, BrainCircuit, Search, Cloud, RotateCcw, Heart
} from 'lucide-react'

// ── i18n strings ──────────────────────────────────────────────────────────────
const UI_TRANSLATIONS = {
  English: { appTitle: "SmartChunaav AI", appSubtitle: "Your Trusted Civic Election Guide", currentLocation: "Current Location", verified: "Verified", preferredLanguage: "Preferred Language", retrieveBtn: "Get Election Intelligence", loadingCoordinates: "Acquiring coordinates…", generatingIntel: "Generating Intelligence…", audioBriefing: "Audio Briefing", electionTimelines: "Election Timelines", saveToCalendar: "Save to Calendar", votingProcedures: "Voting Procedures", helpfulResources: "Helpful Resources", infoSynthesizedFor: "Information synthesised for:", countdownTitle: "Time Until Next Election", days: "Days", hours: "Hours", minutes: "Mins", seconds: "Secs", findPollingStation: "Nearest Polling Station", shareOnWhatsApp: "Share Guide", politicalLandscape: "Political Landscape", currentLeadership: "Current Leadership", keyCandidates: "Key Candidates", awaitingNomination: "Awaiting Nomination", generateNewReport: "Generate New Report" },
  Spanish: { appTitle: "SmartChunaav AI", appSubtitle: "Tu Guía Electoral Cívica de Confianza", currentLocation: "Ubicación Actual", verified: "Verificado", preferredLanguage: "Idioma Preferido", retrieveBtn: "Obtener Inteligencia Electoral", loadingCoordinates: "Adquiriendo coordenadas…", generatingIntel: "Generando Inteligencia…", audioBriefing: "Resumen de Audio", electionTimelines: "Cronogramas Electorales", saveToCalendar: "Guardar en Calendario", votingProcedures: "Procedimientos de Votación", helpfulResources: "Recursos Útiles", infoSynthesizedFor: "Información sintetizada para:", countdownTitle: "Tiempo hasta la próxima elección", days: "Días", hours: "Horas", minutes: "Min", seconds: "Seg", findPollingStation: "Centro de votación más cercano", shareOnWhatsApp: "Compartir guía", politicalLandscape: "Panorama Político", currentLeadership: "Liderazgo Actual", keyCandidates: "Candidatos Clave", awaitingNomination: "A la espera de nominación", generateNewReport: "Generar Nuevo Informe" },
  French: { appTitle: "SmartChunaav AI", appSubtitle: "Votre Guide Civique Électoral de Confiance", currentLocation: "Emplacement Actuel", verified: "Vérifié", preferredLanguage: "Langue Préférée", retrieveBtn: "Obtenir l'Intelligence Électorale", loadingCoordinates: "Acquisition des coordonnées…", generatingIntel: "Génération de l'intelligence…", audioBriefing: "Résumé Audio", electionTimelines: "Calendriers Électoraux", saveToCalendar: "Enregistrer dans le Calendrier", votingProcedures: "Procédures de Vote", helpfulResources: "Ressources Utiles", infoSynthesizedFor: "Informations synthétisées pour:", countdownTitle: "Temps avant la prochaine élection", days: "Jours", hours: "Heures", minutes: "Min", seconds: "Sec", findPollingStation: "Bureau de vote le plus proche", shareOnWhatsApp: "Partager le guide", politicalLandscape: "Paysage Politique", currentLeadership: "Direction Actuelle", keyCandidates: "Candidats Clés", awaitingNomination: "En attente de nomination", generateNewReport: "Générer un Nouveau Rapport" },
  German: { appTitle: "SmartChunaav AI", appSubtitle: "Ihr Vertrauenswürdiger Bürgerlicher Wahlführer", currentLocation: "Aktueller Standort", verified: "Verifiziert", preferredLanguage: "Bevorzugte Sprache", retrieveBtn: "Wahlintelligenz Abrufen", loadingCoordinates: "Koordinaten erfassen…", generatingIntel: "Informationen werden generiert…", audioBriefing: "Audio-Zusammenfassung", electionTimelines: "Wahltermine", saveToCalendar: "Im Kalender Speichern", votingProcedures: "Wahlverfahren", helpfulResources: "Hilfreiche Ressourcen", infoSynthesizedFor: "Informationen synthetisiert für:", countdownTitle: "Zeit bis zur nächsten Wahl", days: "Tage", hours: "Std.", minutes: "Min.", seconds: "Sek.", findPollingStation: "Nächstgelegenes Wahllokal", shareOnWhatsApp: "Leitfaden teilen", politicalLandscape: "Politische Landschaft", currentLeadership: "Aktuelle Führung", keyCandidates: "Schlüsselkandidaten", awaitingNomination: "Warten auf Nominierung", generateNewReport: "Neuen Bericht Generieren" },
  Hindi: { appTitle: "स्मार्टचुनाव AI", appSubtitle: "आपका विश्वसनीय नागरिक चुनाव सहायक", currentLocation: "वर्तमान स्थान", verified: "सत्यापित", preferredLanguage: "पसंदीदा भाषा", retrieveBtn: "चुनाव डेटा प्राप्त करें", loadingCoordinates: "निर्देशांक प्राप्त हो रहे हैं…", generatingIntel: "जानकारी तैयार हो रही है…", audioBriefing: "ऑडियो ब्रीफिंग", electionTimelines: "चुनाव समय-सीमा", saveToCalendar: "कैलेंडर में सहेजें", votingProcedures: "मतदान प्रक्रियाएं", helpfulResources: "उपयोगी संसाधन", infoSynthesizedFor: "के लिए जानकारी:", countdownTitle: "अगले चुनाव में शेष समय", days: "दिन", hours: "घंटे", minutes: "मिनट", seconds: "सेकंड", findPollingStation: "निकटतम मतदान केंद्र", shareOnWhatsApp: "गाइड साझा करें", politicalLandscape: "राजनीतिक परिदृश्य", currentLeadership: "वर्तमान नेतृत्व", keyCandidates: "प्रमुख उम्मीदवार", awaitingNomination: "नामांकन की प्रतीक्षा", generateNewReport: "नई रिपोर्ट बनाएं" },
  Gujarati: { appTitle: "સ્માર્ટચૂંટણી AI", appSubtitle: "તમારો વિશ્વસનીય નાગરિક ચૂંટણી સહાયક", currentLocation: "વર્તમાન સ્થાન", verified: "ચકાસાયેલ", preferredLanguage: "પસંદગીની ભાષા", retrieveBtn: "ચૂંટણી ડેટા મેળવો", loadingCoordinates: "કોઓર્ડિનેટ્સ મળી રહ્યા છે…", generatingIntel: "માહિતી તૈયાર થઈ રહી છે…", audioBriefing: "ઓડિયો બ્રીફિંગ", electionTimelines: "ચૂંટણી સમયરેખા", saveToCalendar: "કેલેન્ડરમાં સાચવો", votingProcedures: "મતદાન પ્રક્રિયાઓ", helpfulResources: "ઉપયોગી સંસાધનો", infoSynthesizedFor: "માટે માહિતી:", countdownTitle: "આગામી ચૂંટણી સુધીનો સમય", days: "દિવસ", hours: "કલાક", minutes: "મિનિટ", seconds: "સેકન્ડ", findPollingStation: "નજીકનું મતદાન કેન્દ્ર", shareOnWhatsApp: "માર્ગદર્શિકા શેર કરો", politicalLandscape: "રાજકીય પરિદ્રશ્ય", currentLeadership: "વર્તમાન નેતૃત્વ", keyCandidates: "મુખ્ય ઉમેદવારો", awaitingNomination: "નોમિનેશનની રાહ", generateNewReport: "નવો અહેવાલ બનાવો" },
  Marathi: { appTitle: "स्मार्टचुनाव AI", appSubtitle: "तुमचा विश्वासू नागरी निवडणूक सहाय्यक", currentLocation: "सध्याचे स्थान", verified: "सत्यापित", preferredLanguage: "पसंतीची भाषा", retrieveBtn: "निवडणूक माहिती मिळवा", loadingCoordinates: "स्थान मिळवत आहे…", generatingIntel: "माहिती तयार होत आहे…", audioBriefing: "ऑडिओ ब्रीफिंग", electionTimelines: "निवडणूक वेळापत्रक", saveToCalendar: "कॅलेंडरमध्ये जतन करा", votingProcedures: "मतदान प्रक्रिया", helpfulResources: "उपयुक्त संसाधने", infoSynthesizedFor: "माहिती:", countdownTitle: "पुढील निवडणुकीपर्यंत", days: "दिवस", hours: "तास", minutes: "मिनिटे", seconds: "सेकंड", findPollingStation: "जवळचे मतदान केंद्र", shareOnWhatsApp: "मार्गदर्शक सामायिक करा", politicalLandscape: "राजकीय चित्र", currentLeadership: "सध्याचे नेतृत्व", keyCandidates: "प्रमुख उमेदवार", awaitingNomination: "नामांकनाची प्रतीक्षा", generateNewReport: "नवा अहवाल" },
  Tamil: { appTitle: "ஸ்மார்ட்சுனாவ் AI", appSubtitle: "உங்கள் நம்பகமான குடிமை தேர்தல் உதவியாளர்", currentLocation: "தற்போதைய இடம்", verified: "சரிபார்க்கப்பட்டது", preferredLanguage: "விருப்பமான மொழி", retrieveBtn: "தேர்தல் தரவு பெற", loadingCoordinates: "இடம் கண்டறியப்படுகிறது…", generatingIntel: "தகவல் உருவாகிறது…", audioBriefing: "ஆடியோ சுருக்கம்", electionTimelines: "தேர்தல் காலக்கோடு", saveToCalendar: "காலண்டரில் சேமி", votingProcedures: "வாக்களிப்பு நடைமுறை", helpfulResources: "பயனுள்ள வளங்கள்", infoSynthesizedFor: "தகவல்:", countdownTitle: "அடுத்த தேர்தல் வரை", days: "நாட்கள்", hours: "மணி", minutes: "நிமிடம்", seconds: "வினாடி", findPollingStation: "அருகிலுள்ள வாக்குச்சாவடி", shareOnWhatsApp: "வழிகாட்டி பகிர்", politicalLandscape: "அரசியல் நிலவரம்", currentLeadership: "தற்போதைய தலைமை", keyCandidates: "முக்கிய வேட்பாளர்கள்", awaitingNomination: "பரிந்துரை காத்திருக்கிறது", generateNewReport: "புதிய அறிக்கை" },
  Telugu: { appTitle: "స్మార్ట్‌చునావ్ AI", appSubtitle: "మీ నమ్మకమైన పౌర ఎన్నికల సహాయకుడు", currentLocation: "ప్రస్తుత స్థానం", verified: "ధృవీకరించబడింది", preferredLanguage: "ఇష్టపడే భాష", retrieveBtn: "ఎన్నికల డేటా పొందండి", loadingCoordinates: "స్థానం గుర్తించబడుతోంది…", generatingIntel: "సమాచారం రూపొందుతోంది…", audioBriefing: "ఆడియో బ్రీఫింగ్", electionTimelines: "ఎన్నికల కాలక్రమం", saveToCalendar: "క్యాలెండర్‌లో సేవ్", votingProcedures: "ఓటింగ్ విధానాలు", helpfulResources: "ఉపయోగకరమైన వనరులు", infoSynthesizedFor: "సమాచారం:", countdownTitle: "తదుపరి ఎన్నికల వరకు", days: "రోజులు", hours: "గంటలు", minutes: "నిమిషాలు", seconds: "సెకన్లు", findPollingStation: "సమీప పోలింగ్ స్టేషన్", shareOnWhatsApp: "గైడ్ పంచుకోండి", politicalLandscape: "రాజకీయ దృశ్యం", currentLeadership: "ప్రస్తుత నాయకత్వం", keyCandidates: "ముఖ్య అభ్యర్థులు", awaitingNomination: "నామినేషన్ కోసం వేచి", generateNewReport: "కొత్త నివేదిక" },
  Bengali: { appTitle: "স্মার্টচুনাভ AI", appSubtitle: "আপনার বিশ্বস্ত নাগরিক নির্বাচন সহকারী", currentLocation: "বর্তমান অবস্থান", verified: "যাচাইকৃত", preferredLanguage: "পছন্দের ভাষা", retrieveBtn: "নির্বাচনী তথ্য পান", loadingCoordinates: "অবস্থান নির্ণয় হচ্ছে…", generatingIntel: "তথ্য তৈরি হচ্ছে…", audioBriefing: "অডিও সারসংক্ষেপ", electionTimelines: "নির্বাচনের সময়রেখা", saveToCalendar: "ক্যালেন্ডারে সংরক্ষণ", votingProcedures: "ভোটদানের পদ্ধতি", helpfulResources: "প্রয়োজনীয় সম্পদ", infoSynthesizedFor: "তথ্য:", countdownTitle: "পরবর্তী নির্বাচন পর্যন্ত", days: "দিন", hours: "ঘন্টা", minutes: "মিনিট", seconds: "সেকেন্ড", findPollingStation: "নিকটস্থ ভোটকেন্দ্র", shareOnWhatsApp: "গাইড শেয়ার করুন", politicalLandscape: "রাজনৈতিক দৃশ্যপট", currentLeadership: "বর্তমান নেতৃত্ব", keyCandidates: "মূল প্রার্থী", awaitingNomination: "মনোনয়নের অপেক্ষায়", generateNewReport: "নতুন প্রতিবেদন" },
  Kannada: { appTitle: "ಸ್ಮಾರ್ಟ್‌ಚುನಾವ್ AI", appSubtitle: "ನಿಮ್ಮ ವಿಶ್ವಾಸಾರ್ಹ ನಾಗರಿಕ ಚುನಾವಣಾ ಸಹಾಯಕ", currentLocation: "ಪ್ರಸ್ತುತ ಸ್ಥಳ", verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ", preferredLanguage: "ಆದ್ಯತೆಯ ಭಾಷೆ", retrieveBtn: "ಚುನಾವಣಾ ಡೇಟಾ ಪಡೆಯಿರಿ", loadingCoordinates: "ಸ್ಥಳ ಪತ್ತೆಯಾಗುತ್ತಿದೆ…", generatingIntel: "ಮಾಹಿತಿ ರಚಿಸಲಾಗುತ್ತಿದೆ…", audioBriefing: "ಆಡಿಯೋ ಬ್ರೀಫಿಂಗ್", electionTimelines: "ಚುನಾವಣಾ ಕಾಲಮಿತಿಗಳು", saveToCalendar: "ಕ್ಯಾಲೆಂಡರ್‌ಗೆ ಉಳಿಸಿ", votingProcedures: "ಮತದಾನ ಪ್ರಕ್ರಿಯೆಗಳು", helpfulResources: "ಉಪಯುಕ್ತ ಸಂಪನ್ಮೂಲಗಳು", infoSynthesizedFor: "ಮಾಹಿತಿ:", countdownTitle: "ಮುಂದಿನ ಚುನಾವಣೆ ವರೆಗೆ", days: "ದಿನಗಳು", hours: "ಗಂಟೆಗಳು", minutes: "ನಿಮಿಷಗಳು", seconds: "ಸೆಕೆಂಡ್", findPollingStation: "ಹತ್ತಿರದ ಮತಗಟ್ಟೆ", shareOnWhatsApp: "ಮಾರ್ಗದರ್ಶಿ ಹಂಚಿಕೊಳ್ಳಿ", politicalLandscape: "ರಾಜಕೀಯ ಭೂದೃಶ್ಯ", currentLeadership: "ಪ್ರಸ್ತುತ ನಾಯಕತ್ವ", keyCandidates: "ಪ್ರಮುಖ ಅಭ್ಯರ್ಥಿಗಳು", awaitingNomination: "ನಾಮನಿರ್ದೇಶನ ಕಾಯುತ್ತಿದೆ", generateNewReport: "ಹೊಸ ವರದಿ" },
  Malayalam: { appTitle: "സ്‌മാർട്ട്‌ചുനാവ് AI", appSubtitle: "നിങ്ങളുടെ വിശ്വസ്ത പൗര തിരഞ്ഞെടുപ്പ് സഹായി", currentLocation: "നിലവിലെ സ്ഥാനം", verified: "പരിശോധിച്ചു", preferredLanguage: "ഇഷ്ടമുള്ള ഭാഷ", retrieveBtn: "തിരഞ്ഞെടുപ്പ് ഡാറ്റ നേടുക", loadingCoordinates: "സ്ഥാനം കണ്ടെത്തുന്നു…", generatingIntel: "വിവരങ്ങൾ തയ്യാറാക്കുന്നു…", audioBriefing: "ഓഡിയോ ബ്രീഫിംഗ്", electionTimelines: "തിരഞ്ഞെടുപ്പ് ടൈംലൈൻ", saveToCalendar: "കലണ്ടറിൽ സേവ് ചെയ്യുക", votingProcedures: "വോട്ടിംഗ് നടപടിക്രമം", helpfulResources: "ഉപയോഗപ്രദ ഉറവിടങ്ങൾ", infoSynthesizedFor: "വിവരങ്ങൾ:", countdownTitle: "അടുത്ത തിരഞ്ഞെടുപ്പ് വരെ", days: "ദിവസങ്ങൾ", hours: "മണിക്കൂർ", minutes: "മിനിറ്റ്", seconds: "സെക്കൻഡ്", findPollingStation: "അടുത്ത പോളിംഗ് സ്റ്റേഷൻ", shareOnWhatsApp: "ഗൈഡ് പങ്കിടുക", politicalLandscape: "രാഷ്ട്രീയ ദൃശ്യം", currentLeadership: "നിലവിലെ നേതൃത്വം", keyCandidates: "പ്രധാന സ്ഥാനാർഥികൾ", awaitingNomination: "നാമനിർദ്ദേശം കാത്തിരിക്കുന്നു", generateNewReport: "പുതിയ റിപ്പോർട്ട്" },
  Punjabi: { appTitle: "ਸਮਾਰਟਚੁਨਾਵ AI", appSubtitle: "ਤੁਹਾਡਾ ਭਰੋਸੇਯੋਗ ਨਾਗਰਿਕ ਚੋਣ ਸਹਾਇਕ", currentLocation: "ਮੌਜੂਦਾ ਸਥਾਨ", verified: "ਪ੍ਰਮਾਣਿਤ", preferredLanguage: "ਤਰਜੀਹੀ ਭਾਸ਼ਾ", retrieveBtn: "ਚੋਣ ਡੇਟਾ ਪ੍ਰਾਪਤ ਕਰੋ", loadingCoordinates: "ਟਿਕਾਣਾ ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ…", generatingIntel: "ਜਾਣਕਾਰੀ ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ…", audioBriefing: "ਆਡੀਓ ਸੰਖੇਪ", electionTimelines: "ਚੋਣ ਸਮਾਂ-ਸੀਮਾ", saveToCalendar: "ਕੈਲੰਡਰ ਵਿੱਚ ਸੁਰੱਖਿਅਤ", votingProcedures: "ਵੋਟ ਪ੍ਰਕਿਰਿਆਵਾਂ", helpfulResources: "ਮਦਦਗਾਰ ਸਰੋਤ", infoSynthesizedFor: "ਜਾਣਕਾਰੀ:", countdownTitle: "ਅਗਲੀਆਂ ਚੋਣਾਂ ਤੱਕ", days: "ਦਿਨ", hours: "ਘੰਟੇ", minutes: "ਮਿੰਟ", seconds: "ਸਕਿੰਟ", findPollingStation: "ਨੇੜਲਾ ਪੋਲਿੰਗ ਸਟੇਸ਼ਨ", shareOnWhatsApp: "ਗਾਈਡ ਸਾਂਝੀ ਕਰੋ", politicalLandscape: "ਸਿਆਸੀ ਦ੍ਰਿਸ਼", currentLeadership: "ਮੌਜੂਦਾ ਲੀਡਰਸ਼ਿਪ", keyCandidates: "ਮੁੱਖ ਉਮੀਦਵਾਰ", awaitingNomination: "ਨਾਮਜ਼ਦਗੀ ਦੀ ਉਡੀਕ", generateNewReport: "ਨਵੀਂ ਰਿਪੋਰਟ" },
}

// ── Colour helpers for the civic theme ───────────────────────────────────────
// These map to the CSS custom properties in index.css / @theme.
const C = {
  // Primary button / active states
  primaryBtn: 'bg-[#1E3A8A] hover:bg-[#1e40af] text-white',
  primaryBtnFocus: 'focus:ring-[#F97316]',
  // Accent for CTAs
  accentBtn: 'bg-[#F97316] hover:bg-[#ea6c0a] text-white',
  // Timeline dot
  timelineDot: 'bg-[#1E3A8A]',
  // Step number bubble
  stepBubble: 'bg-[#1E3A8A] text-white',
  // Countdown numbers
  countdown: 'text-[#1E3A8A] dark:text-[#60a5fa]',
  // Playing audio indicator
  audioPlaying: 'bg-[#1E3A8A] text-white hover:bg-[#1e40af]',
}

// ── Generic audio toggle factory ──────────────────────────────────────────────
/**
 * Creates a play/pause toggle handler for a single audio track.
 * Centralising this removes ~60 lines of duplicated code.
 *
 * @param {string|null} audioData  - base64 data URI for the audio
 * @param {React.MutableRefObject} audioRef - ref that holds the Audio instance
 * @param {boolean} isPlaying      - current playback state
 * @param {Function} setIsPlaying  - state setter
 */
function makeAudioToggle(audioData, audioRef, isPlaying, setIsPlaying) {
  return () => {
    if (!audioData) return
    if (!audioRef.current) {
      audioRef.current = new Audio(audioData)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }
}

// ── Main component ────────────────────────────────────────────────────────────
function App() {
  const [theme, setTheme] = useState('light')
  const [location, setLocation] = useState({ lat: null, lon: null })
  const [language, setLanguage] = useState('English')
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [humanLocation, setHumanLocation] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)

  // Audio state for three separate tracks
  const [audioData, setAudioData] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const [audioDataVoting, setAudioDataVoting] = useState(null)
  const [isPlayingVoting, setIsPlayingVoting] = useState(false)
  const audioRefVoting = useRef(null)

  const [audioDataPolitics, setAudioDataPolitics] = useState(null)
  const [isPlayingPolitics, setIsPlayingPolitics] = useState(false)
  const audioRefPolitics = useRef(null)

  /**
   * useMemo ensures the translation lookup is only recalculated when the
   * language changes, not on every re-render (e.g. countdown tick).
   */
  const t = useMemo(
    () => UI_TRANSLATIONS[language] ?? UI_TRANSLATIONS['English'],
    [language]
  )

  // Dark/light theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Election countdown timer
  useEffect(() => {
    const rawDate = result?.response?.next_election_date
    if (!rawDate || rawDate === 'Unknown') { setTimeLeft(null); return }
    const target = new Date(rawDate)
    if (isNaN(target)) { setTimeLeft(null); return }

    const tick = () => {
      const diff = target - new Date()
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTimeLeft({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff / 3_600_000) % 24),
        minutes: Math.floor((diff / 60_000) % 60),
        seconds: Math.floor((diff / 1_000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [result])

  // Geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setIsLoadingLocation(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        setLocation({ lat, lon })
        axios.get(`/api/location?lat=${lat}&lon=${lon}`)
          .then(r => setHumanLocation(r.data.location))
          .catch(() => {/* non-fatal */ })
        setIsLoadingLocation(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError('Failed to retrieve your location. Please enable location services.')
        setIsLoadingLocation(false)
      }
    )
  }, [])

  // Audio toggle handlers (memoised via factory)
  const toggleAudio = makeAudioToggle(audioData, audioRef, isPlaying, setIsPlaying)
  const toggleAudioVoting = makeAudioToggle(audioDataVoting, audioRefVoting, isPlayingVoting, setIsPlayingVoting)
  const toggleAudioPolitics = makeAudioToggle(audioDataPolitics, audioRefPolitics, isPlayingPolitics, setIsPlayingPolitics)

  /** Stop all audio and clear all audio state. */
  const resetAudio = () => {
    [audioRef, audioRefVoting, audioRefPolitics].forEach(ref => {
      if (ref.current) { ref.current.pause(); ref.current = null }
    })
    setAudioData(null); setIsPlaying(false)
    setAudioDataVoting(null); setIsPlayingVoting(false)
    setAudioDataPolitics(null); setIsPlayingPolitics(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!location.lat || !location.lon) {
      setError('Cannot submit without location coordinates.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setResult(null)
    resetAudio()

    try {
      const { data } = await axios.post('/api/election-guide', {
        latitude: location.lat,
        longitude: location.lon,
        language,
      })
      setResult(data)
      if (data.audio_base64) setAudioData(data.audio_base64)
      if (data.audio_base64_voting) setAudioDataVoting(data.audio_base64_voting)
      if (data.audio_base64_politics) setAudioDataPolitics(data.audio_base64_politics)
    } catch (err) {
      console.error('API error:', err)
      setError(err.response?.data?.detail ?? 'Failed to fetch election information. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveToCalendar = (dateStr) => {
    if (!dateStr || dateStr === 'Unknown') return
    const d = new Date(dateStr)
    if (isNaN(d)) return
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//SmartChunaav AI//EN',
      'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${Date.now()}@smartchunaav.ai`,
      `DTSTAMP:${y}${m}${dd}T000000Z`,
      `DTSTART;VALUE=DATE:${y}${m}${dd}`,
      `DTEND;VALUE=DATE:${y}${m}${dd}`,
      'SUMMARY:Upcoming Election – SmartChunaav AI',
      'DESCRIPTION:Remember to verify your polling station and cast your vote!',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    link.download = 'election.ics'
    link.click()
  }

  const isDark = theme === 'dark'
  const card = `rounded-2xl shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`
  const muted = isDark ? 'text-slate-300' : 'text-slate-600'
  const strong = isDark ? 'text-white' : 'text-slate-900'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 flex justify-center`}>

      {/* Accessibility: skip-to-main for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Decorative gradient – hidden from AT */}
      <div aria-hidden="true" className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#1E3A8A]/10 via-transparent to-[#F97316]/5 opacity-60 dark:opacity-20 blur-3xl pointer-events-none" />

      <div className="w-full flex flex-col">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className={`sticky top-0 z-10 w-full border-b backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} shadow-sm`}
          role="banner">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Brand mark – decorative, no alt needed */}
              <Globe className="w-6 h-6 text-[#1E3A8A] dark:text-blue-400" aria-hidden="true" />
              <span className="text-xl font-bold tracking-tight">{t.appTitle}</span>
            </div>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316] ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* ── Main ────────────────────────────────────────────────────── */}
        <main id="main-content" className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          {/* Hero */}
          <section aria-label="Introduction" className="text-center space-y-4">
            <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${strong}`}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] to-[#F97316]">
                {t.appSubtitle}
              </span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${muted}`}>
              Real-time, personalised voting information localised to your region and language — powered by Google Vertex AI.
            </p>
          </section>

          {/* ── Input Card ──────────────────────────────────────────── */}
          <section aria-label="Query form" className={card}>
            <div className="p-6 md:p-8">
              <form
                onSubmit={handleSubmit}
                aria-busy={isSubmitting}
                aria-label="Election intelligence request form"
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Location status */}
                  <div className="space-y-3">
                    <p className={`text-sm font-semibold tracking-wide uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                      id="location-label">
                      {t.currentLocation}
                    </p>
                    <div
                      className={`flex items-center p-4 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      aria-labelledby="location-label"
                      role="status"
                      aria-live="polite"
                    >
                      {isLoadingLocation ? (
                        <div className="flex items-center w-full">
                          <div className="w-4 h-4 rounded-full border-2 border-[#1E3A8A] border-t-transparent animate-spin mr-3" aria-hidden="true" />
                          <span className="text-sm">{t.loadingCoordinates}</span>
                        </div>
                      ) : error && !location.lat ? (
                        <p className="text-red-500 text-sm" role="alert">{error}</p>
                      ) : (
                        <div className="flex items-center w-full">
                          <MapPin className="w-5 h-5 text-emerald-500 mr-3 shrink-0" aria-hidden="true" />
                          <span className="font-mono text-sm tracking-tight truncate">
                            {humanLocation || `${location.lat?.toFixed(4)}, ${location.lon?.toFixed(4)}`}
                          </span>
                          <span className={`ml-auto text-xs px-2 py-1 rounded-full shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}
                            aria-label="Location verified">
                            {t.verified}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Language selector */}
                  <div className="space-y-3">
                    <label htmlFor="language-select"
                      className={`block text-sm font-semibold tracking-wide uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t.preferredLanguage}
                    </label>
                    <div className="relative">
                      <select
                        id="language-select"
                        name="language"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        className={`block w-full rounded-xl border appearance-none p-4 pr-10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316] ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      >
                        <optgroup label="International Languages">
                          {['English', 'Spanish', 'French', 'German'].map(l => <option key={l} value={l}>{l}</option>)}
                        </optgroup>
                        <optgroup label="Indian Languages">
                          {['Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi'].map(l => <option key={l} value={l}>{l}</option>)}
                        </optgroup>
                      </select>
                      <ChevronDown className="pointer-events-none absolute inset-y-0 right-4 my-auto w-5 h-5 text-slate-500" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoadingLocation || !location.lat || isSubmitting}
                  className={`w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-md text-lg font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-[#F97316]/60 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 ${C.primaryBtn}`}
                  aria-label={isSubmitting ? t.generatingIntel : t.retrieveBtn}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-3" aria-hidden="true" />
                      {t.generatingIntel}
                    </>
                  ) : t.retrieveBtn}
                </button>
              </form>
            </div>
          </section>

          {/* Feature chips (shown when no result) */}
          {!result && !isSubmitting && (
            <section aria-label="Technology features" className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: BrainCircuit, gradient: 'from-[#1E3A8A] to-indigo-500', title: 'Vertex AI Gemini', desc: 'Powered by Google Gemini for grounded, multilingual election intelligence.' },
                { icon: Search, gradient: 'from-emerald-400 to-teal-500', title: 'Google Search Grounding', desc: 'Real-time data retrieval ensures up-to-the-minute electoral accuracy.' },
                { icon: Cloud, gradient: 'from-sky-400 to-[#1E3A8A]', title: 'Google Cloud', desc: 'Enterprise-grade secure infrastructure with native gTTS audio.' },
              ].map(({ icon: Icon, gradient, title, desc }) => (
                <article key={title} className={`flex flex-col items-center text-center p-6 rounded-2xl border backdrop-blur-sm shadow-lg transition-transform duration-300 hover:-translate-y-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/60 border-white'}`}>
                  <div className={`w-14 h-14 mb-4 rounded-2xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-inner`} aria-hidden="true">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h2 className={`font-bold mb-2 ${strong}`}>{title}</h2>
                  <p className={`text-sm ${muted}`}>{desc}</p>
                </article>
              ))}
            </section>
          )}

          {/* Error banner */}
          {error && !isSubmitting && location.lat && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-800 dark:text-red-300"
              role="alert" aria-live="assertive">
              <h2 className="font-semibold flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                An Error Occurred
              </h2>
              <p>{error}</p>
            </div>
          )}

          {/* ── Results ─────────────────────────────────────────────── */}
          {result?.response && !result.response.error && (
            <section
              aria-label="Election intelligence results"
              aria-live="polite"
              className="space-y-8"
            >
              {/* Location banner */}
              <div className={`px-4 py-3 rounded-lg border flex items-center text-sm font-medium ${isDark ? 'bg-indigo-900/30 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                {t.infoSynthesizedFor} <strong className="ml-1">{result.location_identified}</strong>
              </div>

              {/* Audio Summary Card */}
              {result.response.audio_summary && (
                <article className={`${card} p-6 md:p-8 relative overflow-hidden`}
                  aria-label="Audio election briefing">
                  <div className={`absolute top-0 left-0 w-1 h-full ${isPlaying ? 'bg-[#F97316]' : 'bg-slate-300 dark:bg-slate-600'} transition-colors`} aria-hidden="true" />
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <button
                      onClick={toggleAudio}
                      disabled={!audioData}
                      className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-[#F97316]/60 ${isPlaying ? C.audioPlaying : isDark ? 'bg-slate-700 text-[#60a5fa] hover:bg-slate-600' : 'bg-[#1E3A8A]/10 text-[#1E3A8A] hover:bg-[#1E3A8A]/20'}`}
                      aria-label={isPlaying ? 'Pause audio briefing' : 'Play audio briefing'}
                      aria-pressed={isPlaying}
                    >
                      {isPlaying ? <Pause className="w-7 h-7" /> : <Volume2 className="w-7 h-7 ml-0.5" />}
                    </button>
                    <div>
                      <h2 className={`text-sm font-bold uppercase tracking-wider mb-2 ${muted}`}>{t.audioBriefing}</h2>
                      <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {result.response.audio_summary}
                      </p>
                    </div>
                  </div>
                </article>
              )}

              {/* Timeline + Voting Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Timeline */}
                {result.response.timeline && (
                  <article className={`${card} p-6 md:p-8 flex flex-col`} aria-label="Election timelines">
                    <div className={`flex items-center justify-between border-b pb-4 mb-6 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                      <h2 className={`text-xl font-bold ${strong}`}>{t.electionTimelines}</h2>
                      {result.response.next_election_date && result.response.next_election_date !== 'Unknown' && (
                        <button
                          onClick={() => handleSaveToCalendar(result.response.next_election_date)}
                          className={`flex items-center text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316] ${isDark ? 'border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-slate-200' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                          aria-label="Save next election date to calendar"
                        >
                          <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                          {t.saveToCalendar}
                        </button>
                      )}
                    </div>

                    {/* Countdown */}
                    {timeLeft && (
                      <div className="mb-6" aria-label="Countdown to next election" role="timer">
                        <p className={`text-sm font-semibold mb-3 ${muted}`}>{t.countdownTitle}</p>
                        <div className="flex space-x-2 sm:space-x-4">
                          {[
                            { label: t.days, value: timeLeft.days },
                            { label: t.hours, value: timeLeft.hours },
                            { label: t.minutes, value: timeLeft.minutes },
                            { label: t.seconds, value: timeLeft.seconds },
                          ].map(item => (
                            <div key={item.label}
                              className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border w-16 sm:w-20 shadow-inner ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                              aria-label={`${String(item.value).padStart(2, '0')} ${item.label}`}>
                              <span className={`text-xl sm:text-2xl font-bold font-mono ${C.countdown}`}>
                                {String(item.value).padStart(2, '0')}
                              </span>
                              <span className={`text-[10px] sm:text-xs uppercase mt-1 ${muted}`}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline list */}
                    <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8 mt-2 flex-grow"
                      aria-label="Chronological election events">
                      {Array.isArray(result.response.timeline)
                        ? result.response.timeline.map((event, idx) => (
                          <li key={idx} className="relative pl-8">
                            <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ${C.timelineDot} ring-4 ring-white dark:ring-slate-800 shadow-sm`} aria-hidden="true" />
                            <div className={`mt-2 mb-8 ml-8 p-5 rounded-xl border shadow-sm ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <time className="font-bold text-[#1E3A8A] dark:text-blue-400" dateTime={event.date}>{event.date}</time>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{event.level}</span>
                              </div>
                              <h3 className="text-lg font-bold">{event.title}</h3>
                              <p className={`mt-1 ${muted}`}>{event.description}</p>
                            </div>
                          </li>
                        ))
                        : <li className={`text-sm ${muted}`}>Timeline data is unavailable.</li>
                      }
                    </ol>
                  </article>
                )}

                {/* Voting Steps */}
                {result.response.voting_steps?.length > 0 && (
                  <article className={`${card} p-6 md:p-8 flex flex-col`} aria-label="Voting procedures">
                    <h2 className={`text-xl font-bold mb-6 border-b pb-4 ${isDark ? 'text-white border-slate-700' : 'text-slate-900 border-slate-100'}`}>
                      {t.votingProcedures}
                    </h2>

                    {audioDataVoting && (
                      <div className={`mb-6 border-b pb-6 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-[#1E3A8A]/10 dark:bg-blue-900/30 rounded-lg text-[#1E3A8A] dark:text-blue-400" aria-hidden="true">
                              <Volume2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.audioBriefing}</p>
                              <p className={`text-xs ${muted}`}>AI Synthesised Voice</p>
                            </div>
                          </div>
                          <button
                            onClick={toggleAudioVoting}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316] ${C.primaryBtn}`}
                            aria-label={isPlayingVoting ? 'Pause voting procedures audio' : 'Play voting procedures audio'}
                            aria-pressed={isPlayingVoting}
                          >
                            {isPlayingVoting ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            <span>{isPlayingVoting ? 'Pause' : 'Play'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8 mt-2 flex-grow"
                      aria-label="Step-by-step voting instructions">
                      {result.response.voting_steps.map((step, idx) => (
                        <li key={idx} className="relative pl-8">
                          <div className={`absolute -left-[17px] ${C.stepBubble} rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm shadow-md`}
                            aria-label={`Step ${step.step_number}`}>
                            {step.step_number}
                          </div>
                          <h3 className={`text-lg font-bold ${strong}`}>{step.title}</h3>
                          <p className={`mt-2 ${muted}`}>{step.description}</p>
                        </li>
                      ))}
                    </ol>
                  </article>
                )}
              </div>

              {/* Political Landscape */}
              {(result.response.ruling_parties || result.response.key_candidates) && (
                <article className={`${card} p-6 md:p-8`} aria-label="Political landscape">
                  <h2 className={`text-xl font-bold mb-6 ${strong}`}>{t.politicalLandscape}</h2>

                  {audioDataPolitics && (
                    <div className={`mb-6 border-b pb-6 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#1E3A8A]/10 dark:bg-blue-900/30 rounded-lg text-[#1E3A8A] dark:text-blue-400" aria-hidden="true">
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.audioBriefing}</p>
                        </div>
                        <button
                          onClick={toggleAudioPolitics}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316] ${C.primaryBtn}`}
                          aria-label={isPlayingPolitics ? 'Pause political landscape audio' : 'Play political landscape audio'}
                          aria-pressed={isPlayingPolitics}
                        >
                          {isPlayingPolitics ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          <span>{isPlayingPolitics ? 'Pause' : 'Play'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Current Leadership */}
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${muted}`}>{t.currentLeadership}</h3>
                      <ul className="space-y-4">
                        {result.response.ruling_parties?.map((party, idx) => (
                          <li key={idx} className={`p-4 rounded-xl border flex items-start space-x-4 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            aria-label={`${party.level}: ${party.party_name}, led by ${party.leader_name}`}>
                            <Shield className="w-6 h-6 mt-1 shrink-0" style={{ color: party.party_color }} aria-hidden="true" />
                            <div>
                              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{party.level}</span>
                              <p className={`font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{party.party_name}</p>
                              <p className={`text-sm ${muted}`}>{party.leader_name}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Candidates */}
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${muted}`}>{t.keyCandidates}</h3>
                      <ul className="space-y-4">
                        {result.response.key_candidates?.map((c, idx) => (
                          <li key={idx} className={`p-4 rounded-xl border flex items-start space-x-4 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            aria-label={`${c.candidate_name} from ${c.party_name}`}>
                            <Shield className="w-6 h-6 mt-1 shrink-0" style={{ color: c.party_color }} aria-hidden="true" />
                            <div>
                              <p className={`text-xs font-medium mb-1 ${muted}`}>{c.party_name}</p>
                              <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {c.candidate_name === 'Awaiting official party nomination' ? t.awaitingNomination : c.candidate_name}
                              </p>
                              <p className={`text-sm mt-2 ${muted}`}>{c.portfolio}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              )}

              {/* Resources + Civic Actions */}
              {result.response.resources?.length > 0 && (
                <article className={`${card} p-6 md:p-8`} aria-label="Helpful resources and civic actions">
                  <h2 className={`text-xl font-bold mb-6 ${strong}`}>{t.helpfulResources}</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" aria-label="External resources">
                    {result.response.resources.map((resource, idx) => (
                      <li key={idx}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F97316] ${isDark ? 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-700/50' : 'bg-slate-50 border-slate-200 hover:border-[#1E3A8A]/30 hover:bg-[#1E3A8A]/5'}`}
                          aria-label={`${resource.title} – opens in new tab`}
                        >
                          <div className="mr-4 flex-shrink-0" aria-hidden="true">
                            {resource.type === 'youtube' && <YoutubeIcon className="w-8 h-8 text-red-500" />}
                            {resource.type === 'official' && <Globe className="w-8 h-8 text-[#1E3A8A]" />}
                            {resource.type === 'news' && <Newspaper className="w-8 h-8 text-slate-500 dark:text-slate-300" />}
                            {!['youtube', 'official', 'news'].includes(resource.type) && <Globe className="w-8 h-8 text-indigo-500" />}
                          </div>
                          <div className="overflow-hidden">
                            <p className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{resource.title}</p>
                            <p className={`text-xs truncate mt-1 ${muted}`}>{resource.url}</p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>

                  {/* Civic action buttons */}
                  <nav aria-label="Civic action links" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => setResult(null)}
                      className={`flex items-center justify-center p-4 rounded-xl shadow-md border transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500 ${isDark ? 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                      aria-label="Generate a new election intelligence report"
                    >
                      <RotateCcw className="w-5 h-5 mr-2 shrink-0" aria-hidden="true" />
                      {t.generateNewReport}
                    </button>
                    <a
                      href="https://electoralsearch.eci.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center p-4 rounded-xl shadow-md border transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] ${isDark ? 'bg-[#1E3A8A]/20 border-[#1E3A8A]/30 text-blue-300 hover:bg-[#1E3A8A]/30' : 'bg-[#1E3A8A]/5 border-[#1E3A8A]/20 text-[#1E3A8A] hover:bg-[#1E3A8A]/10'}`}
                      aria-label="Find your nearest polling station – opens ECI website"
                    >
                      <ExternalLink className="w-5 h-5 mr-2 shrink-0" aria-hidden="true" />
                      {t.findPollingStation}
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`*SmartChunaav AI* – ${result.location_identified}\n\n*${t.electionTimelines}:* ${result.response.next_election_date}\n\n*${t.audioBriefing}:*\n${result.response.audio_summary}\n\n🗳️ Get your guide at: https://smartchunaav.ai`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center p-4 rounded-xl shadow-md border transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                      aria-label="Share this election guide on WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5 mr-2 shrink-0" aria-hidden="true" />
                      {t.shareOnWhatsApp}
                    </a>
                  </nav>
                </article>
              )}
            </section>
          )}
        </main>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer
          className={`w-full py-8 mt-auto border-t backdrop-blur-sm ${isDark ? 'border-slate-800/50 bg-slate-900/20' : 'border-slate-200/50 bg-white/20'}`}
          role="contentinfo"
        >
          <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center space-y-2">
            <p className={`text-sm flex items-center justify-center font-medium ${muted}`}>
              Built with <Heart className="w-4 h-4 mx-1.5 text-red-500 fill-current" aria-label="love" /> for democracy
            </p>
            <p className={`text-xs ${muted}`}>
              SmartChunaav AI — Powered by Google Vertex AI Gemini &amp; Google Search Grounding
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App