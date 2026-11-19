import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { DEFAULT_SITE_SETTINGS } from '../services/dataService';

export type AppLanguage = 'en' | 'hi';
export type AppLocale = 'en-IN' | 'hi-IN';

const LANG_KEY = 'amrit_ui_lang';

const CATEGORY_HI_MAP: Record<string, string> = {
  all: 'सभी',
  local: 'स्थानीय',
  national: 'राष्ट्रीय',
  politics: 'राजनीति',
  business: 'व्यापार',
  sports: 'खेल',
  education: 'शिक्षा',
  international: 'अंतरराष्ट्रीय',
  entertainment: 'मनोरंजन',
  technology: 'टेक्नोलॉजी',
  health: 'स्वास्थ्य',
};

const DISTRICT_HI_MAP: Record<string, string> = {
  'all j&k': 'संपूर्ण जम्मू-कश्मीर',
  'all jammu & kashmir': 'संपूर्ण जम्मू-कश्मीर',
  srinagar: 'श्रीनगर',
  jammu: 'जम्मू',
  rajouri: 'राजौरी',
  poonch: 'पुंछ',
  baramulla: 'बारामूला',
  leh: 'लेह',
  anantnag: 'अनंतनाग',
  kathua: 'कठुआ',
  udhampur: 'उधमपुर',
  'kashmir valley': 'कश्मीर घाटी',
  'jammu division': 'जम्मू संभाग',
  ladakh: 'लद्दाख',
};

const TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  // Navigation & Chrome
  home: { en: 'Home', hi: 'होम' },
  epaper: { en: 'E-Paper', hi: 'ई-पेपर' },
  videos: { en: 'Videos', hi: 'वीडियो' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
  about: { en: 'About', hi: 'हमारे बारे में' },
  contact: { en: 'Contact', hi: 'संपर्क करें' },
  adminPanel: { en: 'Admin Panel', hi: 'एडमिन पैनल' },
  sendUsNews: { en: 'Send Us News', hi: 'हमें ख़बर भेजें' },
  openMenu: { en: 'Open navigation menu', hi: 'नेविगेशन मेनू खोलें' },
  closeMenu: { en: 'Close navigation menu', hi: 'नेविगेशन मेनू बंद करें' },
  languageSwitchLabel: { en: 'Language switch', hi: 'भाषा बदलें' },
  searchArticlesLabel: { en: 'Search news articles', hi: 'समाचार लेख खोजें' },
  clearSearch: { en: 'Clear search', hi: 'खोज साफ़ करें' },
  searchNewsLabel: { en: 'Search news', hi: 'समाचार खोजें' },
  userProfileLabel: { en: 'User Profile', hi: 'उपयोगकर्ता प्रोफ़ाइल' },
  newsCategoriesLabel: { en: 'News categories', hi: 'समाचार श्रेणियाँ' },
  searchPlaceholder: {
    en: 'Search news by title or keyword...',
    hi: 'शीर्षक या कीवर्ड से समाचार खोजें...',
  },
  searchShortPlaceholder: {
    en: 'Search J&K news...',
    hi: 'जम्मू-कश्मीर समाचार खोजें...',
  },
  noMatchingNews: {
    en: 'No matching news articles found.',
    hi: 'कोई मेल खाता समाचार नहीं मिला।',
  },
  noResultsFound: {
    en: 'No results found.',
    hi: 'कोई परिणाम नहीं मिला।',
  },
  switchToHindi: { en: 'Switch UI to Hindi', hi: 'हिंदी में बदलें' },
  switchToEnglish: { en: 'Switch UI to English', hi: 'अंग्रेज़ी (English) में बदलें' },

  // Home & News Feed
  breaking: { en: 'Breaking', hi: 'ब्रेकिंग' },
  latestJKNews: { en: 'Latest J&K News', hi: 'ताज़ा जम्मू-कश्मीर समाचार' },
  chooseLocation: { en: 'Choose Location', hi: 'ज़िला चुनें' },
  allJK: { en: 'All J&K', hi: 'संपूर्ण जम्मू-कश्मीर' },
  allEditions: { en: 'All', hi: 'सभी' },
  hindiEdition: { en: 'Hindi', hi: 'हिंदी' },
  englishEdition: { en: 'English', hi: 'English' },
  filterLanguageLabel: { en: 'Filter by article language', hi: 'समाचार भाषा के अनुसार फ़िल्टर करें' },
  noArticlesFound: {
    en: 'No published articles match this filter yet.',
    hi: 'इस फ़िल्टर के लिए अभी कोई समाचार उपलब्ध नहीं है।',
  },
  mostReadJK: { en: 'Most Read in J&K', hi: 'J&K में सबसे ज़्यादा पढ़ा गया' },
  viewsLabel: { en: 'views', hi: 'पाठक' },
  readMore: { en: 'Read More', hi: 'पूरी ख़बर पढ़ें' },
  previousSlide: { en: 'Previous slide', hi: 'पिछली ख़बर' },
  nextSlide: { en: 'Next slide', hi: 'अगली ख़बर' },
  topCategories: { en: 'Top Categories', hi: 'प्रमुख श्रेणियाँ' },
  topCategoriesSub: {
    en: 'Explore Jammu & Kashmir and national coverage by section',
    hi: 'विभाग के अनुसार जम्मू-कश्मीर और राष्ट्रीय समाचार देखें',
  },
  story: { en: 'story', hi: 'ख़बर' },
  stories: { en: 'stories', hi: 'ख़बरें' },

  // Weather
  liveWeather: { en: 'Live Weather', hi: 'लाइव मौसम' },
  jammuAndSrinagar: { en: 'Jammu & Srinagar', hi: 'जम्मू और श्रीनगर' },
  currentLocation: { en: 'Current Location', hi: 'मेरा स्थान' },
  locating: { en: 'Locating...', hi: 'स्थान खोजा जा रहा है...' },
  refresh: { en: 'Refresh', hi: 'रीफ़्रेश' },
  tryAgain: { en: 'Try Again', hi: 'पुनः प्रयास करें' },
  kmPerHour: { en: 'km/h', hi: 'किमी/घंटा' },
  weatherUnavailable: {
    en: 'Live weather update unavailable right now.',
    hi: 'अभी लाइव मौसम अपडेट उपलब्ध नहीं है।',
  },
  locationUnsupported: {
    en: 'Location detection is not supported in this browser.',
    hi: 'इस ब्राउज़र में लोकेशन पहचान समर्थित नहीं है।',
  },
  locationDenied: {
    en: 'Location permission denied. Showing Jammu & Srinagar weather.',
    hi: 'लोकेशन अनुमति अस्वीकृत। जम्मू और श्रीनगर का मौसम दिखाया जा रहा है।',
  },
  locationFailed: {
    en: 'Unable to detect your location right now.',
    hi: 'अभी आपका स्थान प्राप्त नहीं हो सका।',
  },
  subBoth: {
    en: 'Current conditions for Jammu & Srinagar',
    hi: 'जम्मू और श्रीनगर का वर्तमान मौसम',
  },
  subJammu: { en: 'Current conditions for Jammu', hi: 'जम्मू का वर्तमान मौसम' },
  subSrinagar: { en: 'Current conditions for Srinagar', hi: 'श्रीनगर का वर्तमान मौसम' },
  subCurrentPrefix: { en: 'Current conditions for', hi: 'वर्तमान मौसम:' },
  subDetecting: {
    en: 'Detecting your current location',
    hi: 'आपका वर्तमान स्थान खोजा जा रहा है',
  },
  condClearSky: { en: 'Clear Sky', hi: 'साफ़ आसमान' },
  condPartlyCloudy: { en: 'Partly Cloudy', hi: 'आंशिक बादल' },
  condOvercast: { en: 'Overcast', hi: 'घने बादल' },
  condFoggy: { en: 'Foggy', hi: 'कोहरा / धुंध' },
  condRain: { en: 'Rain / Showers', hi: 'बारिश / बौछारें' },
  condSnowfall: { en: 'Snowfall', hi: 'बर्फ़बारी' },
  condThunderstorm: { en: 'Thunderstorm', hi: 'आंधी-तूफ़ान' },
  condFair: { en: 'Fair Weather', hi: 'सामान्य मौसम' },

  // News Detail & Comments
  articleNotFound: { en: 'Article not found.', hi: 'समाचार नहीं मिला।' },
  backToNews: { en: 'Back to News', hi: 'समाचारों पर वापस जाएँ' },
  backToHome: { en: 'Back to Home', hi: 'होम पर वापस जाएँ' },
  byLabel: { en: 'By', hi: 'रिपोर्ट:' },
  defaultAuthor: { en: 'Amrit Prasaran Desk', hi: 'अमृत प्रसारण डेस्क' },
  updatedLabel: { en: 'Updated', hi: 'अपडेट:' },
  smallSize: { en: 'Small', hi: 'छोटा' },
  mediumSize: { en: 'Medium', hi: 'मध्यम' },
  largeSize: { en: 'Large', hi: 'बड़ा' },
  saveArticle: { en: 'Save', hi: 'सहेजें' },
  savedArticle: { en: 'Saved', hi: 'सहेजा गया' },
  saveBookmarkLabel: { en: 'Save article to bookmarks', hi: 'समाचार बुकमार्क में सहेजें' },
  removeBookmarkLabel: { en: 'Remove bookmark', hi: 'बुकमार्क हटाएँ' },
  shareArticle: { en: 'Share this article', hi: 'इस समाचार को साझा करें' },
  shareBtn: { en: 'Share', hi: 'साझा करें' },
  sharedBtn: { en: 'Shared', hi: 'साझा किया' },
  copyLink: { en: 'Copy Link', hi: 'लिंक कॉपी करें' },
  copyLinkLabel: { en: 'Copy article link', hi: 'समाचार का लिंक कॉपी करें' },
  copiedLink: { en: 'Copied', hi: 'कॉपी हो गया' },
  listenArticleLabel: { en: 'Listen to article', hi: 'समाचार सुनें' },
  stopListeningLabel: { en: 'Stop listening', hi: 'सुनना बंद करें' },
  relatedStories: { en: 'Related Stories', hi: 'संबंधित समाचार' },
  commentsTitle: { en: 'Comments', hi: 'टिप्पणियाँ' },
  yourName: { en: 'Your Name', hi: 'आपका नाम' },
  enterYourName: { en: 'Enter your name', hi: 'अपना नाम दर्ज करें' },
  yourComment: { en: 'Your Comment', hi: 'आपकी टिप्पणी' },
  shareThoughts: {
    en: 'Share your thoughts on this article...',
    hi: 'इस समाचार पर अपने विचार लिखें...',
  },
  postComment: { en: 'Post Comment', hi: 'टिप्पणी भेजें' },
  commentPosted: { en: 'Comment posted!', hi: 'टिप्पणी प्रकाशित हो गई!' },
  noCommentsYet: {
    en: 'Be the first to share your thoughts on this article.',
    hi: 'इस समाचार पर टिप्पणी करने वाले पहले पाठक बनें।',
  },

  // Category Page
  allNewsTitle: { en: 'All News', hi: 'सभी समाचार' },
  newsHeadingSuffix: { en: 'News', hi: 'समाचार' },
  categoryUpdatesPrefix: {
    en: 'Jammu & Kashmir updates in',
    hi: 'जम्मू-कश्मीर की ताज़ा खबरें —',
  },
  noCategoryArticles: {
    en: 'No news articles found in this category right now.',
    hi: 'इस श्रेणी में अभी कोई समाचार उपलब्ध नहीं है।',
  },

  // E-Paper, PDF Canvas & Fullscreen Reader
  todaysEPaper: { en: "Today's E-Paper", hi: 'आज का ई-पेपर' },
  viewArchive: { en: 'View Archive', hi: 'सभी अंक देखें' },
  readFullScreen: { en: 'Read Full Screen', hi: 'फ़ुल स्क्रीन में पढ़ें' },
  pagesLabel: { en: 'Pages', hi: 'पृष्ठ' },
  pageLabel: { en: 'Page', hi: 'पृष्ठ' },
  epaperArchive: { en: 'E-Paper Archive', hi: 'ई-पेपर संग्रह' },
  epaperArchiveDesc: {
    en: 'Read multi-page Jammu & Kashmir newspaper editions, search inside pages, or open in full screen.',
    hi: 'जम्मू-कश्मीर के दैनिक अख़बार के सभी पृष्ठ पढ़ें, शब्दों को खोजें या फ़ुल स्क्रीन में ज़ूम करके देखें।',
  },
  epaperAlertsOn: { en: 'E-Paper Alerts ON', hi: 'ई-पेपर अलर्ट चालू' },
  notifyNewEPaper: { en: 'Notify on New E-Paper', hi: 'नए ई-पेपर की सूचना पाएँ' },
  searchEditionPlaceholder: { en: 'Search edition...', hi: 'अंक खोजें...' },
  filterByDate: { en: 'Filter by Date', hi: 'तारीख़ से चुनें' },
  resetFilter: { en: 'Reset', hi: 'रीसेट' },
  noEditionsForDate: {
    en: 'No editions found for this date.',
    hi: 'इस तारीख़ का कोई ई-पेपर उपलब्ध नहीं है।',
  },
  editionPrefix: { en: 'Edition:', hi: 'अंक:' },
  downloadPdf: { en: 'Download PDF', hi: 'PDF डाउनलोड करें' },
  shareEPaperLabel: { en: 'Share E-Paper edition', hi: 'ई-पेपर अंक साझा करें' },
  searchPdfPlaceholder: {
    en: 'Search keywords inside this newspaper PDF...',
    hi: 'इस अख़बार PDF के अंदर शब्द खोजें...',
  },
  searchingText: { en: 'Searching...', hi: 'खोजा जा रहा है...' },
  searchPages: { en: 'Search Pages', hi: 'पृष्ठों में खोजें' },
  clearText: { en: 'Clear', hi: 'साफ़ करें' },
  noPdfMatches: {
    en: 'No matching text found across this edition.',
    hi: 'इस अंक के पृष्ठों में यह शब्द नहीं मिला।',
  },
  tapToReadFullscreen: {
    en: 'Tap newspaper page to read & zoom in Full Screen',
    hi: 'ज़ूम करके पढ़ने के लिए अख़बार के पृष्ठ पर टैप करें',
  },
  noEPapersAvailable: { en: 'No E-Papers available.', hi: 'कोई ई-पेपर उपलब्ध नहीं है।' },
  newEPaperUploaded: { en: 'New E-Paper Uploaded', hi: 'नया ई-पेपर अपलोड हुआ' },
  readNow: { en: 'Read Now', hi: 'अभी पढ़ें' },
  dismiss: { en: 'Dismiss', hi: 'बंद करें' },
  closeNotification: { en: 'Close notification', hi: 'सूचना बंद करें' },
  searchBtn: { en: 'Search', hi: 'खोजें' },
  clipAndShare: { en: 'Clip & Share', hi: 'कटिंग साझा करें' },
  cancelClip: { en: 'Cancel Clip', hi: 'कटिंग रद्द करें' },
  allPages: { en: 'All Pages', hi: 'सभी पृष्ठ' },
  closeText: { en: 'Close', hi: 'बंद करें' },
  findBtn: { en: 'Find', hi: 'खोजें' },
  searchAcrossPages: {
    en: 'Search keyword across all pages...',
    hi: 'सभी पृष्ठों में शब्द खोजें...',
  },
  clipBanner: {
    en: 'Drag a rectangle over any news article on the newspaper page to clip & share it as an image.',
    hi: 'ख़बर की कटिंग बनाकर साझा करने के लिए अख़बार पर बॉक्स खींचें।',
  },
  editionPages: { en: 'Edition Pages', hi: 'अंक के पृष्ठ' },
  readerHint: {
    en: 'Pinch or double-tap to zoom · Swipe left/right to turn page',
    hi: 'ज़ूम करने के लिए पिंच या डबल-टैप करें · पृष्ठ बदलने के लिए स्वाइप करें',
  },
  newsCuttingReady: { en: 'News Cutting Ready', hi: 'ख़बर की कटिंग तैयार है' },
  downloadPng: { en: 'Download PNG', hi: 'इमेज डाउनलोड करें' },
  shareImage: { en: 'Share Image', hi: 'कटिंग साझा करें' },
  firstPage: { en: 'First Page', hi: 'पहला पृष्ठ' },
  lastPage: { en: 'Last Page', hi: 'अंतिम पृष्ठ' },
  previousPage: { en: 'Previous page', hi: 'पिछला पृष्ठ' },
  nextPage: { en: 'Next page', hi: 'अगला पृष्ठ' },
  zoomIn: { en: 'Zoom in', hi: 'ज़ूम इन' },
  zoomOut: { en: 'Zoom out', hi: 'ज़ूम आउट' },
  resetZoom: { en: 'Reset zoom', hi: 'ज़ूम रीसेट करें' },
  enterFullscreen: { en: 'Enter fullscreen', hi: 'फ़ुल स्क्रीन चालू करें' },
  exitFullscreen: { en: 'Exit fullscreen', hi: 'फ़ुल स्क्रीन बंद करें' },
  closeReader: { en: 'Close full screen reader', hi: 'फ़ुल स्क्रीन रीडर बंद करें' },
  clipShareTextPrefix: {
    en: 'Read full E-Paper on AMRIT PRASARAN:',
    hi: 'अमृत प्रसारण पर पूरा ई-पेपर पढ़ें:',
  },
  loadingNewspaper: { en: 'Loading newspaper edition...', hi: 'अख़बार लोड हो रहा है...' },
  couldNotDisplayPdf: { en: 'Could not display PDF page', hi: 'PDF पृष्ठ प्रदर्शित नहीं हो सका' },
  pdfLoadError: { en: 'Unable to load PDF edition.', hi: 'PDF अंक लोड नहीं हो सका।' },
  pdfRenderError: { en: 'Unable to render this PDF page.', hi: 'यह PDF पृष्ठ रेंडर नहीं हो सका।' },
  renderingText: { en: 'Rendering...', hi: 'रेंडर हो रहा है...' },

  // Videos
  latestVideos: { en: 'Latest Videos', hi: 'ताज़ा वीडियो' },
  viewAll: { en: 'View All', hi: 'सभी देखें' },
  videoNewsTitle: { en: 'Video News', hi: 'वीडियो समाचार' },
  videoNewsSubtitle: {
    en: 'Latest Jammu & Kashmir video bulletins and reports',
    hi: 'जम्मू-कश्मीर के ताज़ा वीडियो बुलेटिन और विशेष रिपोर्ट्स',
  },
  noVideosInCategory: {
    en: 'No videos available in this category.',
    hi: 'इस श्रेणी में अभी कोई वीडियो उपलब्ध नहीं है।',
  },

  // Newsletter, Ads & Footer
  newsletterTitle: { en: 'Subscribe to Newsletter', hi: 'न्यूज़लेटर की सदस्यता लें' },
  newsletterDesc: {
    en: 'Get the latest Jammu & Kashmir news in your inbox.',
    hi: 'जम्मू-कश्मीर की ताज़ा ख़बरें सीधे अपने ईमेल पर प्राप्त करें।',
  },
  emailPlaceholder: { en: 'Enter your email', hi: 'अपना ईमेल दर्ज करें' },
  joinBtn: { en: 'Join', hi: 'जुड़ें' },
  joiningBtn: { en: 'Joining...', hi: 'जुड़ रहा है...' },
  subscribeSuccess: {
    en: 'Subscribed successfully! Thank you for joining Amrit Prasaran.',
    hi: 'सदस्यता सफल रही! अमृत प्रसारण से जुड़ने के लिए धन्यवाद।',
  },
  subscribeAnother: { en: 'Subscribe another email', hi: 'एक और ईमेल जोड़ें' },
  subscribeError: {
    en: 'Could not save subscription. Please try again.',
    hi: 'सदस्यता सहेजी नहीं जा सकी। कृपया पुनः प्रयास करें।',
  },
  aboutUs: { en: 'About Us', hi: 'हमारे बारे में' },
  privacy: { en: 'Privacy', hi: 'गोपनीयता' },
  terms: { en: 'Terms', hi: 'नियम व शर्तें' },
  notificationSettings: { en: 'Notification Settings', hi: 'सूचना सेटिंग्स' },
  allRightsReserved: { en: 'All rights reserved.', hi: 'सर्वाधिकार सुरक्षित।' },
  sponsored: { en: 'Sponsored', hi: 'प्रायोजित विज्ञापन' },
  visitAd: { en: 'Visit', hi: 'विज़िट करें' },

  // PWA & Offline
  installApp: { en: 'Install App', hi: 'ऐप इंस्टॉल करें' },
  installAppTitle: { en: 'Install Amrit Prasaran App', hi: 'अमृत प्रसारण ऐप इंस्टॉल करें' },
  closeInstallGuide: { en: 'Close install instructions', hi: 'इंस्टॉल निर्देश बंद करें' },
  iosInstallPrefix: {
    en: 'On iPhone or iPad, tap the Safari',
    hi: 'iPhone या iPad पर नीचे दिए गए Safari के',
  },
  iosInstallShare: { en: 'Share', hi: 'Share' },
  iosInstallMiddle: {
    en: 'button below and choose',
    hi: 'बटन पर टैप करें और',
  },
  iosInstallAddHome: { en: 'Add to Home Screen', hi: 'Add to Home Screen' },
  iosInstallSuffix: {
    en: 'to install Amrit Prasaran.',
    hi: 'चुनकर अमृत प्रसारण ऐप इंस्टॉल करें।',
  },
  gotIt: { en: 'Got it', hi: 'समझ गया' },
  offlineBanner: {
    en: 'You are offline — showing cached J&K news & downloaded E-Papers.',
    hi: 'आप ऑफ़लाइन हैं — कैश किए गए समाचार और ई-पेपर दिखाए जा रहे हैं।',
  },

  // Profile
  savedBookmarks: { en: 'Saved Bookmarks', hi: 'सहेजे गए समाचार' },
  noBookmarks: {
    en: 'Articles you bookmark while reading will appear here.',
    hi: 'पढ़ते समय सहेजे गए समाचार यहाँ दिखाई देंगे।',
  },
  uploadPhotoLabel: { en: 'Upload profile photo', hi: 'प्रोफ़ाइल फ़ोटो अपलोड करें' },
  signOut: { en: 'Sign Out', hi: 'लॉग आउट' },
  signInToSync: {
    en: 'Sign in to sync across devices',
    hi: 'सभी डिवाइस पर सिंक करने के लिए साइन इन करें',
  },
  nameLabel: { en: 'Name', hi: 'नाम' },
  contactNumberLabel: { en: 'Contact Number', hi: 'संपर्क नंबर' },
  savingText: { en: 'Saving...', hi: 'सहेजा जा रहा है...' },
  saveChanges: { en: 'Save Changes', hi: 'बदलाव सहेजें' },
  profileSavedCloud: {
    en: 'Profile saved and synced to your Google account!',
    hi: 'प्रोफ़ाइल सहेजी गई और आपके Google खाते से सिंक हो गई!',
  },
  profileSavedLocal: {
    en: 'Profile saved on this device.',
    hi: 'प्रोफ़ाइल इस डिवाइस पर सहेजी गई।',
  },

  // Settings & Notification Feedback
  userSettings: { en: 'User Settings', hi: 'उपयोगकर्ता सेटिंग्स' },
  userSettingsDesc: {
    en: 'Manage language, install the PWA mobile app, and configure push notifications.',
    hi: 'भाषा बदलें, मोबाइल ऐप इंस्टॉल करें और समाचार सूचनाएँ सेट करें।',
  },
  displayLanguage: { en: 'Display Language', hi: 'ऐप की भाषा' },
  displayLanguageDesc: {
    en: 'Switch interface controls between English and Hindi (हिंदी).',
    hi: 'वेबसाइट के सभी बटन और मेनू English या हिंदी में बदलें।',
  },
  mobileOfflineApp: { en: 'Mobile & Offline App (PWA)', hi: 'मोबाइल और ऑफ़लाइन ऐप (PWA)' },
  mobileOfflineAppDesc: {
    en: 'Add Amrit Prasaran to your home screen for quick launch and offline E-Paper caching.',
    hi: 'तेज़ उपयोग और ऑफ़लाइन ई-पेपर पढ़ने के लिए अमृत प्रसारण को होम स्क्रीन पर जोड़ें।',
  },
  jkBreakingAlerts: {
    en: 'J&K Breaking News Alerts',
    hi: 'जम्मू-कश्मीर ब्रेकिंग न्यूज़ अलर्ट',
  },
  jkBreakingAlertsDesc: {
    en: 'Receive instant alerts for urgent news updates across Jammu & Kashmir.',
    hi: 'जम्मू-कश्मीर की बड़ी और ताज़ा ख़बरों की तुरंत सूचना प्राप्त करें।',
  },
  statusLabel: { en: 'Status:', hi: 'स्थिति:' },
  subscribedStatus: { en: 'Subscribed', hi: 'चालू' },
  offStatus: { en: 'Off', hi: 'बंद' },
  browserPermission: { en: 'Browser permission:', hi: 'ब्राउज़र अनुमति:' },
  permDefault: { en: 'Not asked yet', hi: 'अभी अनुमति नहीं मांगी गई' },
  permGranted: { en: 'Allowed', hi: 'स्वीकृत' },
  permDenied: { en: 'Blocked', hi: 'अस्वीकृत' },
  permUnsupported: { en: 'Unsupported', hi: 'समर्थित नहीं' },
  alertRegionFocus: { en: 'Alert Region Focus', hi: 'अलर्ट क्षेत्र चुनें' },
  verifyBreakingAlerts: {
    en: 'Verify how breaking news alerts appear on this device.',
    hi: 'जाँचें कि इस डिवाइस पर ब्रेकिंग न्यूज़ अलर्ट कैसे दिखते हैं।',
  },
  sendTestAlert: { en: 'Send Test Alert', hi: 'टेस्ट अलर्ट भेजें' },
  epaperPushTitle: {
    en: 'New E-Paper Upload Push Notifications',
    hi: 'नए ई-पेपर अपलोड की पुश सूचना',
  },
  epaperPushDesc: {
    en: 'Get notified automatically whenever a new daily newspaper PDF edition is uploaded.',
    hi: 'नया दैनिक अख़बार अपलोड होते ही तुरंत सूचना प्राप्त करें।',
  },
  testEPaperAlertsDesc: {
    en: 'Test how new E-Paper edition notifications appear on this device.',
    hi: 'जाँचें कि नए ई-पेपर की सूचना इस डिवाइस पर कैसी दिखती है।',
  },
  testEPaperAlert: { en: 'Test E-Paper Alert', hi: 'ई-पेपर अलर्ट टेस्ट करें' },
  devicePushChannel: { en: 'Device Push Channel:', hi: 'पुश नोटिफ़िकेशन माध्यम:' },
  fcmChannel: { en: 'Firebase Cloud Messaging (FCM)', hi: 'Firebase Cloud Messaging (FCM)' },
  swChannel: { en: 'Service Worker Push Synced', hi: 'सर्विस वर्कर पुश सिंक' },
  notRegistered: { en: 'Not Registered', hi: 'पंजीकृत नहीं' },
  fbBreakingOn: {
    en: 'Subscribed to J&K breaking news alerts',
    hi: 'जम्मू-कश्मीर ब्रेकिंग न्यूज़ अलर्ट चालू हो गए हैं',
  },
  fbBreakingOff: {
    en: 'Breaking news alerts have been paused.',
    hi: 'ब्रेकिंग न्यूज़ अलर्ट रोक दिए गए हैं।',
  },
  fbBreakingBlocked: {
    en: 'Browser notifications are blocked. Your in-app alert preference is saved.',
    hi: 'ब्राउज़र सूचनाएँ अवरुद्ध हैं। आपकी इन-ऐप अलर्ट प्राथमिकता सहेजी गई है।',
  },
  fbEpaperOn: {
    en: 'Push notifications enabled for new E-Paper uploads.',
    hi: 'नए ई-पेपर अपलोड के लिए पुश सूचनाएँ चालू हो गई हैं।',
  },
  fbEpaperOff: {
    en: 'E-Paper upload notifications have been paused.',
    hi: 'ई-पेपर अपलोड सूचनाएँ रोक दी गई हैं।',
  },
  fbEpaperBlocked: {
    en: 'Browser notifications are blocked. In-app E-Paper alerts remain active.',
    hi: 'ब्राउज़र सूचनाएँ अवरुद्ध हैं। इन-ऐप ई-पेपर अलर्ट सक्रिय रहेंगे।',
  },
  fbRegionUpdated: {
    en: 'Alert preference updated to',
    hi: 'अलर्ट क्षेत्र अपडेट किया गया:',
  },
  fbTestSent: {
    en: 'Test browser notification sent.',
    hi: 'टेस्ट ब्राउज़र सूचना भेज दी गई है।',
  },
  fbTestPreview: {
    en: 'Preview Alert',
    hi: 'अलर्ट पूर्वावलोकन',
  },
  testAlertTitlePrefix: {
    en: 'Breaking News',
    hi: 'ब्रेकिंग न्यूज़',
  },
  testAlertBody: {
    en: 'Major update from Jammu & Kashmir: Stay tuned to Amrit Prasaran for live coverage.',
    hi: 'जम्मू-कश्मीर से बड़ी ख़बर: लाइव कवरेज के लिए अमृत प्रसारण से जुड़े रहें।',
  },
  fbEpaperSent: {
    en: 'E-Paper push notification sent for',
    hi: 'इस ई-पेपर के लिए पुश सूचना भेजी गई:',
  },
  fbEpaperInApp: {
    en: 'In-app E-Paper alert triggered for',
    hi: 'इस ई-पेपर के लिए इन-ऐप अलर्ट चालू हुआ:',
  },

  // Submit Tip
  citizenNewsroomDesk: { en: 'Citizen Newsroom Desk', hi: 'नागरिक समाचार डेस्क' },
  sendUsNewsHeading: {
    en: 'Send Us News / Citizen Tip',
    hi: 'हमें ख़बर भेजें / नागरिक रिपोर्ट',
  },
  sendUsNewsDesc: {
    en: 'Spotted breaking news, civic issues, weather updates, or local events in Jammu & Kashmir? Share verified details directly with our editors. Your phone/contact stays private inside our newsroom review queue.',
    hi: 'जम्मू-कश्मीर में कोई बड़ी घटना, जन समस्या, मौसम अपडेट या स्थानीय कार्यक्रम देखा? सीधे हमारे संपादकों को विवरण भेजें। आपका फ़ोन नंबर पूर्णतः गोपनीय रखा जाएगा।',
  },
  tipReceivedTitle: {
    en: 'News tip received by Amrit Prasaran Newsroom!',
    hi: 'अमृत प्रसारण न्यूज़ रूम को आपकी ख़बर प्राप्त हो गई है!',
  },
  tipRefId: { en: 'Reference ID:', hi: 'संदर्भ संख्या:' },
  tipFillRequired: {
    en: 'Please fill in all required fields.',
    hi: 'कृपया सभी आवश्यक फ़ील्ड भरें।',
  },
  tipPhotoError: {
    en: 'Could not process that photo. Please try a JPG or PNG image.',
    hi: 'यह फ़ोटो प्रोसेस नहीं हो सकी। कृपया JPG या PNG छवि चुनें।',
  },
  tipSubmitError: {
    en: 'Unable to submit your tip right now. Please try again.',
    hi: 'अभी आपकी ख़बर सबमिट नहीं हो सकी। कृपया पुनः प्रयास करें।',
  },
  tipYourName: { en: 'Your Name *', hi: 'आपका नाम *' },
  tipNamePlaceholder: {
    en: 'e.g. Mohd Tariq / Priya Sharma',
    hi: 'जैसे: मोहम्मद तारिक / प्रिया शर्मा',
  },
  tipContactLabel: { en: 'Phone / WhatsApp / Email *', hi: 'फ़ोन / व्हाट्सऐप / ईमेल *' },
  tipContactPlaceholder: {
    en: 'For editorial verification only',
    hi: 'केवल संपादकीय सत्यापन के लिए',
  },
  tipDistrictLabel: { en: 'J&K District *', hi: 'जम्मू-कश्मीर ज़िला *' },
  tipOtherAllJK: { en: 'Other / All J&K', hi: 'अन्य / संपूर्ण J&K' },
  tipHeadlineLabel: { en: 'Tip Headline / Summary *', hi: 'ख़बर का शीर्षक / सारांश *' },
  tipHeadlinePlaceholder: {
    en: 'Brief headline of what happened',
    hi: 'घटना का संक्षिप्त शीर्षक लिखें',
  },
  tipDetailsLabel: {
    en: 'Full Details (When, Where & What Happened) *',
    hi: 'पूरा विवरण (कब, कहाँ और क्या हुआ) *',
  },
  tipDetailsPlaceholder: {
    en: 'Include exact location, time, and eyewitness details...',
    hi: 'सटीक स्थान, समय और प्रत्यक्षदर्शी विवरण लिखें...',
  },
  tipPhotoLabel: {
    en: 'Attach Field Photo (Optional — Auto-compressed)',
    hi: 'घटना की फ़ोटो जोड़ें (वैकल्पिक)',
  },
  compressingPhoto: { en: 'Compressing Photo...', hi: 'फ़ोटो तैयार हो रही है...' },
  changePhoto: { en: 'Change Photo', hi: 'फ़ोटो बदलें' },
  choosePhoto: { en: 'Choose Photo from Device', hi: 'डिवाइस से फ़ोटो चुनें' },
  removePhoto: { en: 'Remove Photo', hi: 'फ़ोटो हटाएँ' },
  submittingTip: { en: 'Submitting to Newsroom...', hi: 'न्यूज़ रूम को भेजा जा रहा है...' },
  submitTipBtn: { en: 'Submit News Tip', hi: 'ख़बर सबमिट करें' },

  // Contact & Info Pages
  contactUsTitle: { en: 'Contact Us & Ad Desk', hi: 'संपर्क करें और विज्ञापन डेस्क' },
  contactUsDesc: {
    en: 'Reach our Jammu & Kashmir editorial desk for news corrections, reader feedback, or local advertisement bookings.',
    hi: 'समाचार सुधार, पाठक सुझाव या स्थानीय विज्ञापन बुकिंग के लिए हमारे जम्मू-कश्मीर संपादकीय डेस्क से संपर्क करें।',
  },
  newsroomEmail: { en: 'Newsroom Email', hi: 'न्यूज़ रूम ईमेल' },
  phoneHelpline: { en: 'Phone / Helpline', hi: 'फ़ोन / हेल्पलाइन' },
  sendMessageTitle: { en: 'Send Message / Ad Inquiry', hi: 'संदेश या विज्ञापन पूछताछ भेजें' },
  inquiryReceived: {
    en: 'Inquiry Received by Amrit Prasaran Desk',
    hi: 'अमृत प्रसारण डेस्क को आपका संदेश प्राप्त हो गया है',
  },
  inquiryReceivedDesc: {
    en: 'Thank you for reaching out. Our editorial or advertisement coordinator will respond shortly.',
    hi: 'संपर्क करने के लिए धन्यवाद। हमारे संपादकीय या विज्ञापन समन्वयक शीघ्र ही उत्तर देंगे।',
  },
  sendAnotherMsg: { en: 'Send Another Message', hi: 'एक और संदेश भेजें' },
  inquiryNameLabel: { en: 'Your Name *', hi: 'आपका नाम *' },
  inquiryNamePlaceholder: {
    en: 'Full name or organization',
    hi: 'पूरा नाम या संस्थान का नाम',
  },
  inquiryPhoneEmail: { en: 'Phone or Email *', hi: 'फ़ोन या ईमेल *' },
  inquiryContactPlaceholder: {
    en: 'Phone number or email address',
    hi: 'फ़ोन नंबर या ईमेल पता',
  },
  inquiryTopic: { en: 'Inquiry Topic', hi: 'विषय चुनें' },
  inquiryMsgLabel: { en: 'Message *', hi: 'संदेश *' },
  inquiryMsgPlaceholder: {
    en: 'Write your feedback, news correction, or local advertisement details...',
    hi: 'अपना सुझाव, समाचार सुधार या विज्ञापन विवरण लिखें...',
  },
  sendingBtn: { en: 'Sending...', hi: 'भेजा जा रहा है...' },
  sendMessageBtn: { en: 'Send Message', hi: 'संदेश भेजें' },
  inquiryFillRequired: {
    en: 'Please fill in your name, contact info, and message.',
    hi: 'कृपया अपना नाम, संपर्क विवरण और संदेश भरें।',
  },
  inquirySubmitError: {
    en: 'Could not send your inquiry right now. Please try again or email our newsroom directly.',
    hi: 'अभी आपका संदेश नहीं भेजा जा सका। कृपया पुनः प्रयास करें या सीधे ईमेल करें।',
  },
  subjEditorial: { en: 'Editorial / Correction', hi: 'संपादकीय / समाचार सुधार' },
  subjAd: { en: 'Advertisement', hi: 'विज्ञापन (Advertisement)' },
  subjGeneral: { en: 'General', hi: 'सामान्य पूछताछ' },
  aboutUsTitle: { en: 'About Us', hi: 'हमारे बारे में' },
  defaultTagline: {
    en: 'Voice of Jammu & Kashmir · Digital News',
    hi: 'जम्मू-कश्मीर की आवाज़ · डिजिटल न्यूज़',
  },
  defaultAboutBody: {
    en: DEFAULT_SITE_SETTINGS.aboutText,
    hi: 'अमृत प्रसारण - J&K न्यूज़ जम्मू-कश्मीर के लोगों को सटीक, त्वरित और निष्पक्ष समाचार प्रदान करने के लिए समर्पित एक प्रमुख डिजिटल न्यूज़ प्लेटफ़ॉर्म है।',
  },
  privacyTitle: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  privacyBody: {
    en: 'We value your privacy. We do not sell your personal data to third parties.',
    hi: 'हम आपकी गोपनीयता का सम्मान करते हैं। हम आपका व्यक्तिगत डेटा किसी तीसरे पक्ष को नहीं बेचते हैं।',
  },
  termsTitle: { en: 'Terms of Use', hi: 'उपयोग की शर्तें' },
  termsBody: {
    en: 'By using Amrit Prasaran, you agree to abide by our editorial and community terms of service.',
    hi: 'अमृत प्रसारण का उपयोग करके आप हमारी संपादकीय और सेवा की शर्तों से सहमत होते हैं।',
  },
  appVersionTitle: { en: 'App Version', hi: 'ऐप संस्करण' },
};

