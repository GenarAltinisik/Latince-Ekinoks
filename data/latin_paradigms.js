// Latince Ekinoks - Kapsamlı Çekim Paradigmaları ve Referans Veritabanı

const LATIN_CASE_INFO = {
  nom: { key: 'nom', name: 'Nominativus', tr: 'Yalın hal', abbr: 'Nom.' },
  voc: { key: 'voc', name: 'Vocativus', tr: 'Seslenme hali ("Ey...")', abbr: 'Voc.' },
  gen: { key: 'gen', name: 'Genetivus', tr: '-in hali (Tamlayan)', abbr: 'Gen.' },
  dat: { key: 'dat', name: 'Dativus', tr: '-e hali (Yönelme)', abbr: 'Dat.' },
  acc: { key: 'acc', name: 'Accusativus', tr: '-i hali (Belirtme)', abbr: 'Acc.' },
  abl: { key: 'abl', name: 'Ablativus', tr: '-den / Vasıta hali (Çıkma)', abbr: 'Abl.' }
};

const LATIN_CASE_ORDERS = {
  NVGDAcAb: {
    id: 'NVGDAcAb',
    label: 'N - V - G - D - Ac - Ab (Varsayılan)',
    order: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl']
  },
  NVAcGDAb: {
    id: 'NVAcGDAb',
    label: 'N - V - Ac - G - D - Ab',
    order: ['nom', 'voc', 'acc', 'gen', 'dat', 'abl']
  },
  NGDAcAbV: {
    id: 'NGDAcAbV',
    label: 'N - G - D - Ac - Ab - V',
    order: ['nom', 'gen', 'dat', 'acc', 'abl', 'voc']
  }
};

