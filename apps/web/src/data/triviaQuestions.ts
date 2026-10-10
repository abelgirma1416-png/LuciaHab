export type TriviaCategory =
  | 'ethiopian_history'
  | 'ethiopian_geography'
  | 'ethiopian_culture'
  | 'ethiopian_science'
  | 'african_history'
  | 'general_knowledge';

export type TriviaDifficulty = 'easy' | 'medium' | 'hard';

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  difficulty: TriviaDifficulty;
  question: {
    en: string;
    am: string;
  };
  options: {
    en: [string, string, string, string];
    am: [string, string, string, string];
  };
  correctIndex: number; // 0, 1, 2, or 3
  explanation: {
    en: string;
    am: string;
  };
}

export const TRIVIA_CATEGORY_LABELS: Record<TriviaCategory, { en: string; am: string }> = {
  ethiopian_history: { en: 'Ethiopian History', am: 'የኢትዮጵያ ታሪክ' },
  ethiopian_geography: { en: 'Ethiopian Geography', am: 'የኢትዮጵያ ጂኦግራፊ' },
  ethiopian_culture: { en: 'Culture & Heritage', am: 'ባህልና ቅርስ' },
  ethiopian_science: { en: 'Science & Nature', am: 'ሳይንስና ተፈጥሮ' },
  african_history: { en: 'African History', am: 'የአፍሪካ ታሪክ' },
  general_knowledge: { en: 'General Knowledge', am: 'አጠቃላይ እውቀት' },
};

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Ethiopian History
  {
    id: 'eth-hist-1',
    category: 'ethiopian_history',
    difficulty: 'easy',
    question: {
      en: 'In which year did the historic Battle of Adwa take place?',
      am: 'ታሪካዊው የአድዋ ጦርነት የተካሄደው በየትኛው ዓመተ ምሕረት (እ.ኤ.አ.) ነው?',
    },
    options: {
      en: ['1889', '1896', '1935', '1941'],
      am: ['1889', '1896', '1935', '1941'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Battle of Adwa took place on March 1, 1896, where Ethiopian forces decisively defeated the Italian army.',
      am: 'የአድዋ ጦርነት የተካሄደው በመጋቢት 1 ቀን 1896 እ.ኤ.አ. ሲሆን የኢትዮጵያ ሠራዊት የጣሊያንን ወራሪ ድል አድርጓል።',
    },
  },
  {
    id: 'eth-hist-2',
    category: 'ethiopian_history',
    difficulty: 'easy',
    question: {
      en: 'Which Ethiopian Emperor was famous for constructing the rock-hewn churches of Roha?',
      am: 'የሮሃ ውቅር አብያተ ክርስቲያናትን ያነጸው ታዋቂው የኢትዮጵያ ንጉሥ ማን ይባላል?',
    },
    options: {
      en: ['Emperor Lalibela', 'Emperor Tewodros II', 'Emperor Menelik II', 'Emperor Fasilides'],
      am: ['ንጉሥ ላሊበላ', 'አፄ ቴዎድሮስ', 'ዳግማዊ አፄ ምኒልክ', 'አፄ ፋሲለደስ'],
    },
    correctIndex: 0,
    explanation: {
      en: 'King Gebre Mesqel Lalibela commissioned the famous 11 rock-cut churches in the 12th–13th century.',
      am: 'ንጉሥ ገብረ መስቀል ላሊበላ በ12ኛው እና 13ኛው ክፍለ ዘመን 11ዱን ድንቅ የውቅር አብያተ ክርስቲያናት አሳንጿል።',
    },
  },
  {
    id: 'eth-hist-3',
    category: 'ethiopian_history',
    difficulty: 'medium',
    question: {
      en: 'Which capital city was founded by Emperor Fasilides in 1636?',
      am: 'በ1636 እ.ኤ.አ. በአፄ ፋሲለደስ የተመሰረተችው ዋና ከተማ የትኛዋ ናት?',
    },
    options: {
      en: ['Harar', 'Gondar', 'Axum', 'Ankober'],
      am: ['ሐረር', 'ጎንደር', 'አክሱም', 'አንኮበር'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Emperor Fasilides founded Gondar as the permanent imperial capital in 1636.',
      am: 'አፄ ፋሲለደስ በ1636 እ.ኤ.አ. ጎንደርን ቋሚ የንግሥና መዲና አድርገው መሠረቱ።',
    },
  },
  {
    id: 'eth-hist-4',
    category: 'ethiopian_history',
    difficulty: 'medium',
    question: {
      en: 'Who was the Empress of Ethiopia who played a decisive strategic role at the Battle of Adwa?',
      am: 'በአድዋ ጦርነት ላይ ቁልፍ ወታደራዊ እና ስልታዊ ሚና የተጫወተችው ንግሥት ማን ነች?',
    },
    options: {
      en: ['Empress Mentewab', 'Empress Taytu Betul', 'Empress Zewditu', 'Queen of Sheba'],
      am: ['እቴጌ ምንትዋብ', 'እቴጌ ጣይቱ ብጡል', 'ንግሥት ዘውዲቱ', 'ንግሥተ ሳባ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Empress Taytu Betul devised the crucial strategy to cut off the water supply to the Italian fort at Mekelle.',
      am: 'እቴጌ ጣይቱ ብጡል በመቀሌ የነበረውን የጣሊያን ምሽግ የውኃ ምንጭ በመቁረጥ ወሳኝ ስልት ቀይሰዋል።',
    },
  },
  {
    id: 'eth-hist-5',
    category: 'ethiopian_history',
    difficulty: 'hard',
    question: {
      en: 'Which ancient kingdom was centered in northern Ethiopia and traded with Rome and India?',
      am: 'በሰሜን ኢትዮጵያ ተመስርቶ ከሮም እና ከህንድ ጋር ንግድ ያካሂድ የነበረው ጥንታዊ መንግሥት የትኛው ነው?',
    },
    options: {
      en: ['Kingdom of Damot', 'Zagwe Dynasty', 'Kingdom of Aksum', 'Sultanate of Ifat'],
      am: ['የዳሞት መንግሥት', 'የዛግዌ ሥርወ መንግሥት', 'የአክሱም መንግሥት', 'የይፋት ሱልጣኔት'],
    },
    correctIndex: 2,
    explanation: {
      en: 'The Aksumite Empire was one of the four great powers of its era, issuing its own gold coins.',
      am: 'የአክሱም መንግሥት በወቅቱ ከነበሩት አራት ታላላቅ ኃያላን አንዱ የነበረ ሲሆን የራሱን የወርቅ ሳንቲም ያትም ነበር።',
    },
  },
  {
    id: 'eth-hist-6',
    category: 'ethiopian_history',
    difficulty: 'medium',
    question: {
      en: 'At which fortress did Emperor Tewodros II make his legendary last stand in 1868?',
      am: 'አፄ ቴዎድሮስ በ1868 እ.ኤ.አ. ታሪካዊውን የመጨረሻ ውጊያ ያደረጉበት ምሽግ የትኛው ነው?',
    },
    options: {
      en: ['Maqdala', 'Amba Alagi', 'Debre Damo', 'Gondar Fasil Ghebbi'],
      am: ['መቅደላ', 'አምባ አላጌ', 'ደብረ ዳሞ', 'ፋሲል ግቢ'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Emperor Tewodros II defended Maqdala against British expeditionary forces led by Napier.',
      am: 'አፄ ቴዎድሮስ በመቅደላ ምሽግ ከኔፒየር የእንግሊዝ ጦር ጋር ጀግንነት የተሞላበት ፍልሚያ አድርገዋል።',
    },
  },
  {
    id: 'eth-hist-7',
    category: 'ethiopian_history',
    difficulty: 'easy',
    question: {
      en: 'What was the ancient port city of the Aksumite Empire on the Red Sea coast?',
      am: 'በቀይ ባሕር ዳርቻ የነበረው የአክሱም መንግሥት ጥንታዊ የወደብ ከተማ ምን ይባላል?',
    },
    options: {
      en: ['Massawa', 'Adulis', 'Zeila', 'Assab'],
      am: ['ምጽዋ', 'አዱሊስ', 'ዘይላ', 'አሰብ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Adulis was the primary maritime trade hub of Aksum connecting the Horn of Africa to the Greco-Roman world.',
      am: 'አዱሊስ የአክሱም መንግሥት ዋነኛ የባሕር ንግድ በር የነበረች ጥንታዊ ወደብ ናት።',
    },
  },
  {
    id: 'eth-hist-8',
    category: 'ethiopian_history',
    difficulty: 'medium',
    question: {
      en: 'Which treaty signed in May 1889 became the dispute catalyst leading to the Battle of Adwa?',
      am: 'በግንቦት 1889 የተፈረመውና ለአድዋ ጦርነት መነሻ የሆነው አከራካሪው ውል ምን ይባላል?',
    },
    options: {
      en: ['Treaty of Hewett', 'Treaty of Wuchale', 'Treaty of Addis Ababa', 'Treaty of Berlin'],
      am: ['የሂዎት ውል', 'የውጫሌ ውል', 'የአዲስ አበባ ውል', 'የበርሊን ውል'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Treaty of Wuchale contained a disputed Article XVII with differing Amharic and Italian translations.',
      am: 'የውጫሌ ውል አንቀጽ 17 በአማርኛና በጣሊያንኛ ቋንቋ የተለያየ ትርጉም በመያዙ አለመግባባት ፈጥሯል።',
    },
  },

  // Ethiopian Geography
  {
    id: 'eth-geo-1',
    category: 'ethiopian_geography',
    difficulty: 'easy',
    question: {
      en: 'What is the highest mountain peak in Ethiopia?',
      am: 'በኢትዮጵያ ውስጥ ከፍተኛው የተራራ ጫፍ የትኛው ነው?',
    },
    options: {
      en: ['Mount Guna', 'Ras Dejen (Dashen)', 'Mount Batu', 'Mount Tullu Dimtu'],
      am: ['ጉና ተራራ', 'ራስ ደጀን (ዳሸን)', 'ባቱ ተራራ', 'ቱሉ ዲምቱ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Ras Dejen in the Simien Mountains reaches an elevation of approximately 4,550 meters (14,928 ft).',
      am: 'በሰሜን ተራሮች ብሔራዊ ፓርክ የሚገኘው ራስ ደጀን ወደ 4,550 ሜትር ከፍታ አለው።',
    },
  },
  {
    id: 'eth-geo-2',
    category: 'ethiopian_geography',
    difficulty: 'easy',
    question: {
      en: 'Which lake is the largest lake in Ethiopia and the source of the Blue Nile?',
      am: 'የኢትዮጵያ ትልቁ ሐይቅና የዓባይ ወንዝ መነሻ የሆነው ሐይቅ የትኛው ነው?',
    },
    options: {
      en: ['Lake Awassa', 'Lake Tana', 'Lake Ziway', 'Lake Chamo'],
      am: ['አዋሳ ሐይቅ', 'ጣና ሐይቅ', 'ዝዋይ ሐይቅ', 'ጫሞ ሐይቅ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Lake Tana spans approximately 3,000–3,500 km² and feeds the Abay (Blue Nile) River.',
      am: 'ጣና ሐይቅ ከ3,000 ስኩዌር ኪሎሜትር በላይ ስፋት ያለውና የዓባይ ወንዝ መፍለቂያ ነው።',
    },
  },
  {
    id: 'eth-geo-3',
    category: 'ethiopian_geography',
    difficulty: 'medium',
    question: {
      en: 'What dramatic depression in northeastern Ethiopia is known as one of the hottest places on Earth?',
      am: 'በሰሜን ምሥራቅ ኢትዮጵያ የሚገኘውና በዓለም ላይ ካሉ እጅግ ሞቃታማ ስፍራዎች አንዱ የሆነው ዝቅተኛ ስፍራ ማን ይባላል?',
    },
    options: {
      en: ['Ogaden Basin', 'Danakil Depression', 'Omo Valley', 'Rift Valley Lakes'],
      am: ['የኦጋዴን ቆላ', 'ዳናኪል (ዳሎል) ዲፕሬሽን', 'የኦሞ ሸለቆ', 'ስምጥ ሸለቆ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Danakil Depression lies over 100 meters below sea level and features Dallol and active lava lakes.',
      am: 'ዳናኪል ዲፕሬሽን ከባሕር ወለል በታች ከ100 ሜትር በላይ ዝቅ ያለና ዳሎልን የመሳሰሉ ድንቅ የተፈጥሮ ክስተቶችን የያዘ ነው።',
    },
  },
  {
    id: 'eth-geo-4',
    category: 'ethiopian_geography',
    difficulty: 'medium',
    question: {
      en: 'What is the name of the majestic waterfall formed by the Blue Nile near Bahir Dar?',
      am: 'በባሕር ዳር አቅራቢያ በዓባይ ወንዝ ላይ የሚገኘው አስደናቂው ፏፏቴ ምን ይባላል?',
    },
    options: {
      en: ['Tis Issat (Blue Nile Falls)', 'Victoria Falls', 'Bale Falls', 'Koka Falls'],
      am: ['ጢስ እሳት ፏፏቴ', 'ቪክቶሪያ ፏፏቴ', 'የባሌ ፏፏቴ', 'የቆቃ ፏፏቴ'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Tis Issat translates to "Smoking Fire" in Amharic, describing the misty spray created by the falls.',
      am: 'ጢስ እሳት ማለት "የሚጨስ እሳት" ማለት ሲሆን የወንዙ ውኃ ወደ ጥልቁ ሲወረወር የሚፈጥረውን ጉም ይገልጻል።',
    },
  },
  {
    id: 'eth-geo-5',
    category: 'ethiopian_geography',
    difficulty: 'hard',
    question: {
      en: 'Which massive geological formation divides the Ethiopian highlands into northwestern and southeastern sections?',
      am: 'የኢትዮጵያን ከፍተኛ ቦታዎች ለሁለት የሚከፍለው ታላቁ የመሬት አቀማመጥ ምን ይባላል?',
    },
    options: {
      en: ['Sahara Belt', 'Great Rift Valley', 'Atlas Fault', 'Congo Basin'],
      am: ['የሳህራ ቀበቶ', 'ታላቁ የስምጥ ሸለቆ', 'የአትላስ ስምጥ', 'የኮንጎ ተፋሰስ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Main Ethiopian Rift runs southwest to northeast, splitting the central highlands.',
      am: 'ታላቁ የስምጥ ሸለቆ ከደቡብ ምዕራብ ወደ ሰሜን ምሥራቅ በመዘርጋት የኢትዮጵያን ደጋማ ቦታዎች ይከፍላል።',
    },
  },
  {
    id: 'eth-geo-6',
    category: 'ethiopian_geography',
    difficulty: 'easy',
    question: {
      en: 'How many countries directly border Ethiopia today?',
      am: 'በአሁኑ ወቅት ኢትዮጵያን የሚያዋስኗት አገራት ስንት ናቸው?',
    },
    options: {
      en: ['4', '5', '6', '7'],
      am: ['4', '5', '6', '7'],
    },
    correctIndex: 2,
    explanation: {
      en: 'Ethiopia is bordered by 6 nations: Eritrea, Djibouti, Somalia, Kenya, South Sudan, and Sudan.',
      am: 'ኢትዮጵያ በ6 አገራት ትዋሰናለች፡ ኤርትራ፣ ጅቡቲ፣ ሶማሊያ፣ ኬንያ፣ ደቡብ ሱዳን እና ሱዳን።',
    },
  },

  // Ethiopian Culture & Heritage
  {
    id: 'eth-cult-1',
    category: 'ethiopian_culture',
    difficulty: 'easy',
    question: {
      en: 'What is the traditional fermented flatbread that forms the staple base of Ethiopian dining?',
      am: 'በኢትዮጵያ ምግብ ባህል ውስጥ ዋነኛ መሠረት የሆነው ባህላዊ የቦካ ጠፍጣፋ ምግብ ምን ይባላል?',
    },
    options: {
      en: ['Injera', 'Dabo Kolo', 'Kocho', 'Ambasha'],
      am: ['እንጀራ', 'ዳቦ ቆሎ', 'ቆጮ', 'አምባሻ'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Injera is traditionally made from fermented teff flour, giving it a distinctive spongy texture and sour taste.',
      am: 'እንጀራ ከጤፍ ዱቄት ተቦክቶ የሚጋገር ልዩ የኢትዮጵያ ምግብ ነው።',
    },
  },
  {
    id: 'eth-cult-2',
    category: 'ethiopian_culture',
    difficulty: 'easy',
    question: {
      en: 'What grain, endemic to the Horn of Africa, is prized globally for being gluten-free and highly nutritious?',
      am: 'በዓለም አቀፍ ደረጃ ከግሉተን ነፃ በመሆኑና በከፍተኛ አልሚ ምግቡ የሚታወቀው የኢትዮጵያ እህል የትኛው ነው?',
    },
    options: {
      en: ['Sorghum', 'Teff', 'Millet', 'Barley'],
      am: ['ማሽላ', 'ጤፍ', 'ዳጉሳ', 'ገብስ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Teff (Eragrostis tef) is an ancient tiny grain rich in iron, calcium, and protein.',
      am: 'ጤፍ በብረት (iron)፣ በካልሲየም እና በፕሮቲን የበለፀገ እጅግ ጥንታዊ ጥራጥሬ እህል ነው።',
    },
  },
  {
    id: 'eth-cult-3',
    category: 'ethiopian_culture',
    difficulty: 'medium',
    question: {
      en: 'What is the traditional clay pot used to brew coffee in an authentic Ethiopian coffee ceremony?',
      am: 'በኢትዮጵያ ባህላዊ የቡና ሥነ-ሥርዓት ወቅት ቡና የሚፈላበት የሸክላ ዕቃ ምን ይባላል?',
    },
    options: {
      en: ['Cini', 'Jebena', 'Rekebot', 'Muda'],
      am: ['ሲኒ', 'ጀበና', 'ረከቦት', 'ሙዳ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Jebena is an iconic clay pot featuring a spherical base, neck, and pouring spout.',
      am: 'ጀበና ቡናን በባህላዊ መንገድ ለማፍላት የሚያገለግል አንገተ ረጅም የሸክላ ዕቃ ነው።',
    },
  },
  {
    id: 'eth-cult-4',
    category: 'ethiopian_culture',
    difficulty: 'medium',
    question: {
      en: 'Which democratic socio-political system of the Oromo people is recognized by UNESCO as Intangible Cultural Heritage?',
      am: 'በዩኔስኮ በማይዳሰስ ቅርስነት የተመዘገበው የኦሮሞ ሕዝብ ባህላዊና ዴሞክራሲያዊ የአስተዳደር ሥርዓት ምን ይባላል?',
    },
    options: {
      en: ['Gadaa System', 'Shengo', 'Luwa System', 'Bayto'],
      am: ['የገዳ ሥርዓት', 'ሸንጎ', 'የሉዋ ሥርዓት', 'ባይቶ'],
    },
    correctIndex: 0,
    explanation: {
      en: 'The Gadaa system is an indigenous democratic socio-political system structuring leadership in 8-year generational terms.',
      am: 'የገዳ ሥርዓት በየ8 ዓመቱ ሥልጣን የሚሸጋገርበት ጥንታዊና ዴሞክራሲያዊ የኦሮሞ ማኅበረሰብ የአስተዳደር ሥርዓት ነው።',
    },
  },
  {
    id: 'eth-cult-5',
    category: 'ethiopian_culture',
    difficulty: 'hard',
    question: {
      en: 'What is the name of the traditional 10-stringed lyre commonly played by Ethiopian azmaris?',
      am: 'በባህላዊ አዝማሪዎች ዘንድ በስፋት የሚዘፈንበት ባለ 10 ክር የኢትዮጵያ የሙዚቃ መሣሪያ ምን ይባላል?',
    },
    options: {
      en: ['Masenqo', 'Begena', 'Krar', 'Washint'],
      am: ['ማሲንቆ', 'በገና', 'ክራር', 'ዋሽንት'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Begena (often called David\'s Harp) is a 10-stringed box-lyre, while the Krar typically has 5 or 6 strings.',
      am: 'በገና 10 ክሮች ያሉት የመንፈሳዊ ዝማሬ መሣሪያ ሲሆን ክራር ግን ብዙውን ጊዜ 5 ወይም 6 ክሮች አሉት።',
    },
  },
  {
    id: 'eth-cult-6',
    category: 'ethiopian_culture',
    difficulty: 'medium',
    question: {
      en: 'What is the historic walled city in eastern Ethiopia known as the "City of Peace" and home to 82 mosques?',
      am: 'በ82 መስጊዶቿና በታሪካዊው ግንቧ የምትታወቀው የምሥራቅ ኢትዮጵያ ጥንታዊ ከተማ ማን ትባላለች?',
    },
    options: {
      en: ['Dire Dawa', 'Harar Jugol', 'Jijiga', 'Aweday'],
      am: ['ድሬዳዋ', 'ሐረር ጁጎል', 'ጅጅጋ', 'አወዳይ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Harar Jugol is a fortified historic town and UNESCO World Heritage site known as Islam\'s fourth holiest city.',
      am: 'ሐረር ጁጎል በግንብ የታጠረች ታሪካዊ ከተማ ስትሆን በዩኔስኮ ቅርስነት የተመዘገበች ነች።',
    },
  },
  {
    id: 'eth-cult-7',
    category: 'ethiopian_culture',
    difficulty: 'easy',
    question: {
      en: 'Which festival celebrating the Finding of the True Cross is commemorated with the lighting of the Demera bonfire?',
      am: 'ደመራ በመለኮስ የሚከበረውና በዩኔስኮ የተመዘገበው ታላቁ የኢትዮጵያ በዓል የትኛው ነው?',
    },
    options: {
      en: ['Timket (Epiphany)', 'Meskel', 'Genna (Christmas)', 'Fasika (Easter)'],
      am: ['ጥምቀት', 'መስቀል', 'ገና', 'ፋሲካ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Meskel commemorates the finding of the True Cross by Queen Helena with the Demera bonfire ceremony.',
      am: 'የመስቀል በዓል ንግሥት ዕሌኒ እውነተኛውን መስቀል ያገኘችበትን ለማሰብ በደመራ መለኮስ በድምቀት ይከበራል።',
    },
  },

  // Ethiopian Science, Nature & Wildlife
  {
    id: 'eth-sci-1',
    category: 'ethiopian_science',
    difficulty: 'easy',
    question: {
      en: 'What famous 3.2-million-year-old Australopithecus fossil was discovered in Hadar, Ethiopia in 1974?',
      am: 'በ1974 እ.ኤ.አ. በሐዳር የተገኘው የ3.2 ሚሊዮን ዓመት ዕድሜ ያለው ታዋቂው ቅሪተ አካል ማን ይባላል?',
    },
    options: {
      en: ['Ardi', 'Lucy (Dinkinesh)', 'Selam', 'Taung Child'],
      am: ['አርዲ', 'ሉሲ (ድንቅነሽ)', 'ሰላም', 'ታውንግ ቻይልድ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Lucy (known in Ethiopia as Dinkinesh, "you are marvelous") is an Australopithecus afarensis fossil.',
      am: 'ድንቅነሽ (ሉሲ) በ1974 በዶናልድ ጆሃንሰን የተገኘች የ3.2 ሚሊዮን ዓመታት ቅሪተ አካል ናት።',
    },
  },
  {
    id: 'eth-sci-2',
    category: 'ethiopian_science',
    difficulty: 'medium',
    question: {
      en: 'Which rare wild goat species is strictly endemic to the Simien Mountains of Ethiopia?',
      am: 'በሰሜን ተራሮች ብሔራዊ ፓርክ ብቻ የሚገኘው ብርቅዬው የዱር ፍየል ዝርያ ምን ይባላል?',
    },
    options: {
      en: ['Ibex Alpine', 'Walia Ibex', 'Mountain Nyala', 'Gerenuk'],
      am: ['አልፓይን አይቤክስ', 'ዋልያ አይቤክስ', 'የተራራ ድኩላ', 'ገረኑክ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Walia Ibex (Capra walie) lives only on the cliffs of the Simien Mountains National Park.',
      am: 'ዋልያ በኢትዮጵያ ሰሜን ተራሮች ገደላማ ስፍራዎች ብቻ የሚገኝ ብርቅዬ የዱር እንስሳ ነው።',
    },
  },
  {
    id: 'eth-sci-3',
    category: 'ethiopian_science',
    difficulty: 'medium',
    question: {
      en: 'Which primate, known for its red chest patch and grass-eating diet, lives on Ethiopia\'s high plateaus?',
      am: 'በደረት ላይ ቀይ ምልክት ያለውና ሣር በመመገብ የሚታወቀው የኢትዮጵያ ደጋማ ቦታዎች ዝንጀሮ ማን ይባላል?',
    },
    options: {
      en: ['Chimpanzee', 'Gelada Baboon', 'Olive Baboon', 'Hamadryas Baboon'],
      am: ['ቺምፓንዚ', 'ጭላዳ ዝንጀሮ (ገላዳ)', 'የወይራ ዝንጀሮ', 'ሐማድርያስ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Gelada (Theropithecus gelada), often called the bleeding-heart baboon, is endemic to the Ethiopian highlands.',
      am: 'ጭላዳ ዝንጀሮ በደገኛው የኢትዮጵያ ክፍል ብቻ የሚገኝና በሣር የሚተዳደር ብርቅዬ ዝንጀሮ ነው።',
    },
  },
  {
    id: 'eth-sci-4',
    category: 'ethiopian_science',
    difficulty: 'hard',
    question: {
      en: 'Which canid species, living primarily in the Bale Mountains, is Africa\'s most endangered carnivore?',
      am: 'በዋነኝነት በባሌ ተራሮች የሚገኘውና በአፍሪካ እጅግ አደጋ ላይ የወደቀው የሥጋ በል አውሬ የትኛው ነው?',
    },
    options: {
      en: ['Golden Jackal', 'Ethiopian Wolf (Red Fox)', 'African Wild Dog', 'Bat-eared Fox'],
      am: ['ወርቃማ ቀበሮ', 'ቀይ ቀበሮ (የኢትዮጵያ ተኩላ)', 'አፍሪካዊ የዱር ውሻ', 'የሌሊት ወፍ ጆሮ ቀበሮ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Ethiopian Wolf (Canis simensis) has fewer than 500 individuals remaining, specialized in hunting afroalpine rodents.',
      am: 'የኢትዮጵያ ቀይ ቀበሮ ቁጥሩ ከ500 በታች የሆነና በአፍሪካ እጅግ አደጋ ላይ ያለ ብርቅዬ እንስሳ ነው።',
    },
  },
  {
    id: 'eth-sci-5',
    category: 'ethiopian_science',
    difficulty: 'easy',
    question: {
      en: 'Coffea arabica, the source of global specialty coffee, originated in which region of Ethiopia?',
      am: 'የዓለም የቡና ዝርያ መገኛ የሆነው አረቢካ ቡና የተገኘው ከየትኛው የኢትዮጵያ አካባቢ ነው?',
    },
    options: {
      en: ['Kaffa', 'Gojjam', 'Tigray', 'Afar'],
      am: ['ከፋ', 'ጎጃም', 'ትግራይ', 'አፋር'],
    },
    correctIndex: 0,
    explanation: {
      en: 'The forest region of Kaffa in southwestern Ethiopia is historically recognized as the birthplace of wild coffee.',
      am: 'በደቡብ ምዕራብ ኢትዮጵያ የሚገኘው የከፋ ደን የቡና ጥንታዊ መፍለቂያና መገኛ ተደርጎ ይታወቃል።',
    },
  },

  // African History & Continental Knowledge
  {
    id: 'afr-hist-1',
    category: 'african_history',
    difficulty: 'easy',
    question: {
      en: 'Which city hosts the permanent headquarters of the African Union (AU)?',
      am: 'የአፍሪካ ኅብረት (AU) ቋሚ መቀመጫ ዋና መሥሪያ ቤት የሚገኘው በየትኛው ከተማ ነው?',
    },
    options: {
      en: ['Nairobi', 'Addis Ababa', 'Cairo', 'Johannesburg'],
      am: ['ናይሮቢ', 'አዲስ አበባ', 'ካይሮ', 'ጆሃንስበርግ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Addis Ababa has served as the diplomatic hub for the OAU and the African Union since its founding in 1963.',
      am: 'አዲስ አበባ እ.ኤ.አ. በ1963 ከተመሠረተበት ጊዜ ጀምሮ የአፍሪካ አንድነት ድርጅትና የኅብረቱ መቀመጫ ናት።',
    },
  },
  {
    id: 'afr-hist-2',
    category: 'african_history',
    difficulty: 'medium',
    question: {
      en: 'Who was the anti-apartheid leader who served as the first Black president of South Africa in 1994?',
      am: 'በ1994 እ.ኤ.አ. የመጀመሪያው ጥቁር የደቡብ አፍሪካ ፕሬዝዳንት በመሆን የተመረጡት የፀረ-አፓርታይድ ታጋይ ማን ነበሩ?',
    },
    options: {
      en: ['Steve Biko', 'Nelson Mandela', 'Oliver Tambo', 'Desmond Tutu'],
      am: ['ስቲቭ ቢኮ', 'ኔልሰን ማንዴላ', 'ኦሊቨር ታምቦ', 'ዴዝሞንድ ቱቱ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Nelson Mandela spent 27 years in prison before leading South Africa into non-racial democracy.',
      am: 'ኔልሰን ማንዴላ ለ27 ዓመታት ታስረው ከቆዩ በኋላ ደቡብ አፍሪካን ወደ ነፃነት የመሩ ታላቅ መሪ ናቸው።',
    },
  },
  {
    id: 'afr-hist-3',
    category: 'african_history',
    difficulty: 'hard',
    question: {
      en: 'Which 14th-century ruler of the Mali Empire is widely considered one of the wealthiest people in human history?',
      am: 'በሰው ልጅ ታሪክ ውስጥ እጅግ ባለጸጋ ከነበሩት ሰዎች አንዱ ተደርጎ የሚቆጠረው የ14ኛው ክ/ዘመን የማሊ ንጉሥ ማን ነው?',
    },
    options: {
      en: ['Sundiata Keita', 'Mansa Musa', 'Askia the Great', 'Sonni Ali'],
      am: ['ሱንዲያታ ኬይታ', 'ማንሳ ሙሳ', 'አስኪያ ታላቁ', 'ሶኒ አሊ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Mansa Musa controlled vast gold trade routes across West Africa and made a legendary pilgrimage to Mecca in 1324.',
      am: 'ማንሳ ሙሳ በምዕራብ አፍሪካ የወርቅ ንግድን የተቆጣጠረና በ1324 ወደ መካ ባደረገው ጉዞ የታወቀ ንጉሥ ነበር።',
    },
  },
  {
    id: 'afr-hist-4',
    category: 'african_history',
    difficulty: 'medium',
    question: {
      en: 'What massive river in Central Africa is the world\'s deepest recorded river?',
      am: 'በዓለም ላይ እጅግ ጥልቅ ተብሎ የተመዘገበው በማዕከላዊ አፍሪካ የሚገኘው ወንዝ የትኛው ነው?',
    },
    options: {
      en: ['Zambezi River', 'Congo River', 'Niger River', 'Limpopo River'],
      am: ['ዛምቤዚ ወንዝ', 'ኮንጎ ወንዝ', 'ናይጀር ወንዝ', 'ሊምፖፖ ወንዝ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Congo River reaches depths in excess of 220 meters (720 ft) in its lower reaches.',
      am: 'የኮንጎ ወንዝ ወደ 220 ሜትር የሚደርስ ጥልቀት ያለው የዓለማችን እጅግ ጥልቁ ወንዝ ነው።',
    },
  },

  // General Knowledge & Sports
  {
    id: 'gen-know-1',
    category: 'general_knowledge',
    difficulty: 'easy',
    question: {
      en: 'Who became the first sub-Saharan African to win an Olympic gold medal, running barefoot at Rome 1960?',
      am: 'በ1960 በሮም ኦሎምፒክ በባዶ እግሩ በመሮጥ የመጀመሪያውን የኦሎምፒክ ወርቅ ለአፍሪካ ያመጣው ሯጭ ማን ነው?',
    },
    options: {
      en: ['Miruts Yifter', 'Abebe Bikila', 'Haile Gebrselassie', 'Kenenisa Bekele'],
      am: ['ምሩፅ ይፍጠር', 'አበበ ቢቂላ', 'ኃይሌ ገብረሥላሴ', 'ቀነኒሳ በቀለ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Abebe Bikila won the Olympic marathon in Rome 1960 barefoot, then defended his title in Tokyo 1964.',
      am: 'ሻምበል አበበ ቢቂላ በሮም ኦሎምፒክ በባዶ እግሩ ሮጦ በማሸነፍ ታሪክ የሠራ ጀግና ነው።',
    },
  },
  {
    id: 'gen-know-2',
    category: 'general_knowledge',
    difficulty: 'easy',
    question: {
      en: 'What is the unique writing script native to Ethiopia and Eritrea?',
      am: 'በኢትዮጵያ እና ኤርትራ ብቻ የሚገኘውና የሚያገለግለው ጥንታዊ የፊደል ገበታ ምን ይባላል?',
    },
    options: {
      en: ['Coptic Script', 'Ge\'ez Script (Fidel)', 'Arabic Script', 'Phoenician Alphabet'],
      am: ['የኮፕቲክ ፊደል', 'ግዕዝ ፊደል', 'የዐረብኛ ፊደል', 'የፊንቄ ፊደል'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Ge\'ez fidel is an abugida script that has preserved Semitic literary heritage for over two millennia.',
      am: 'የግዕዝ ፊደል ከሁለት ሺህ ዓመታት በላይ ያገለገለ ብቸኛ የአፍሪካ የጽሕፈት ሥርዓት (አቡጊዳ) ነው።',
    },
  },
  {
    id: 'gen-know-3',
    category: 'general_knowledge',
    difficulty: 'medium',
    question: {
      en: 'How many months are in the Ethiopian calendar year, including Pagume?',
      am: 'ጳጉሜን ጨምሮ በኢትዮጵያ ዘመን አቆጣጠር በአንድ ዓመት ውስጥ ስንት ወራት አሉ?',
    },
    options: {
      en: ['12', '13', '14', '10'],
      am: ['12', '13', '14', '10'],
    },
    correctIndex: 1,
    explanation: {
      en: 'The Ethiopian calendar consists of 12 months of 30 days plus Pagume (5 or 6 epagomenal days), giving 13 months.',
      am: 'የኢትዮጵያ ዘመን አቆጣጠር 12 ባለ 30 ቀናት ወራትን እና አንድ ባለ 5 ወይም 6 ቀን (ጳጉሜ) በመያዝ 13 ወራት አሉት።',
    },
  },
  {
    id: 'gen-know-4',
    category: 'general_knowledge',
    difficulty: 'hard',
    question: {
      en: 'Which Ethiopian long-distance legend won two Olympic 10,000m gold medals and set 27 official world records?',
      am: 'ሁለት የኦሎምፒክ የወርቅ ሜዳሊያዎችን ያሸነፈውና 27 የዓለም ክብረ ወሰኖችን የሰበረው ኢትዮጵያዊ አትሌት ማን ነው?',
    },
    options: {
      en: ['Derartu Tulu', 'Haile Gebrselassie', 'Sileshi Sihine', 'Mamo Wolde'],
      am: ['ደራርቱ ቱሉ', 'ኃይሌ ገብረሥላሴ', 'ስለሺ ስህን', 'ማሞ ወልዴ'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Major Haile Gebrselassie won Olympic gold in 1996 and 2000 and broke 27 world records across distances.',
      am: 'ሻለቃ ኃይሌ ገብረሥላሴ በ1996 እና 2000 ኦሎምፒክ የወርቅ ሜዳሊያ ያገኘና 27 ክብረ ወሰኖችን ያሻሻለ አትሌት ነው።',
    },
  },
  {
    id: 'gen-know-5',
    category: 'general_knowledge',
    difficulty: 'medium',
    question: {
      en: 'Who became the first Black African woman to win an Olympic gold medal at Barcelona 1992 in the 10,000m?',
      am: 'በ1992 በባርሴሎና ኦሎምፒክ በ10,000 ሜትር የወርቅ ሜዳሊያ በማግኘት የመጀመሪያዋ ጥቁር አፍሪካዊት ሴት ማን ነች?',
    },
    options: {
      en: ['Fatuma Roba', 'Derartu Tulu', 'Tirunesh Dibaba', 'Meseret Defar'],
      am: ['ፋጡማ ሮባ', 'ደራርቱ ቱሉ', 'ጥሩነሽ ዲባባ', 'መሠረት ደፋር'],
    },
    correctIndex: 1,
    explanation: {
      en: 'Derartu Tulu made historic sporting history for Africa by winning the 10,000m event in 1992.',
      am: 'ደራርቱ ቱሉ በባርሴሎና ኦሎምፒክ በ10,000 ሜትር በማሸነፍ የመጀመሪያዋ ጥቁር አፍሪካዊት ሴት የወርቅ ሜዳሊያ ባለቤት ሆናለች።',
    },
  },
];

/**
 * Selects 10 randomized, non-repeating questions for a gameplay session,
 * balancing categories for a high-quality trivia experience.
 */
export function selectSessionQuestions(total: number = 10): TriviaQuestion[] {
  // Category distribution target
  const categoryQuotas: Record<TriviaCategory, number> = {
    ethiopian_history: 3,
    ethiopian_geography: 2,
    ethiopian_culture: 2,
    ethiopian_science: 1,
    african_history: 1,
    general_knowledge: 1,
  };

  const selected: TriviaQuestion[] = [];
  const usedIds = new Set<string>();

  // Helper to shuffle an array
  const shuffle = <T>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // 1. Pick according to category quotas
  (Object.keys(categoryQuotas) as TriviaCategory[]).forEach((cat) => {
    const quota = categoryQuotas[cat];
    const pool = shuffle(TRIVIA_QUESTIONS.filter((q) => q.category === cat));
    const picks = pool.slice(0, quota);
    picks.forEach((q) => {
      selected.push(q);
      usedIds.add(q.id);
    });
  });

  // 2. Fill any remaining slots if total isn't reached
  if (selected.length < total) {
    const remainingPool = shuffle(TRIVIA_QUESTIONS.filter((q) => !usedIds.has(q.id)));
    for (const q of remainingPool) {
      if (selected.length >= total) break;
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  // 3. Final shuffle of session questions so category order is varied
  return shuffle(selected.slice(0, total));
}
