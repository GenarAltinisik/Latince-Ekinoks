// Latince Ekinoks - Çekim Motoru (Inflection Engine)

const InflectionEngine = (function () {

  // Casus anahtarlarını seçilen sıralamaya göre döndürür
  function getOrderedCases(orderId) {
    const config = LATIN_CASE_ORDERS[orderId] || LATIN_CASE_ORDERS['NVGDAcAb'];
    return config.order.map(key => LATIN_CASE_INFO[key]);
  }

  // Kelime için çekim verisi üretir
  function getWordInflection(word) {
    if (!word) return null;

    const posGroup = (word.pos_group || '').toLowerCase();
    const cleanHeadword = word.headword || word.lemma;
    const cleanLemma = word.lemma || word.headword;

    // 1. Önce özel/düzensiz istisna tablosunda var mı kontrol et
    for (const [key, exc] of Object.entries(LATIN_EXCEPTIONS)) {
      if (cleanHeadword.toLowerCase().includes(key) || cleanLemma.toLowerCase() === key) {
        return {
          type: 'noun_declension',
          title: exc.title || cleanHeadword,
          isIrregular: true,
          forms: exc.forms,
          note: exc.note || ''
        };
      }
    }

    // 2. İsim Çekimi
    if (posGroup.includes('isim') || word.pos_tr?.toLowerCase().includes('isim')) {
      return generateNounDeclension(word);
    }

    // 3. Sıfat Çekimi
    if (posGroup.includes('sıfat') || posGroup.includes('sifat') || word.pos_tr?.toLowerCase().includes('sıfat')) {
      return generateAdjectiveDeclension(word);
    }

    // 4. Zamir Çekimi
    if (posGroup.includes('zamir') || word.pos_tr?.toLowerCase().includes('zamir')) {
      return generatePronounDeclension(word);
    }

    // 5. Fiil Çekimi
    if (posGroup.includes('fiil') || word.pos_tr?.toLowerCase().includes('fiil')) {
      return generateVerbConjugation(word);
    }

    // 6. Çekimsiz Sözcükler (Zarf, Edat, Bağlaç)
    return {
      type: 'indeclinable',
      title: `${word.headword} (${word.pos_tr})`,
      pos: word.pos_tr,
      cat: word.cat_tr,
      meaning_tr: word.def_tr,
      meaning_en: word.def_en,
      note: 'Bu sözcük çekimsizdir (Indeclinabile). Cümle içinde herhangi bir hal (casus), şahıs veya zaman eki almaz; sözlükte yer aldığı biçimiyle sabit olarak kullanılır.'
    };
  }

  // ==========================================================================
  // İSİM ÇEKİMİ ÜRETİCİ
  // ==========================================================================
  function generateNounDeclension(word) {
    const hw = word.headword;
    const lemma = word.lemma;
    const isNeuter = hw.includes(' n.') || word.cat_tr?.includes('Nötr');

    // 1. Declinatio: -a, -ae
    if (hw.includes('-ae') || hw.includes(', -ae') || (hw.includes(' -ae') && !hw.includes('-ēī'))) {
      const stem = lemma.replace(/a$/, '');
      return {
        type: 'noun_declension',
        title: `${hw} (1. Çekim - Declinatio I)`,
        gender: 'Femininum (Dişil)',
        forms: {
          nom: { sg: stem + 'a', pl: stem + 'ae' },
          voc: { sg: stem + 'a', pl: stem + 'ae' },
          gen: { sg: stem + 'ae', pl: stem + 'ārum' },
          dat: { sg: stem + 'ae', pl: stem + 'īs' },
          acc: { sg: stem + 'am', pl: stem + 'ās' },
          abl: { sg: stem + 'ā', pl: stem + 'īs' }
        }
      };
    }

    // 2. Declinatio Nötr: -um, -ī
    if (isNeuter && (hw.includes('-ī') || hw.includes(' -ī') || lemma.endsWith('um'))) {
      const stem = lemma.replace(/um$/, '');
      return {
        type: 'noun_declension',
        title: `${hw} (2. Çekim Nötr - Declinatio II)`,
        gender: 'Neutrum (Nötr)',
        forms: {
          nom: { sg: stem + 'um', pl: stem + 'a' },
          voc: { sg: stem + 'um', pl: stem + 'a' },
          gen: { sg: stem + 'ī', pl: stem + 'ōrum' },
          dat: { sg: stem + 'ō', pl: stem + 'īs' },
          acc: { sg: stem + 'um', pl: stem + 'a' },
          abl: { sg: stem + 'ō', pl: stem + 'īs' }
        }
      };
    }

    // 2. Declinatio Eril: -us, -ī veya -er, -ī
    if (hw.includes('-ī') || hw.includes(' -ī') || hw.includes(', -ī')) {
      if (lemma.endsWith('er')) {
        // puer / ager tipi
        const parts = hw.split(' ');
        let stem = lemma;
        if (parts.length > 1 && parts[1].endsWith('ī')) {
          stem = parts[1].replace(/ī$/, '');
        }
        return {
          type: 'noun_declension',
          title: `${hw} (2. Çekim -er - Declinatio II)`,
          gender: 'Masculinum (Eril)',
          forms: {
            nom: { sg: lemma, pl: stem + 'ī' },
            voc: { sg: lemma, pl: stem + 'ī' },
            gen: { sg: stem + 'ī', pl: stem + 'ōrum' },
            dat: { sg: stem + 'ō', pl: stem + 'īs' },
            acc: { sg: stem + 'um', pl: stem + 'ōs' },
            abl: { sg: stem + 'ō', pl: stem + 'īs' }
          }
        };
      } else {
        // servus tipi
        const stem = lemma.replace(/us$/, '');
        return {
          type: 'noun_declension',
          title: `${hw} (2. Çekim -us - Declinatio II)`,
          gender: 'Masculinum (Eril)',
          forms: {
            nom: { sg: stem + 'us', pl: stem + 'ī' },
            voc: { sg: stem + 'e', pl: stem + 'ī' },
            gen: { sg: stem + 'ī', pl: stem + 'ōrum' },
            dat: { sg: stem + 'ō', pl: stem + 'īs' },
            acc: { sg: stem + 'um', pl: stem + 'ōs' },
            abl: { sg: stem + 'ō', pl: stem + 'īs' }
          }
        };
      }
    }

    // 4. Declinatio: -ūs
    if (hw.includes('-ūs') || hw.includes(' -ūs')) {
      const stem = lemma.replace(/us$/, '').replace(/ū$/, '');
      if (isNeuter) {
        return {
          type: 'noun_declension',
          title: `${hw} (4. Çekim Nötr - Declinatio IV)`,
          gender: 'Neutrum',
          forms: {
            nom: { sg: stem + 'ū', pl: stem + 'ua' },
            voc: { sg: stem + 'ū', pl: stem + 'ua' },
            gen: { sg: stem + 'ūs', pl: stem + 'uum' },
            dat: { sg: stem + 'ū', pl: stem + 'ibus' },
            acc: { sg: stem + 'ū', pl: stem + 'ua' },
            abl: { sg: stem + 'ū', pl: stem + 'ibus' }
          }
        };
      } else {
        return {
          type: 'noun_declension',
          title: `${hw} (4. Çekim - Declinatio IV)`,
          gender: 'Masculinum',
          forms: {
            nom: { sg: stem + 'us', pl: stem + 'ūs' },
            voc: { sg: stem + 'us', pl: stem + 'ūs' },
            gen: { sg: stem + 'ūs', pl: stem + 'uum' },
            dat: { sg: stem + 'uī', pl: stem + 'ibus' },
            acc: { sg: stem + 'um', pl: stem + 'ūs' },
            abl: { sg: stem + 'ū', pl: stem + 'ibus' }
          }
        };
      }
    }

    // 5. Declinatio: -ēī / -eī
    if (hw.includes('-ēī') || hw.includes('-eī') || hw.includes('diēs') || hw.includes('rēs')) {
      const stem = lemma.replace(/ēs$/, '');
      return {
        type: 'noun_declension',
        title: `${hw} (5. Çekim - Declinatio V)`,
        gender: 'Femininum / Masculinum',
        forms: {
          nom: { sg: lemma, pl: stem + 'ēs' },
          voc: { sg: lemma, pl: stem + 'ēs' },
          gen: { sg: stem + 'eī', pl: stem + 'ērum' },
          dat: { sg: stem + 'eī', pl: stem + 'ēbus' },
          acc: { sg: stem + 'em', pl: stem + 'ēs' },
          abl: { sg: stem + 'ē', pl: stem + 'ēbus' }
        }
      };
    }

    // 3. Declinatio (Varsayılan veya -is ile biten)
    let stem = lemma;
    // Genetivus ikinci kelime olarak verilmişse kökü oradan çıkar
    const parts = hw.replace(/,/g, '').split(' ');
    if (parts.length > 1) {
      const genPart = parts[1];
      if (genPart.endsWith('is')) {
        stem = genPart.replace(/is$/, '');
      } else if (genPart.startsWith('-') && genPart.endsWith('is')) {
        const suffix = genPart.replace(/^-/, '').replace(/is$/, '');
        stem = lemma.slice(0, -suffix.length) + suffix;
      }
    }

    // i-kökü testi (eşhece veya çift sessiz)
    const isIStem = (lemma.endsWith('is') || lemma.endsWith('es')) && !hw.includes('corpor');
    const plGen = isIStem ? stem + 'ium' : stem + 'um';
    const plNomAccNeu = isIStem ? stem + 'ia' : stem + 'a';
    const ablSgNeu = isIStem ? stem + 'ī' : stem + 'e';

    if (isNeuter) {
      return {
        type: 'noun_declension',
        title: `${hw} (3. Çekim Nötr - Declinatio III)`,
        gender: 'Neutrum',
        forms: {
          nom: { sg: lemma, pl: plNomAccNeu },
          voc: { sg: lemma, pl: plNomAccNeu },
          gen: { sg: stem + 'is', pl: plGen },
          dat: { sg: stem + 'ī', pl: stem + 'ibus' },
          acc: { sg: lemma, pl: plNomAccNeu },
          abl: { sg: ablSgNeu, pl: stem + 'ibus' }
        }
      };
    }

    return {
      type: 'noun_declension',
      title: `${hw} (3. Çekim - Declinatio III)`,
      gender: hw.includes(' f.') ? 'Femininum' : 'Masculinum',
      forms: {
        nom: { sg: lemma, pl: stem + 'ēs' },
        voc: { sg: lemma, pl: stem + 'ēs' },
        gen: { sg: stem + 'is', pl: plGen },
        dat: { sg: stem + 'ī', pl: stem + 'ibus' },
        acc: { sg: stem + 'em', pl: isIStem ? `${stem}ēs (${stem}īs)` : stem + 'ēs' },
        abl: { sg: stem + 'e', pl: stem + 'ibus' }
      }
    };
  }

  // ==========================================================================
  // SIFAT ÇEKİMİ ÜRETİCİ
  // ==========================================================================
  function generateAdjectiveDeclension(word) {
    const hw = word.headword;
    const lemma = word.lemma;

    // 1./2. Sınıf Sıfatlar (-us, -a, -um veya -er, -a, -um)
    if (hw.includes('-a, -um') || hw.includes('-a -um') || hw.includes('-um')) {
      let stem = lemma.replace(/us$/, '').replace(/er$/, '');
      const parts = hw.split(' ');
      if (lemma.endsWith('er') && parts.length > 1) {
        stem = parts[1].replace(/^-/, '').replace(/a$/, '');
      }

      return {
        type: 'adjective_declension',
        title: `${hw} (1. ve 2. Sınıf Sıfat)`,
        singular: {
          nom: { m: lemma, f: stem + 'a', n: stem + 'um' },
          voc: { m: lemma.endsWith('er') ? lemma : stem + 'e', f: stem + 'a', n: stem + 'um' },
          gen: { m: stem + 'ī', f: stem + 'ae', n: stem + 'ī' },
          dat: { m: stem + 'ō', f: stem + 'ae', n: stem + 'ō' },
          acc: { m: stem + 'um', f: stem + 'am', n: stem + 'um' },
          abl: { m: stem + 'ō', f: stem + 'ā', n: stem + 'ō' }
        },
        plural: {
          nom: { m: stem + 'ī', f: stem + 'ae', n: stem + 'a' },
          voc: { m: stem + 'ī', f: stem + 'ae', n: stem + 'a' },
          gen: { m: stem + 'ōrum', f: stem + 'ārum', n: stem + 'ōrum' },
          dat: { m: stem + 'īs', f: stem + 'īs', n: stem + 'īs' },
          acc: { m: stem + 'ōs', f: stem + 'ās', n: stem + 'a' },
          abl: { m: stem + 'īs', f: stem + 'īs', n: stem + 'īs' }
        }
      };
    }

    // 3. Sınıf İki Sonlanışlı (-is, -e)
    if (hw.includes('-e') || lemma.endsWith('is')) {
      const stem = lemma.replace(/is$/, '');
      return {
        type: 'adjective_declension',
        title: `${hw} (3. Sınıf Sıfat - İki Sonlanışlı)`,
        singular: {
          nom: { m: stem + 'is', f: stem + 'is', n: stem + 'e' },
          voc: { m: stem + 'is', f: stem + 'is', n: stem + 'e' },
          gen: { m: stem + 'is', f: stem + 'is', n: stem + 'is' },
          dat: { m: stem + 'ī', f: stem + 'ī', n: stem + 'ī' },
          acc: { m: stem + 'em', f: stem + 'em', n: stem + 'e' },
          abl: { m: stem + 'ī', f: stem + 'ī', n: stem + 'ī' }
        },
        plural: {
          nom: { m: stem + 'ēs', f: stem + 'ēs', n: stem + 'ia' },
          voc: { m: stem + 'ēs', f: stem + 'ēs', n: stem + 'ia' },
          gen: { m: stem + 'ium', f: stem + 'ium', n: stem + 'ium' },
          dat: { m: stem + 'ibus', f: stem + 'ibus', n: stem + 'ibus' },
          acc: { m: stem + 'ēs', f: stem + 'ēs', n: stem + 'ia' },
          abl: { m: stem + 'ibus', f: stem + 'ibus', n: stem + 'ibus' }
        }
      };
    }

    // 3. Sınıf Tek Sonlanışlı (ingēns tipi)
    const stem = lemma.replace(/s$/, 't').replace(/x$/, 'c');
    return {
      type: 'adjective_declension',
      title: `${hw} (3. Sınıf Sıfat - Tek Sonlanışlı)`,
      singular: {
        nom: { m: lemma, f: lemma, n: lemma },
        voc: { m: lemma, f: lemma, n: lemma },
        gen: { m: stem + 'is', f: stem + 'is', n: stem + 'is' },
        dat: { m: stem + 'ī', f: stem + 'ī', n: stem + 'ī' },
        acc: { m: stem + 'em', f: stem + 'em', n: lemma },
        abl: { m: stem + 'ī', f: stem + 'ī', n: stem + 'ī' }
      },
      plural: {
        nom: { m: stem + 'ēs', f: stem + 'ēs', n: stem + 'ia' },
        voc: { m: stem + 'ēs', f: stem + 'ēs', n: stem + 'ia' },
        gen: { m: stem + 'ium', f: stem + 'ium', n: stem + 'ium' },
        dat: { m: stem + 'ibus', f: stem + 'ibus', n: stem + 'ibus' },
        acc: { m: stem + 'ēs', f: stem + 'ēs', n: stem + 'ia' },
        abl: { m: stem + 'ibus', f: stem + 'ibus', n: stem + 'ibus' }
      }
    };
  }

  // ==========================================================================
  // ZAMİR ÇEKİMİ ÜRETİCİ
  // ==========================================================================
  function generatePronounDeclension(word) {
    const lemma = word.lemma.toLowerCase();

    if (lemma === 'is' || lemma.includes('ea') || lemma.includes('id')) {
      return {
        type: 'adjective_declension',
        title: 'is, ea, id (İşaret Zamiri)',
        ...LATIN_REFERENCE_PARADIGMS.pronouns[0]
      };
    }

    if (lemma === 'qui' || lemma === 'quī' || lemma.includes('quod')) {
      return {
        type: 'adjective_declension',
        title: 'quī, quae, quod (İlgi Zamiri)',
        ...LATIN_REFERENCE_PARADIGMS.pronouns[1]
      };
    }

    if (lemma === 'ego' || lemma === 'tu' || lemma === 'tū' || lemma.includes('nos')) {
      return {
        type: 'adjective_declension',
        title: 'Kişi Zamirleri (ego & tū)',
        ...LATIN_REFERENCE_PARADIGMS.pronouns[2]
      };
    }

    // Genel zamir çekimi için fallback
    return generateAdjectiveDeclension(word);
  }

  // ==========================================================================
  // FİİL ÇEKİMİ ÜRETİCİ
  // ==========================================================================
  function generateVerbConjugation(word) {
    const hw = word.headword;
    const lemma = word.lemma;

    // Düzensiz fiiller için hazır referansları eşle
    if (lemma === 'sum' || hw.includes('esse fuī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_sum') };
    }
    if (lemma === 'possum' || hw.includes('posse potuī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_possum') };
    }
    if (lemma === 'fero' || lemma === 'ferō' || hw.includes('ferre tulī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_fero') };
    }
    if (lemma === 'volo' || lemma === 'volō' || hw.includes('velle')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_volo') };
    }
    if (lemma === 'eo' || lemma === 'eō' || hw.includes('īre')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_eo') };
    }

    // Deponent Fiiller (biçimce edilgen)
    const isDeponent = hw.includes('ī, ') || hw.includes('rī, ') || lemma.endsWith('or');
    if (isDeponent) {
      const stem = lemma.replace(/or$/, '');
      return {
        type: 'verb_conjugation',
        title: `${hw} (Deponent Fiil - Verbum Dēpōnēns)`,
        model: `${hw} • Biçimce Edilgen, Anlamca Etken`,
        tenses: {
          praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s: lemma, p2s: stem + 'ris', p3s: stem + 'tur', p1p: stem + 'mur', p2p: stem + 'minī', p3p: stem + 'ntur' },
          imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: stem + 'bar', p2s: stem + 'bāris', p3s: stem + 'bātur', p1p: stem + 'bāmur', p2p: stem + 'bāminī', p3p: stem + 'bantur' },
          futurum_act: { name: 'Futurum I (Gelecek Zaman)', p1s: stem + 'ar', p2s: stem + 'ēris', p3s: stem + 'ētur', p1p: stem + 'ēmur', p2p: stem + 'ēminī', p3p: stem + 'entur' },
          perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: stem + 'tus sum', p2s: stem + 'tus es', p3s: stem + 'tus est', p1p: stem + 'tī sumus', p2p: stem + 'tī estis', p3p: stem + 'tī sunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: stem + 'tus eram', p2s: stem + 'tus erās', p3s: stem + 'tus erat', p1p: stem + 'tī erāmus', p2p: stem + 'tī erātis', p3p: stem + 'tī erant' },
          futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: stem + 'tus erō', p2s: stem + 'tus eris', p3s: stem + 'tus erit', p1p: stem + 'tī erimus', p2p: stem + 'tī eritis', p3p: stem + 'tī erunt' }
        }
      };
    }

    // Standart Etken Fiiller (1-4 Coniugatio)
    let stem = lemma.replace(/ō$/, '').replace(/o$/, '');
    let conjType = '1. Çekim (-āre)';
    let inf = 'āre';

    if (hw.includes('-ēre') || hw.includes('ēre')) {
      conjType = '2. Çekim (-ēre)';
      inf = 'ēre';
    } else if (hw.includes('-īre') || hw.includes('īre')) {
      conjType = '4. Çekim (-īre)';
      inf = 'īre';
    } else if (hw.includes('-ere') || hw.includes('ere')) {
      conjType = '3. Çekim (-ere)';
      inf = 'ere';
    }

    // Köklerden türet
    return {
      type: 'verb_conjugation',
      title: `${hw} (${conjType})`,
      model: `${hw}`,
      tenses: {
        praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s: lemma, p2s: stem + 's', p3s: stem + 't', p1p: stem + 'mus', p2p: stem + 'tis', p3p: stem + 'nt' },
        imperfectum_act: { name: 'Imperfectum (-yordu)', p1s: stem + 'bam', p2s: stem + 'bās', p3s: stem + 'bat', p1p: stem + 'bāmus', p2p: stem + 'bātis', p3p: stem + 'bant' },
        futurum_act: { name: 'Futurum I (-ecek)', p1s: stem + 'bō', p2s: stem + 'bis', p3s: stem + 'bit', p1p: stem + 'bimus', p2p: stem + 'bitis', p3p: stem + 'bunt' },
        perfectum_act: { name: 'Perfectum (-di)', p1s: stem + 'vī', p2s: stem + 'vistī', p3s: stem + 'vit', p1p: stem + 'vimus', p2p: stem + 'vistis', p3p: stem + 'vērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: stem + 'veram', p2s: stem + 'verās', p3s: stem + 'verat', p1p: stem + 'verāmus', p2p: stem + 'verātis', p3p: stem + 'verant' },
        futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: stem + 'verō', p2s: stem + 'veris', p3s: stem + 'verit', p1p: stem + 'verimus', p2p: stem + 'veritis', p3p: stem + 'verint' }
      }
    };
  }

  // ==========================================================================
  // HTML RENDER MOTORU (MODAL VE PANELLER İÇİN)
  // ==========================================================================
  function renderWordInflectionHtml(word, orderId = 'NVGDAcAb') {
    const data = getWordInflection(word);
    if (!data) return '<p class="text-muted">Bu sözcük için çekim verisi bulunamadı.</p>';

    const orderedCases = getOrderedCases(orderId);

    // Çekimsiz Sözcük
    if (data.type === 'indeclinable') {
      return `
        <div class="indeclinable-card">
          <div class="indeclinable-badge">📜 Değişmez / Çekimsiz Sözcük (Indeclinabile)</div>
          <h3 class="paradigm-word-title">${word.headword}</h3>
          <p class="paradigm-word-subtitle">${word.pos_tr} • ${word.cat_tr} • Sıklık: #${word.rank}</p>
          <div class="indeclinable-note">
            ${data.note}
          </div>
          <div class="paradigm-meaning-box">
            <div><strong>🇹🇷 Anlamı:</strong> ${word.def_tr}</div>
            <div><strong>🇬🇧 İngilizce:</strong> ${word.def_en}</div>
          </div>
        </div>
      `;
    }

    // İsim Çekimi
    if (data.type === 'noun_declension') {
      return `
        <div class="paradigm-container">
          <div class="paradigm-card-header">
            <h3 class="paradigm-word-title">${data.title}</h3>
            <span class="tag-badge pos-tag">${data.gender || word.pos_tr}</span>
            <span class="tag-badge">Sıklık: #${word.rank}</span>
          </div>

          <div class="table-responsive">
            <table class="paradigm-table">
              <thead>
                <tr>
                  <th class="col-case">Hâl (Casus) & Türkçe Karşılığı</th>
                  <th>Singulāris (Tekil)</th>
                  <th>Plūrālis (Çoğul)</th>
                </tr>
              </thead>
              <tbody>
                ${orderedCases.map(c => {
                  const form = data.forms[c.key] || { sg: '-', pl: '-' };
                  return `
                    <tr>
                      <td class="case-label-cell">
                        <strong>${c.name}</strong>
                        <span class="case-tr-tag">(${c.tr})</span>
                      </td>
                      <td class="form-cell latin-text">${form.sg}</td>
                      <td class="form-cell latin-text">${form.pl}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          ${data.note ? `<div class="paradigm-footer-note">💡 <strong>Gramer Notu:</strong> ${data.note}</div>` : ''}
        </div>
      `;
    }

    // Sıfat veya Zamir Çekimi
    if (data.type === 'adjective_declension') {
      return `
        <div class="paradigm-container">
          <div class="paradigm-card-header">
            <h3 class="paradigm-word-title">${data.title}</h3>
            <span class="tag-badge pos-tag">${word.pos_tr}</span>
            <span class="tag-badge">Sıklık: #${word.rank}</span>
          </div>

          <h4 class="paradigm-section-title">Singulāris (Tekil Çekim)</h4>
          <div class="table-responsive">
            <table class="paradigm-table">
              <thead>
                <tr>
                  <th class="col-case">Casus (Türkçe Karşılık)</th>
                  <th>Masculīnum (Eril)</th>
                  <th>Fēminīnum (Dişil)</th>
                  <th>Neutrum (Nötr)</th>
                </tr>
              </thead>
              <tbody>
                ${orderedCases.map(c => {
                  const form = data.singular[c.key] || { m: '-', f: '-', n: '-' };
                  return `
                    <tr>
                      <td class="case-label-cell">
                        <strong>${c.name}</strong>
                        <span class="case-tr-tag">(${c.tr})</span>
                      </td>
                      <td class="form-cell latin-text">${form.m}</td>
                      <td class="form-cell latin-text">${form.f}</td>
                      <td class="form-cell latin-text">${form.n}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <h4 class="paradigm-section-title" style="margin-top: 1.5rem;">Plūrālis (Çoğul Çekim)</h4>
          <div class="table-responsive">
            <table class="paradigm-table">
              <thead>
                <tr>
                  <th class="col-case">Casus (Türkçe Karşılık)</th>
                  <th>Masculīnum (Eril)</th>
                  <th>Fēminīnum (Dişil)</th>
                  <th>Neutrum (Nötr)</th>
                </tr>
              </thead>
              <tbody>
                ${orderedCases.map(c => {
                  const form = data.plural[c.key] || { m: '-', f: '-', n: '-' };
                  return `
                    <tr>
                      <td class="case-label-cell">
                        <strong>${c.name}</strong>
                        <span class="case-tr-tag">(${c.tr})</span>
                      </td>
                      <td class="form-cell latin-text">${form.m}</td>
                      <td class="form-cell latin-text">${form.f}</td>
                      <td class="form-cell latin-text">${form.n}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          ${data.note ? `<div class="paradigm-footer-note">💡 <strong>Gramer Notu:</strong> ${data.note}</div>` : ''}
        </div>
      `;
    }

    // Fiil Çekimi
    if (data.type === 'verb_conjugation') {
      return `
        <div class="paradigm-container">
          <div class="paradigm-card-header">
            <h3 class="paradigm-word-title">${data.title}</h3>
            <span class="tag-badge pos-tag">${word.pos_tr}</span>
            <span class="tag-badge">Sıklık: #${word.rank}</span>
          </div>

          <div class="paradigm-verb-grid">
            ${Object.entries(data.tenses).map(([tKey, t]) => `
              <div class="verb-tense-card">
                <div class="tense-card-header">${t.name}</div>
                <table class="verb-mini-table">
                  <tbody>
                    <tr><td class="person-label">1. Tekil (ego)</td><td class="latin-text">${t.p1s}</td></tr>
                    <tr><td class="person-label">2. Tekil (tū)</td><td class="latin-text">${t.p2s}</td></tr>
                    <tr><td class="person-label">3. Tekil (is/ea/id)</td><td class="latin-text">${t.p3s}</td></tr>
                    <tr><td class="person-label">1. Çoğul (nōs)</td><td class="latin-text">${t.p1p}</td></tr>
                    <tr><td class="person-label">2. Çoğul (vōs)</td><td class="latin-text">${t.p2p}</td></tr>
                    <tr><td class="person-label">3. Çoğul (eī/eae)</td><td class="latin-text">${t.p3p}</td></tr>
                  </tbody>
                </table>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return '';
  }

  // ==========================================================================
  // GENEL REFERANS REHBERİ RENDER METODU
  // ==========================================================================
  function renderReferenceCategoryHtml(category = 'nouns', orderId = 'NVGDAcAb') {
    const orderedCases = getOrderedCases(orderId);

    if (category === 'nouns') {
      return `
        <div class="reference-section-list">
          ${LATIN_REFERENCE_PARADIGMS.nouns.map(item => `
            <div class="reference-item-card">
              <div class="reference-item-header">
                <div>
                  <h4 class="reference-item-title">${item.title}</h4>
                  <p class="reference-item-sub">${item.subtitle} • Örnek Model: <strong>${item.model}</strong></p>
                </div>
              </div>
              <div class="table-responsive">
                <table class="paradigm-table">
                  <thead>
                    <tr>
                      <th class="col-case">Casus (Türkçe Karşılığı)</th>
                      <th>Singulāris (Tekil)</th>
                      <th>Plūrālis (Çoğul)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderedCases.map(c => `
                      <tr>
                        <td class="case-label-cell">
                          <strong>${c.name}</strong>
                          <span class="case-tr-tag">(${c.tr})</span>
                        </td>
                        <td class="form-cell latin-text">${item.forms[c.key]?.sg || '-'}</td>
                        <td class="form-cell latin-text">${item.forms[c.key]?.pl || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${item.note ? `<div class="paradigm-footer-note">💡 ${item.note}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    if (category === 'adjectives') {
      return `
        <div class="reference-section-list">
          ${LATIN_REFERENCE_PARADIGMS.adjectives.map(item => `
            <div class="reference-item-card">
              <div class="reference-item-header">
                <div>
                  <h4 class="reference-item-title">${item.title}</h4>
                  <p class="reference-item-sub">${item.subtitle} • Model: <strong>${item.model}</strong></p>
                </div>
              </div>

              <div class="table-responsive" style="margin-bottom: 1rem;">
                <table class="paradigm-table">
                  <thead>
                    <tr>
                      <th class="col-case">Tekil (Singulāris)</th>
                      <th>Eril (Masculīnum)</th>
                      <th>Dişil (Fēminīnum)</th>
                      <th>Nötr (Neutrum)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderedCases.map(c => `
                      <tr>
                        <td class="case-label-cell">
                          <strong>${c.name}</strong>
                          <span class="case-tr-tag">(${c.tr})</span>
                        </td>
                        <td class="form-cell latin-text">${item.singular[c.key]?.m || '-'}</td>
                        <td class="form-cell latin-text">${item.singular[c.key]?.f || '-'}</td>
                        <td class="form-cell latin-text">${item.singular[c.key]?.n || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="table-responsive">
                <table class="paradigm-table">
                  <thead>
                    <tr>
                      <th class="col-case">Çoğul (Plūrālis)</th>
                      <th>Eril (Masculīnum)</th>
                      <th>Dişil (Fēminīnum)</th>
                      <th>Nötr (Neutrum)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderedCases.map(c => `
                      <tr>
                        <td class="case-label-cell">
                          <strong>${c.name}</strong>
                          <span class="case-tr-tag">(${c.tr})</span>
                        </td>
                        <td class="form-cell latin-text">${item.plural[c.key]?.m || '-'}</td>
                        <td class="form-cell latin-text">${item.plural[c.key]?.f || '-'}</td>
                        <td class="form-cell latin-text">${item.plural[c.key]?.n || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              ${item.note ? `<div class="paradigm-footer-note">💡 ${item.note}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    if (category === 'pronouns') {
      return `
        <div class="reference-section-list">
          ${LATIN_REFERENCE_PARADIGMS.pronouns.map(item => `
            <div class="reference-item-card">
              <div class="reference-item-header">
                <div>
                  <h4 class="reference-item-title">${item.title}</h4>
                  <p class="reference-item-sub">${item.subtitle}</p>
                </div>
              </div>

              <div class="table-responsive" style="margin-bottom: 1rem;">
                <table class="paradigm-table">
                  <thead>
                    <tr>
                      <th class="col-case">Tekil (Singulāris)</th>
                      <th>Masculīnum</th>
                      <th>Fēminīnum</th>
                      <th>Neutrum</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderedCases.map(c => `
                      <tr>
                        <td class="case-label-cell">
                          <strong>${c.name}</strong>
                          <span class="case-tr-tag">(${c.tr})</span>
                        </td>
                        <td class="form-cell latin-text">${item.singular[c.key]?.m || '-'}</td>
                        <td class="form-cell latin-text">${item.singular[c.key]?.f || '-'}</td>
                        <td class="form-cell latin-text">${item.singular[c.key]?.n || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="table-responsive">
                <table class="paradigm-table">
                  <thead>
                    <tr>
                      <th class="col-case">Çoğul (Plūrālis)</th>
                      <th>Masculīnum</th>
                      <th>Fēminīnum</th>
                      <th>Neutrum</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderedCases.map(c => `
                      <tr>
                        <td class="case-label-cell">
                          <strong>${c.name}</strong>
                          <span class="case-tr-tag">(${c.tr})</span>
                        </td>
                        <td class="form-cell latin-text">${item.plural[c.key]?.m || '-'}</td>
                        <td class="form-cell latin-text">${item.plural[c.key]?.f || '-'}</td>
                        <td class="form-cell latin-text">${item.plural[c.key]?.n || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (category === 'verbs') {
      return `
        <div class="reference-section-list">
          ${LATIN_REFERENCE_PARADIGMS.verbs.map(item => `
            <div class="reference-item-card">
              <div class="reference-item-header">
                <div>
                  <h4 class="reference-item-title">${item.title}</h4>
                  <p class="reference-item-sub">Model Fiil: <strong>${item.model}</strong></p>
                </div>
              </div>

              <div class="paradigm-verb-grid">
                ${Object.entries(item.tenses).map(([tKey, t]) => `
                  <div class="verb-tense-card">
                    <div class="tense-card-header">${t.name}</div>
                    <table class="verb-mini-table">
                      <tbody>
                        <tr><td class="person-label">1. Tekil (ego)</td><td class="latin-text">${t.p1s}</td></tr>
                        <tr><td class="person-label">2. Tekil (tū)</td><td class="latin-text">${t.p2s}</td></tr>
                        <tr><td class="person-label">3. Tekil (is/ea)</td><td class="latin-text">${t.p3s}</td></tr>
                        <tr><td class="person-label">1. Çoğul (nōs)</td><td class="latin-text">${t.p1p}</td></tr>
                        <tr><td class="person-label">2. Çoğul (vōs)</td><td class="latin-text">${t.p2p}</td></tr>
                        <tr><td class="person-label">3. Çoğul (eī/eae)</td><td class="latin-text">${t.p3p}</td></tr>
                      </tbody>
                    </table>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return '';
  }

  return {
    getOrderedCases,
    getWordInflection,
    renderWordInflectionHtml,
    renderReferenceCategoryHtml
  };
})();