// ============================================================================
// GENEL MODEL ÇEKİM PARADİGMALARI (Tüm Tipler İçin Standart Örnekler)
// ============================================================================
const LATIN_REFERENCE_PARADIGMS = {
  nouns: [
    {
      id: 'noun_decl_1',
      title: '1. Çekim (Declinatio I)',
      subtitle: '-a, -ae (Genellikle Dişil / Femininum)',
      model: 'puella, -ae f. (kız çocuğu)',
      forms: {
        nom: { sg: 'puella', pl: 'puellae' },
        voc: { sg: 'puella', pl: 'puellae' },
        gen: { sg: 'puellae', pl: 'puellārum' },
        dat: { sg: 'puellae', pl: 'puellīs' },
        acc: { sg: 'puellam', pl: 'puellās' },
        abl: { sg: 'puellā', pl: 'puellīs' }
      },
      note: 'Genetivus tekil eki -ae ile biter. Ablativus tekil -ā uzundur.'
    },
    {
      id: 'noun_decl_2_us',
      title: '2. Çekim (Declinatio II) -us',
      subtitle: '-us, -ī (Eril / Masculinum)',
      model: 'servus, -ī m. (köle)',
      forms: {
        nom: { sg: 'servus', pl: 'servī' },
        voc: { sg: 'serve', pl: 'servī' },
        gen: { sg: 'servī', pl: 'servōrum' },
        dat: { sg: 'servō', pl: 'servīs' },
        acc: { sg: 'servum', pl: 'servōs' },
        abl: { sg: 'servō', pl: 'servīs' }
      },
      note: 'Sadece 2. çekim -us ile biten isimlerde Vocativus tekil -e olur.'
    },
    {
      id: 'noun_decl_2_er',
      title: '2. Çekim (Declinatio II) -er',
      subtitle: '-er, -(e)rī (Eril / Masculinum)',
      model: 'puer, puerī m. (erkek çocuk) & ager, agrī m. (tarla)',
      forms: {
        nom: { sg: 'puer / ager', pl: 'puerī / agrī' },
        voc: { sg: 'puer / ager', pl: 'puerī / agrī' },
        gen: { sg: 'puerī / agrī', pl: 'puerōrum / agrōrum' },
        dat: { sg: 'puerō / agrō', pl: 'puerīs / agrīs' },
        acc: { sg: 'puerum / agrum', pl: 'puerōs / agrōs' },
        abl: { sg: 'puerō / agrō', pl: 'puerīs / agrīs' }
      },
      note: 'Vocativus tekil Nominativus ile aynıdır (-er).'
    },
    {
      id: 'noun_decl_2_um',
      title: '2. Çekim (Declinatio II) -um (Nötr)',
      subtitle: '-um, -ī (Nötr / Neutrum)',
      model: 'bellum, -ī n. (savaş)',
      forms: {
        nom: { sg: 'bellum', pl: 'bella' },
        voc: { sg: 'bellum', pl: 'bella' },
        gen: { sg: 'bellī', pl: 'bellōrum' },
        dat: { sg: 'bellō', pl: 'bellīs' },
        acc: { sg: 'bellum', pl: 'bella' },
        abl: { sg: 'bellō', pl: 'bellīs' }
      },
      note: 'Nötr kuralı: Nom, Voc, Acc her zaman birbirinin aynısıdır; çoğulda daima -a ile biter.'
    },
    {
      id: 'noun_decl_3_cons_mf',
      title: '3. Çekim (Declinatio III) - Sessiz Kökler (m./f.)',
      subtitle: 'Çeşitli sonlanışlar, -is (Eril/Dişil)',
      model: 'rēx, rēgis m. (kral)',
      forms: {
        nom: { sg: 'rēx', pl: 'rēgēs' },
        voc: { sg: 'rēx', pl: 'rēgēs' },
        gen: { sg: 'rēgis', pl: 'rēgum' },
        dat: { sg: 'rēgī', pl: 'rēgibus' },
        acc: { sg: 'rēgem', pl: 'rēgēs' },
        abl: { sg: 'rēge', pl: 'rēgibus' }
      },
      note: 'Sessiz köklerde Genetivus çoğul -um ile biter; Ablativus tekil -e ile biter.'
    },
    {
      id: 'noun_decl_3_cons_n',
      title: '3. Çekim (Declinatio III) - Sessiz Kökler (Nötr)',
      subtitle: 'Nötr Sessiz Kökler',
      model: 'corpus, corporis n. (beden, gövde)',
      forms: {
        nom: { sg: 'corpus', pl: 'corpora' },
        voc: { sg: 'corpus', pl: 'corpora' },
        gen: { sg: 'corporis', pl: 'corporum' },
        dat: { sg: 'corporī', pl: 'corporibus' },
        acc: { sg: 'corpus', pl: 'corpora' },
        abl: { sg: 'corpore', pl: 'corporibus' }
      },
      note: 'Nötr çoğul Nom, Voc, Acc -a ile biter.'
    },
    {
      id: 'noun_decl_3_istem_mf',
      title: '3. Çekim (Declinatio III) - i-Kökler (m./f.)',
      subtitle: 'Eş Hece / İki Sessiz Kuralı (-is, -is)',
      model: 'cīvis, cīvis m./f. (yurttaş) & urbs, urbis f. (şehir)',
      forms: {
        nom: { sg: 'cīvis / urbs', pl: 'cīvēs / urbēs' },
        voc: { sg: 'cīvis / urbs', pl: 'cīvēs / urbēs' },
        gen: { sg: 'cīvis / urbis', pl: 'cīvium / urbium' },
        dat: { sg: 'cīvī / urbī', pl: 'cīvibus / urbibus' },
        acc: { sg: 'cīvem / urbem', pl: 'cīvēs (cīvīs) / urbēs' },
        abl: { sg: 'cīve / urbe', pl: 'cīvibus / urbibus' }
      },
      note: 'i-köklerde Genetivus çoğul eki mutlaka -ium olur.'
    },
    {
      id: 'noun_decl_3_istem_n',
      title: '3. Çekim (Declinatio III) - Saf i-Kökler (Nötr)',
      subtitle: '-e, -al, -ar ile biten Nötrler',
      model: 'mare, maris n. (deniz)',
      forms: {
        nom: { sg: 'mare', pl: 'maria' },
        voc: { sg: 'mare', pl: 'maria' },
        gen: { sg: 'maris', pl: 'marium' },
        dat: { sg: 'marī', pl: 'maribus' },
        acc: { sg: 'mare', pl: 'maria' },
        abl: { sg: 'marī', pl: 'maribus' }
      },
      note: 'Ablativus tekil -ī olur; Nom/Voc/Acc çoğul -ia, Gen çoğul -ium olur.'
    },
    {
      id: 'noun_decl_4_us',
      title: '4. Çekim (Declinatio IV) -us',
      subtitle: '-us, -ūs (Genellikle Eril / Masculinum)',
      model: 'fructus, fructūs m. (meyve, kazanç)',
      forms: {
        nom: { sg: 'fructus', pl: 'fructūs' },
        voc: { sg: 'fructus', pl: 'fructūs' },
        gen: { sg: 'fructūs', pl: 'fructuum' },
        dat: { sg: 'fructuī', pl: 'fructibus' },
        acc: { sg: 'fructum', pl: 'fructūs' },
        abl: { sg: 'fructū', pl: 'fructibus' }
      },
      note: 'Genetivus tekil ve Nom/Voc/Acc çoğul -ūs uzundur.'
    },
    {
      id: 'noun_decl_4_u',
      title: '4. Çekim (Declinatio IV) -ū (Nötr)',
      subtitle: '-ū, -ūs (Nötr / Neutrum)',
      model: 'cornū, cornūs n. (boynuz, kanat)',
      forms: {
        nom: { sg: 'cornū', pl: 'cornua' },
        voc: { sg: 'cornū', pl: 'cornua' },
        gen: { sg: 'cornūs', pl: 'cornuum' },
        dat: { sg: 'cornū (cornuī)', pl: 'cornibus' },
        acc: { sg: 'cornū', pl: 'cornua' },
        abl: { sg: 'cornū', pl: 'cornibus' }
      },
      note: 'Tekilde hemen hemen tüm haller -ū ile biter.'
    },
    {
      id: 'noun_decl_5',
      title: '5. Çekim (Declinatio V) -ēs',
      subtitle: '-ēs, -ēī / -eī (Dişil / Femininum)',
      model: 'diēs, diēī m./f. (gün) & rēs, reī f. (şey, olay, durum)',
      forms: {
        nom: { sg: 'rēs', pl: 'rēs' },
        voc: { sg: 'rēs', pl: 'rēs' },
        gen: { sg: 'reī', pl: 'rērum' },
        dat: { sg: 'reī', pl: 'rēbus' },
        acc: { sg: 'rem', pl: 'rēs' },
        abl: { sg: 'rē', pl: 'rēbus' }
      },
      note: 'Sadece diēs ve rēs çoğulda tam çekime sahiptir.'
    }
  ],

  adjectives: [
    {
      id: 'adj_class_1_2',
      title: '1. ve 2. Sınıf Sıfatlar (-us, -a, -um)',
      subtitle: 'Eril: 2. çekim (-us), Dişil: 1. çekim (-a), Nötr: 2. çekim (-um)',
      model: 'bonus, bona, bonum (iyi)',
      singular: {
        nom: { m: 'bonus', f: 'bona', n: 'bonum' },
        voc: { m: 'bone', f: 'bona', n: 'bonum' },
        gen: { m: 'bonī', f: 'bonae', n: 'bonī' },
        dat: { m: 'bonō', f: 'bonae', n: 'bonō' },
        acc: { m: 'bonum', f: 'bonam', n: 'bonum' },
        abl: { m: 'bonō', f: 'bonā', n: 'bonō' }
      },
      plural: {
        nom: { m: 'bonī', f: 'bonae', n: 'bona' },
        voc: { m: 'bonī', f: 'bonae', n: 'bona' },
        gen: { m: 'bonōrum', f: 'bonārum', n: 'bonōrum' },
        dat: { m: 'bonīs', f: 'bonīs', n: 'bonīs' },
        acc: { m: 'bonōs', f: 'bonās', n: 'bona' },
        abl: { m: 'bonīs', f: 'bonīs', n: 'bonīs' }
      }
    },
    {
      id: 'adj_class_3_two_term',
      title: '3. Sınıf Sıfatlar - İki Sonlanışlı (-is, -e)',
      subtitle: 'Eril/Dişil: -is, Nötr: -e (i-Kökü Çekimi)',
      model: 'omnis, omne (bütün, her, tüm)',
      singular: {
        nom: { m: 'omnis', f: 'omnis', n: 'omne' },
        voc: { m: 'omnis', f: 'omnis', n: 'omne' },
        gen: { m: 'omnis', f: 'omnis', n: 'omnis' },
        dat: { m: 'omnī', f: 'omnī', n: 'omnī' },
        acc: { m: 'omnem', f: 'omnem', n: 'omne' },
        abl: { m: 'omnī', f: 'omnī', n: 'omnī' }
      },
      plural: {
        nom: { m: 'omnēs', f: 'omnēs', n: 'omnia' },
        voc: { m: 'omnēs', f: 'omnēs', n: 'omnia' },
        gen: { m: 'omnium', f: 'omnium', n: 'omnium' },
        dat: { m: 'omnibus', f: 'omnibus', n: 'omnibus' },
        acc: { m: 'omnēs (omnīs)', f: 'omnēs (omnīs)', n: 'omnia' },
        abl: { m: 'omnibus', f: 'omnibus', n: 'omnibus' }
      },
      note: 'Ablativus tekilde tüm cinsler -ī alır; Nötr çoğul -ia, Gen. çoğul -ium olur.'
    },
    {
      id: 'adj_class_3_one_term',
      title: '3. Sınıf Sıfatlar - Tek Sonlanışlı',
      subtitle: 'Üç cinsiyet için Nominativus tek: -ns, -x, -r vb.',
      model: 'ingēns, ingentis (devasa, muazzam)',
      singular: {
        nom: { m: 'ingēns', f: 'ingēns', n: 'ingēns' },
        voc: { m: 'ingēns', f: 'ingēns', n: 'ingēns' },
        gen: { m: 'ingentis', f: 'ingentis', n: 'ingentis' },
        dat: { m: 'ingentī', f: 'ingentī', n: 'ingentī' },
        acc: { m: 'ingentem', f: 'ingentem', n: 'ingēns' },
        abl: { m: 'ingentī', f: 'ingentī', n: 'ingentī' }
      },
      plural: {
        nom: { m: 'ingentēs', f: 'ingentēs', n: 'ingentia' },
        voc: { m: 'ingentēs', f: 'ingentēs', n: 'ingentia' },
        gen: { m: 'ingentium', f: 'ingentium', n: 'ingentium' },
        dat: { m: 'ingentibus', f: 'ingentibus', n: 'ingentibus' },
        acc: { m: 'ingentēs', f: 'ingentēs', n: 'ingentia' },
        abl: { m: 'ingentibus', f: 'ingentibus', n: 'ingentibus' }
      }
    }
  ],

  pronouns: [
    {
      id: 'pron_demonstrative_is',
      title: 'İşaret / 3. Şahıs Zamiri (is, ea, id)',
      subtitle: 'o (eril), o (dişil), o (nötr)',
      singular: {
        nom: { m: 'is', f: 'ea', n: 'id' },
        voc: { m: '-', f: '-', n: '-' },
        gen: { m: 'eius', f: 'eius', n: 'eius' },
        dat: { m: 'eī', f: 'eī', n: 'eī' },
        acc: { m: 'eum', f: 'eam', n: 'id' },
        abl: { m: 'eō', f: 'eā', n: 'eō' }
      },
      plural: {
        nom: { m: 'eī (iī)', f: 'eae', n: 'ea' },
        voc: { m: '-', f: '-', n: '-' },
        gen: { m: 'eōrum', f: 'eārum', n: 'eōrum' },
        dat: { m: 'eīs (iīs)', f: 'eīs (iīs)', n: 'eīs (iīs)' },
        acc: { m: 'eōs', f: 'eās', n: 'ea' },
        abl: { m: 'eīs (iīs)', f: 'eīs (iīs)', n: 'eīs (iīs)' }
      }
    },
    {
      id: 'pron_relative_qui',
      title: 'İlgi Zamiri (quī, quae, quod)',
      subtitle: 'ki o, hangi (Relative Pronoun)',
      singular: {
        nom: { m: 'quī', f: 'quae', n: 'quod' },
        voc: { m: '-', f: '-', n: '-' },
        gen: { m: 'cuius', f: 'cuius', n: 'cuius' },
        dat: { m: 'cui', f: 'cui', n: 'cui' },
        acc: { m: 'quem', f: 'quam', n: 'quod' },
        abl: { m: 'quō', f: 'quā', n: 'quō' }
      },
      plural: {
        nom: { m: 'quī', f: 'quae', n: 'quae' },
        voc: { m: '-', f: '-', n: '-' },
        gen: { m: 'quōrum', f: 'quārum', n: 'quōrum' },
        dat: { m: 'quibus', f: 'quibus', n: 'quibus' },
        acc: { m: 'quōs', f: 'quās', n: 'quae' },
        abl: { m: 'quibus', f: 'quibus', n: 'quibus' }
      }
    },
    {
      id: 'pron_personal_1_2',
      title: 'Kişi Zamirleri (ego & tū)',
      subtitle: 'ben (ego) ve sen (tū)',
      singular: {
        nom: { m: 'ego (ben)', f: 'tū (sen)', n: '-' },
        voc: { m: '-', f: 'tū (ey sen)', n: '-' },
        gen: { m: 'meī (benim)', f: 'tuī (senin)', n: '-' },
        dat: { m: 'mihi (bana)', f: 'tibi (sana)', n: '-' },
        acc: { m: 'mē (beni)', f: 'tē (seni)', n: '-' },
        abl: { m: 'mē (benden / benimle)', f: 'tē (senden / seninle)', n: '-' }
      },
      plural: {
        nom: { m: 'nōs (biz)', f: 'vōs (siz)', n: '-' },
        voc: { m: 'nōs', f: 'vōs', n: '-' },
        gen: { m: 'nostrum / nostrī', f: 'vestrum / vestrī', n: '-' },
        dat: { m: 'nōbīs (bize)', f: 'vōbīs (size)', n: '-' },
        acc: { m: 'nōs (bizi)', f: 'vōs (sizi)', n: '-' },
        abl: { m: 'nōbīs', f: 'vōbīs', n: '-' }
      }
    }
  ],

  verbs: [
    {
      id: 'verb_coniug_1',
      title: '1. Çekim Fiil (Coniugatio I) -āre',
      model: 'amō, amāre, amāvī, amātum (sevmek)',
      tenses: {
        praesens_act: { name: 'Praesens (Geniş/Şimdiki Zaman)', p1s: 'amō', p2s: 'amās', p3s: 'amat', p1p: 'amāmus', p2p: 'amātis', p3p: 'amant' },
        imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: 'amābam', p2s: 'amābās', p3s: 'amābat', p1p: 'amābāmus', p2p: 'amābātis', p3p: 'amābant' },
        futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: 'amābō', p2s: 'amābis', p3s: 'amābit', p1p: 'amābimus', p2p: 'amābitis', p3p: 'amābunt' },
        perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: 'amāvī', p2s: 'amāvistī', p3s: 'amāvit', p1p: 'amāvimus', p2p: 'amāvistis', p3p: 'amāvērunt (-ēre)' },
        plusquamperfectum_act: { name: 'Plusquamperfectum (Öncelikli Geçmiş: -mişti)', p1s: 'amāveram', p2s: 'amāverās', p3s: 'amāverat', p1p: 'amāverāmus', p2p: 'amāverātis', p3p: 'amāverant' },
        futurum_perf_act: { name: 'Futurum II (Gelecekte Bitmişlik)', p1s: 'amāverō', p2s: 'amāveris', p3s: 'amāverit', p1p: 'amāverimus', p2p: 'amāveritis', p3p: 'amāverint' }
      },
      passiveTenses: {
        praesens_pass: { name: 'Praesens Passīvum (Geniş/Şimdiki Zaman Edilgen: sevilirim)', p1s: 'amor', p2s: 'amāris (amāre)', p3s: 'amātur', p1p: 'amāmur', p2p: 'amāminī', p3p: 'amantur' },
        imperfectum_pass: { name: 'Imperfectum Passīvum (Geçmişte Süreklilik: seviliyordum)', p1s: 'amābar', p2s: 'amābāris', p3s: 'amābātur', p1p: 'amābāmur', p2p: 'amābāminī', p3p: 'amābantur' },
        futurum_pass: { name: 'Futurum I Passīvum (Gelecek Zaman: sevileceğim)', p1s: 'amābor', p2s: 'amāberis', p3s: 'amābitur', p1p: 'amābimur', p2p: 'amābiminī', p3p: 'amābuntur' },
        perfectum_pass: { name: 'Perfectum Passīvum (Görülen Geçmiş: sevildim)', p1s: 'amātus sum', p2s: 'amātus es', p3s: 'amātus est', p1p: 'amātī sumus', p2p: 'amātī estis', p3p: 'amātī sunt' },
        plusquamperfectum_pass: { name: 'Plusquamperfectum Passīvum (Öncelikli Geçmiş: sevilmiştim)', p1s: 'amātus eram', p2s: 'amātus erās', p3s: 'amātus erat', p1p: 'amātī erāmus', p2p: 'amātī erātis', p3p: 'amātī erant' },
        futurum_perf_pass: { name: 'Futurum II Passīvum (Bitmiş Gelecek: sevilmiş olacağım)', p1s: 'amātus erō', p2s: 'amātus eris', p3s: 'amātus erit', p1p: 'amātī erimus', p2p: 'amātī eritis', p3p: 'amātī erunt' }
      }
    },
    {
      id: 'verb_coniug_2',
      title: '2. Çekim Fiil (Coniugatio II) -ēre',
      model: 'habeō, habēre, habuī, habitum (sahip olmak) / videō (görmek)',
      tenses: {
        praesens_act: { name: 'Praesens (Geniş/Şimdiki Zaman)', p1s: 'habeō', p2s: 'habēs', p3s: 'habet', p1p: 'habēmus', p2p: 'habētis', p3p: 'habent' },
        imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: 'habēbam', p2s: 'habēbās', p3s: 'habēbat', p1p: 'habēbāmus', p2p: 'habēbātis', p3p: 'habēbant' },
        futurum_act: { name: 'Futurum I', p1s: 'habēbō', p2s: 'habēbis', p3s: 'habēbit', p1p: 'habēbimus', p2p: 'habēbitis', p3p: 'habēbunt' },
        perfectum_act: { name: 'Perfectum', p1s: 'habuī', p2s: 'habuistī', p3s: 'habuit', p1p: 'habuimus', p2p: 'habuistis', p3p: 'habuērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'habueram', p2s: 'habuerās', p3s: 'habuerat', p1p: 'habuerāmus', p2p: 'habuerātis', p3p: 'habuerant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'habuerō', p2s: 'habueris', p3s: 'habuerit', p1p: 'habuerimus', p2p: 'habueritis', p3p: 'habuerint' }
      },
      passiveTenses: {
        praesens_pass: { name: 'Praesens Passīvum (Geniş/Şimdiki Zaman Edilgen)', p1s: 'habeor', p2s: 'habēris', p3s: 'habētur', p1p: 'habēmur', p2p: 'habēminī', p3p: 'habentur' },
        imperfectum_pass: { name: 'Imperfectum Passīvum (Geçmişte Süreklilik: -iliyordu)', p1s: 'habēbar', p2s: 'habēbāris', p3s: 'habēbātur', p1p: 'habēbāmur', p2p: 'habēbāminī', p3p: 'habēbantur' },
        futurum_pass: { name: 'Futurum I Passīvum (Gelecek Zaman: -ilecek)', p1s: 'habēbor', p2s: 'habēberis', p3s: 'habēbitur', p1p: 'habēbimur', p2p: 'habēbiminī', p3p: 'habēbuntur' },
        perfectum_pass: { name: 'Perfectum Passīvum (Görülen Geçmiş: -ildi)', p1s: 'habitus sum', p2s: 'habitus es', p3s: 'habitus est', p1p: 'habitī sumus', p2p: 'habitī estis', p3p: 'habitī sunt' },
        plusquamperfectum_pass: { name: 'Plusquamperfectum Passīvum (-ilmişti)', p1s: 'habitus eram', p2s: 'habitus erās', p3s: 'habitus erat', p1p: 'habitī erāmus', p2p: 'habitī erātis', p3p: 'habitī erant' },
        futurum_perf_pass: { name: 'Futurum II Passīvum (Bitmiş Gelecek: -ilmiş olacak)', p1s: 'habitus erō', p2s: 'habitus eris', p3s: 'habitus erit', p1p: 'habitī erimus', p2p: 'habitī eritis', p3p: 'habitī erunt' }
      }
    },
    {
      id: 'verb_coniug_3',
      title: '3. Çekim Fiil (Coniugatio III) -ere',
      model: 'legō, legere, lēgī, lēctum (okumak, seçmek)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'legō', p2s: 'legis', p3s: 'legit', p1p: 'legimus', p2p: 'legitis', p3p: 'legunt' },
        imperfectum_act: { name: 'Imperfectum', p1s: 'legēbam', p2s: 'legēbās', p3s: 'legēbat', p1p: 'legēbāmus', p2p: 'legēbātis', p3p: 'legēbant' },
        futurum_act: { name: 'Futurum I (-am, -ēs, -et...)', p1s: 'legam', p2s: 'legēs', p3s: 'leget', p1p: 'legēmus', p2p: 'legētis', p3p: 'legent' },
        perfectum_act: { name: 'Perfectum', p1s: 'lēgī', p2s: 'lēgistī', p3s: 'lēgit', p1p: 'lēgimus', p2p: 'lēgistis', p3p: 'lēgērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'lēgeram', p2s: 'lēgerās', p3s: 'lēgerat', p1p: 'lēgerāmus', p2p: 'lēgerātis', p3p: 'lēgerant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'lēgerō', p2s: 'lēgeris', p3s: 'lēgerit', p1p: 'lēgerimus', p2p: 'lēgeritis', p3p: 'lēgerint' }
      },
      passiveTenses: {
        praesens_pass: { name: 'Praesens Passīvum (Geniş/Şimdiki Zaman Edilgen)', p1s: 'legor', p2s: 'legeris', p3s: 'legitur', p1p: 'legimur', p2p: 'legiminī', p3p: 'leguntur' },
        imperfectum_pass: { name: 'Imperfectum Passīvum (Geçmişte Süreklilik: -iliyordu)', p1s: 'legēbar', p2s: 'legēbāris', p3s: 'legēbātur', p1p: 'legēbāmur', p2p: 'legēbāminī', p3p: 'legēbantur' },
        futurum_pass: { name: 'Futurum I Passīvum (Gelecek Zaman: -ar, -ēris...)', p1s: 'legar', p2s: 'legēris', p3s: 'legētur', p1p: 'legēmur', p2p: 'legēminī', p3p: 'legentur' },
        perfectum_pass: { name: 'Perfectum Passīvum (Görülen Geçmiş: -ildi)', p1s: 'lēctus sum', p2s: 'lēctus es', p3s: 'lēctus est', p1p: 'lēctī sumus', p2p: 'lēctī estis', p3p: 'lēctī sunt' },
        plusquamperfectum_pass: { name: 'Plusquamperfectum Passīvum (-ilmişti)', p1s: 'lēctus eram', p2s: 'lēctus erās', p3s: 'lēctus erat', p1p: 'lēctī erāmus', p2p: 'lēctī erātis', p3p: 'lēctī erant' },
        futurum_perf_pass: { name: 'Futurum II Passīvum (Bitmiş Gelecek: -ilmiş olacak)', p1s: 'lēctus erō', p2s: 'lēctus eris', p3s: 'lēctus erit', p1p: 'lēctī erimus', p2p: 'lēctī eritis', p3p: 'lēctī erunt' }
      }
    },
    {
      id: 'verb_coniug_3_io',
      title: '3. Çekim -iō Fiil (Coniugatio III -iō)',
      model: 'capiō, capere, cēpī, captum (almak, yakalamak)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'capiō', p2s: 'capis', p3s: 'capit', p1p: 'capimus', p2p: 'capitis', p3p: 'capiunt' },
        imperfectum_act: { name: 'Imperfectum', p1s: 'capiēbam', p2s: 'capiēbās', p3s: 'capiēbat', p1p: 'capiēbāmus', p2p: 'capiēbātis', p3p: 'capiēbant' },
        futurum_act: { name: 'Futurum I (-iam, -iēs, -iet...)', p1s: 'capiam', p2s: 'capiēs', p3s: 'capiet', p1p: 'capiēmus', p2p: 'capiētis', p3p: 'capient' },
        perfectum_act: { name: 'Perfectum', p1s: 'cēpī', p2s: 'cēpistī', p3s: 'cēpit', p1p: 'cēpimus', p2p: 'cēpistis', p3p: 'cēpērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'cēperam', p2s: 'cēperās', p3s: 'cēperat', p1p: 'cēperāmus', p2p: 'cēperātis', p3p: 'cēperant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'cēperō', p2s: 'cēperis', p3s: 'cēperit', p1p: 'cēperimus', p2p: 'cēperitis', p3p: 'cēperint' }
      },
      passiveTenses: {
        praesens_pass: { name: 'Praesens Passīvum (Geniş/Şimdiki Zaman Edilgen)', p1s: 'capior', p2s: 'caperis', p3s: 'capitur', p1p: 'capimur', p2p: 'capiminī', p3p: 'capiuntur' },
        imperfectum_pass: { name: 'Imperfectum Passīvum (Geçmişte Süreklilik: -iliyordu)', p1s: 'capiēbar', p2s: 'capiēbāris', p3s: 'capiēbātur', p1p: 'capiēbāmur', p2p: 'capiēbāminī', p3p: 'capiēbantur' },
        futurum_pass: { name: 'Futurum I Passīvum (-iar, -iēris...)', p1s: 'capiar', p2s: 'capiēris', p3s: 'capiētur', p1p: 'capiēmur', p2p: 'capiēminī', p3p: 'capientur' },
        perfectum_pass: { name: 'Perfectum Passīvum (Görülen Geçmiş: -ildi)', p1s: 'captus sum', p2s: 'captus es', p3s: 'captus est', p1p: 'captī sumus', p2p: 'captī estis', p3p: 'captī sunt' },
        plusquamperfectum_pass: { name: 'Plusquamperfectum Passīvum (-ilmişti)', p1s: 'captus eram', p2s: 'captus erās', p3s: 'captus erat', p1p: 'captī erāmus', p2p: 'captī erātis', p3p: 'captī erant' },
        futurum_perf_pass: { name: 'Futurum II Passīvum (Bitmiş Gelecek: -ilmiş olacak)', p1s: 'captus erō', p2s: 'captus eris', p3s: 'captus erit', p1p: 'captī erimus', p2p: 'captī eritis', p3p: 'captī erunt' }
      }
    },
    {
      id: 'verb_coniug_4',
      title: '4. Çekim Fiil (Coniugatio IV) -īre',
      model: 'audiō, audīre, audīvī, audītum (duymak, işitmek)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'audiō', p2s: 'audīs', p3s: 'audit', p1p: 'audīmus', p2p: 'audītis', p3p: 'audiunt' },
        imperfectum_act: { name: 'Imperfectum', p1s: 'audiēbam', p2s: 'audiēbās', p3s: 'audiēbat', p1p: 'audiēbāmus', p2p: 'audiēbātis', p3p: 'audiēbant' },
        futurum_act: { name: 'Futurum I', p1s: 'audiam', p2s: 'audiēs', p3s: 'audiet', p1p: 'audiēmus', p2p: 'audiētis', p3p: 'audient' },
        perfectum_act: { name: 'Perfectum', p1s: 'audīvī', p2s: 'audīvistī', p3s: 'audīvit', p1p: 'audīvimus', p2p: 'audīvistis', p3p: 'audīvērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'audīveram', p2s: 'audīverās', p3s: 'audīverat', p1p: 'audīverāmus', p2p: 'audīverātis', p3p: 'audīverant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'audīverō', p2s: 'audīveris', p3s: 'audīverit', p1p: 'audīverimus', p2p: 'audīveritis', p3p: 'audīverint' }
      },
      passiveTenses: {
        praesens_pass: { name: 'Praesens Passīvum (Geniş/Şimdiki Zaman Edilgen: işitilirim)', p1s: 'audior', p2s: 'audīris', p3s: 'audītur', p1p: 'audīmur', p2p: 'audīminī', p3p: 'audiuntur' },
        imperfectum_pass: { name: 'Imperfectum Passīvum (Geçmişte Süreklilik: işitiliyordum)', p1s: 'audiēbar', p2s: 'audiēbāris', p3s: 'audiēbātur', p1p: 'audiēbāmur', p2p: 'audiēbāminī', p3p: 'audiēbantur' },
        futurum_pass: { name: 'Futurum I Passīvum (Gelecek Zaman: işitileceğim)', p1s: 'audiar', p2s: 'audiēris', p3s: 'audiētur', p1p: 'audiēmur', p2p: 'audiēminī', p3p: 'audientur' },
        perfectum_pass: { name: 'Perfectum Passīvum (Görülen Geçmiş: işitildim)', p1s: 'audītus sum', p2s: 'audītus es', p3s: 'audītus est', p1p: 'audītī sumus', p2p: 'audītī estis', p3p: 'audītī sunt' },
        plusquamperfectum_pass: { name: 'Plusquamperfectum Passīvum (Öncelikli Geçmiş: işitilmiştim)', p1s: 'audītus eram', p2s: 'audītus erās', p3s: 'audītus erat', p1p: 'audītī erāmus', p2p: 'audītī erātis', p3p: 'audītī erant' },
        futurum_perf_pass: { name: 'Futurum II Passīvum (Bitmiş Gelecek: işitilmiş olacağım)', p1s: 'audītus erō', p2s: 'audītus eris', p3s: 'audītus erit', p1p: 'audītī erimus', p2p: 'audītī eritis', p3p: 'audītī erunt' }
      }
    },
    {
      id: 'verb_deponent',
      title: 'Deponent Fiil (Verbum Dēpōnēns)',
      model: 'sequor, sequī, secūtus sum (takip etmek) • Biçimce Edilgen, Anlamca Etken!',
      tenses: {
        praesens_act: { name: 'Praesens (Anlam: Takip ediyorum)', p1s: 'sequor', p2s: 'sequeris', p3s: 'sequitur', p1p: 'sequimur', p2p: 'sequiminī', p3p: 'sequuntur' },
        imperfectum_act: { name: 'Imperfectum (Takip ediyordum)', p1s: 'sequēbar', p2s: 'sequēbāris', p3s: 'sequēbātur', p1p: 'sequēbāmur', p2p: 'sequēbāminī', p3p: 'sequēbantur' },
        futurum_act: { name: 'Futurum I (Takip edeceğim)', p1s: 'sequar', p2s: 'sequēris', p3s: 'sequētur', p1p: 'sequēmur', p2p: 'sequēminī', p3p: 'sequentur' },
        perfectum_act: { name: 'Perfectum (Takip ettim)', p1s: 'secūtus sum', p2s: 'secūtus es', p3s: 'secūtus est', p1p: 'secūtī sumus', p2p: 'secūtī estis', p3p: 'secūtī sunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum (Takip etmiştim)', p1s: 'secūtus eram', p2s: 'secūtus erās', p3s: 'secūtus erat', p1p: 'secūtī erāmus', p2p: 'secūtī erātis', p3p: 'secūtī erant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'secūtus erō', p2s: 'secūtus eris', p3s: 'secūtus erit', p1p: 'secūtī erimus', p2p: 'secūtī eritis', p3p: 'secūtī erunt' }
      }
    },
    {
      id: 'verb_sum',
      title: 'Düzensiz Fiil: sum, esse, fuī (olmak)',
      model: 'sum, esse, fuī, futūrum (olmak, var olmak)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'sum', p2s: 'es', p3s: 'est', p1p: 'sumus', p2p: 'estis', p3p: 'sunt' },
        imperfectum_act: { name: 'Imperfectum (idim, idin...)', p1s: 'eram', p2s: 'erās', p3s: 'erat', p1p: 'erāmus', p2p: 'erātis', p3p: 'erant' },
        futurum_act: { name: 'Futurum I (olacağım...)', p1s: 'erō', p2s: 'eris', p3s: 'erit', p1p: 'erimus', p2p: 'eritis', p3p: 'erunt' },
        perfectum_act: { name: 'Perfectum (oldum...)', p1s: 'fuī', p2s: 'fuistī', p3s: 'fuit', p1p: 'fuimus', p2p: 'fuistis', p3p: 'fuērunt (-ēre)' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'fueram', p2s: 'fuerās', p3s: 'fuerat', p1p: 'fuerāmus', p2p: 'fuerātis', p3p: 'fuerant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'fuerō', p2s: 'fueris', p3s: 'fuerit', p1p: 'fuerimus', p2p: 'fueritis', p3p: 'fuerint' }
      }
    },
    {
      id: 'verb_possum',
      title: 'Düzensiz Fiil: possum, posse, potuī (-ebilmek)',
      model: 'possum, posse, potuī (gücü yetmek, -ebilmek)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'possum', p2s: 'potes', p3s: 'potest', p1p: 'possumus', p2p: 'potestis', p3p: 'possunt' },
        imperfectum_act: { name: 'Imperfectum', p1s: 'poteram', p2s: 'poterās', p3s: 'poterat', p1p: 'poterāmus', p2p: 'poterātis', p3p: 'poterant' },
        futurum_act: { name: 'Futurum I', p1s: 'poterō', p2s: 'poteris', p3s: 'poterit', p1p: 'poterimus', p2p: 'poteritis', p3p: 'poterunt' },
        perfectum_act: { name: 'Perfectum', p1s: 'potuī', p2s: 'potuistī', p3s: 'potuit', p1p: 'potuimus', p2p: 'potuistis', p3p: 'potuērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'potueram', p2s: 'potuerās', p3s: 'potuerat', p1p: 'potuerāmus', p2p: 'potuerātis', p3p: 'potuerant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'potuerō', p2s: 'potueris', p3s: 'potuerit', p1p: 'potuerimus', p2p: 'potueritis', p3p: 'potuerint' }
      }
    },
    {
      id: 'verb_fero',
      title: 'Düzensiz Fiil: ferō, ferre, tulī, lātum (taşımak, getirmek)',
      model: 'ferō, ferre, tulī, lātum (taşımak, dayanmak, katlanmak)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'ferō', p2s: 'fers', p3s: 'fert', p1p: 'ferimus', p2p: 'fertis', p3p: 'ferunt' },
        imperfectum_act: { name: 'Imperfectum', p1s: 'ferēbam', p2s: 'ferēbās', p3s: 'ferēbat', p1p: 'ferēbāmus', p2p: 'ferēbātis', p3p: 'ferēbant' },
        futurum_act: { name: 'Futurum I', p1s: 'feram', p2s: 'ferēs', p3s: 'feret', p1p: 'ferēmus', p2p: 'ferētis', p3p: 'ferent' },
        perfectum_act: { name: 'Perfectum', p1s: 'tulī', p2s: 'tulistī', p3s: 'tulit', p1p: 'tulimus', p2p: 'tulistis', p3p: 'tulērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'tuleram', p2s: 'tulerās', p3s: 'tulerat', p1p: 'tulerāmus', p2p: 'tulerātis', p3p: 'tulerant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'tulerō', p2s: 'tuleris', p3s: 'tulerit', p1p: 'tulerimus', p2p: 'tuleritis', p3p: 'tulerint' }
      }
    },
    {
      id: 'verb_volo',
      title: 'Düzensiz Fiil: volō, velle, voluī (istemek)',
      model: 'volō, velle, voluī (istemek, arzu etmek)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'volō', p2s: 'vīs', p3s: 'vult', p1p: 'volumus', p2p: 'vultis', p3p: 'volunt' },
        imperfectum_act: { name: 'Imperfectum', p1s: 'volēbam', p2s: 'volēbās', p3s: 'volēbat', p1p: 'volēbāmus', p2p: 'volēbātis', p3p: 'volēbant' },
        futurum_act: { name: 'Futurum I', p1s: 'volam', p2s: 'volēs', p3s: 'volet', p1p: 'volēmus', p2p: 'volētis', p3p: 'volent' },
        perfectum_act: { name: 'Perfectum', p1s: 'voluī', p2s: 'voluistī', p3s: 'voluit', p1p: 'voluimus', p2p: 'voluistis', p3p: 'voluērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'volueram', p2s: 'voluerās', p3s: 'voluerat', p1p: 'voluerāmus', p2p: 'voluerātis', p3p: 'voluerant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'voluerō', p2s: 'volueris', p3s: 'voluerit', p1p: 'voluerimus', p2p: 'volueritis', p3p: 'voluerint' }
      }
    },
    {
      id: 'verb_eo',
      title: 'Düzensiz Fiil: eō, īre, iī / īvī, itum (gitmek)',
      model: 'eō, īre, iī (īvī), itum (gitmek)',
      tenses: {
        praesens_act: { name: 'Praesens', p1s: 'eō', p2s: 'īs', p3s: 'it', p1p: 'īmus', p2p: 'ītis', p3p: 'eunt' },
        imperfectum_act: { name: 'Imperfectum', p1s: 'ībam', p2s: 'ībās', p3s: 'ībat', p1p: 'ībāmus', p2p: 'ībātis', p3p: 'ībant' },
        futurum_act: { name: 'Futurum I', p1s: 'ībō', p2s: 'ībis', p3s: 'ībit', p1p: 'ībimus', p2p: 'ībitis', p3p: 'ībunt' },
        perfectum_act: { name: 'Perfectum', p1s: 'iī (īvī)', p2s: 'īstī', p3s: 'iit', p1p: 'iimus', p2p: 'īstis', p3p: 'iērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'ieram', p2s: 'ierās', p3s: 'ierat', p1p: 'ierāmus', p2p: 'ierātis', p3p: 'ierant' },
        futurum_perf_act: { name: 'Futurum II', p1s: 'ierō', p2s: 'ieris', p3s: 'ierit', p1p: 'ierimus', p2p: 'ieritis', p3p: 'ierint' }
      }
    }
  ]
};