function parseDateValue(dateValue: string | Date): Date {
  if (dateValue instanceof Date) return dateValue;
  const trimmed = dateValue.trim();
  // Avoid UTC midnight date shift across negative timezones for YYYY-MM-DD E-Paper dates
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]) - 1;
    const day = Number(isoDateMatch[3]);
    return new Date(year, month, day);
  }
  return new Date(trimmed);
}

interface LanguageContextValue {
  lang: AppLanguage;
  locale: AppLocale;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  translateCategory: (name: string) => string;
  translateDistrict: (name: string) => string;
  formatDate: (dateValue: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (dateValue: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  getLocalizedTagline: (rawTagline?: string) => string;
  getLocalizedAboutText: (rawAboutText?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  locale: 'en-IN',
  setLang: () => {},
  toggleLang: () => {},
  t: key => key,
  translateCategory: name => name,
  translateDistrict: name => name,
  formatDate: dateValue => String(dateValue),
  formatDateTime: dateValue => String(dateValue),
  formatNumber: value => String(value),
  getLocalizedTagline: raw => raw || TRANSLATIONS.defaultTagline.en,
  getLocalizedAboutText: raw => raw || TRANSLATIONS.defaultAboutBody.en,
});

function getInitialLang(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    return window.localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(getInitialLang);
  const locale: AppLocale = lang === 'hi' ? 'hi-IN' : 'en-IN';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANG_KEY, lang);
      } catch {
        // Ignore restricted storage environments
      }
    }
  }, [lang]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANG_KEY) {
        setLangState(e.newValue === 'hi' ? 'hi' : 'en');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState(prev => (prev === 'en' ? 'hi' : 'en'));
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = TRANSLATIONS[key];
      if (!entry) return key;
      return entry[lang];
    },
    [lang]
  );

  const translateCategory = useCallback(
    (name: string): string => {
      if (lang !== 'hi') return name;
      return CATEGORY_HI_MAP[name.trim().toLowerCase()] || name;
    },
    [lang]
  );

  const translateDistrict = useCallback(
    (name: string): string => {
      if (lang !== 'hi') return name;
      return DISTRICT_HI_MAP[name.trim().toLowerCase()] || name;
    },
    [lang]
  );

  const formatDate = useCallback(
    (dateValue: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      const d = parseDateValue(dateValue);
      if (Number.isNaN(d.getTime())) return String(dateValue);
      return d.toLocaleDateString(locale, options);
    },
    [locale]
  );

  const formatDateTime = useCallback(
    (dateValue: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      const d = parseDateValue(dateValue);
      if (Number.isNaN(d.getTime())) return String(dateValue);
      return d.toLocaleString(locale, options);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      if (!Number.isFinite(value)) return String(value);
      return value.toLocaleString(locale, options);
    },
    [locale]
  );

  const getLocalizedTagline = useCallback(
    (rawTagline?: string): string => {
      const trimmed = rawTagline?.trim();
      if (!trimmed || trimmed === DEFAULT_SITE_SETTINGS.tagline.trim()) {
        return TRANSLATIONS.defaultTagline[lang];
      }
      return trimmed;
    },
    [lang]
  );

  const getLocalizedAboutText = useCallback(
    (rawAboutText?: string): string => {
      const trimmed = rawAboutText?.trim();
      if (!trimmed || trimmed === DEFAULT_SITE_SETTINGS.aboutText.trim()) {
        return TRANSLATIONS.defaultAboutBody[lang];
      }
      return trimmed;
    },
    [lang]
  );

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      lang,
      locale,
      setLang,
      toggleLang,
      t,
      translateCategory,
      translateDistrict,
      formatDate,
      formatDateTime,
      formatNumber,
      getLocalizedTagline,
      getLocalizedAboutText,
    }),
    [
      lang,
      locale,
      setLang,
      toggleLang,
      t,
      translateCategory,
      translateDistrict,
      formatDate,
      formatDateTime,
      formatNumber,
      getLocalizedTagline,
      getLocalizedAboutText,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