// ============================================================================
// DÜZENSİZ / ÖZEL SÖZCÜK ÇEKİMLERİ (997 Listesindeki İstisnalar)
// ============================================================================
const LATIN_EXCEPTIONS = {
  // vis (güç, kuvvet)
  'vīs': {
    type: 'noun',
    title: 'vīs, vīs f. (güç, kudret, şiddet) - Düzensiz İsim',
    forms: {
      nom: { sg: 'vīs', pl: 'vīrēs' },
      voc: { sg: 'vīs', pl: 'vīrēs' },
      gen: { sg: 'vīs (nadir)', pl: 'vīrium' },
      dat: { sg: 'vī (nadir)', pl: 'vīribus' },
      acc: { sg: 'vim', pl: 'vīrēs (vīrīs)' },
      abl: { sg: 'vī', pl: 'vīribus' }
    },
    note: 'Tekilde Genetivus ve Dativus nadiren kullanılır. Çoğul kökü vīr- olur.'
  },
  // vir (adam)
  'vir': {
    type: 'noun',
    title: 'vir, virī m. (adam, erkek, yiğit) - 2. Çekim',
    forms: {
      nom: { sg: 'vir', pl: 'virī' },
      voc: { sg: 'vir', pl: 'virī' },
      gen: { sg: 'virī', pl: 'virōrum' },
      dat: { sg: 'virō', pl: 'virīs' },
      acc: { sg: 'virum', pl: 'virōs' },
      abl: { sg: 'virō', pl: 'virīs' }
    }
  },
  // deus (tanrı)
  'deus': {
    type: 'noun',
    title: 'deus, deī m. (tanrı)',
    forms: {
      nom: { sg: 'deus', pl: 'deī / diī / dī' },
      voc: { sg: 'deus', pl: 'deī / diī / dī' },
      gen: { sg: 'deī', pl: 'deōrum / deum' },
      dat: { sg: 'deō', pl: 'deīs / diīs / dīs' },
      acc: { sg: 'deum', pl: 'deōs' },
      abl: { sg: 'deō', pl: 'deīs / diīs / dīs' }
    },
    note: 'Vocativus tekil deustur (mi deus). Çoğulda dī ve dīs biçimleri sıktır.'
  },
  // domus (ev)
  'domus': {
    type: 'noun',
    title: 'domus, domūs f. (ev, yurt) - Karma (2. ve 4. Çekim)',
    forms: {
      nom: { sg: 'domus', pl: 'domūs' },
      voc: { sg: 'domus', pl: 'domūs' },
      gen: { sg: 'domūs (domī)', pl: 'domuum / domōrum' },
      dat: { sg: 'domuī (domō)', pl: 'domibus' },
      acc: { sg: 'domum', pl: 'domōs / domūs' },
      abl: { sg: 'domō (domū)', pl: 'domibus' }
    },
    note: 'Locativus (bulunma hali): domī (evde). Yönelme: domum (eve).'
  },
  // nemo (hiç kimse)
  'nēmō': {
    type: 'noun',
    title: 'nēmō m./f. (hiç kimse) - Eksik İsim',
    forms: {
      nom: { sg: 'nēmō', pl: '-' },
      voc: { sg: 'nēmō', pl: '-' },
      gen: { sg: 'nūllīus (nēminis)', pl: '-' },
      dat: { sg: 'nēminī', pl: '-' },
      acc: { sg: 'nēminem', pl: '-' },
      abl: { sg: 'nūllō (nēmine)', pl: '-' }
    },
    note: 'Genetivus ve Ablativus için genellikle nūllus kullanılır.'
  }
};
