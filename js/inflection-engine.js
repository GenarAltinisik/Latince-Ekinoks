// Latince Ekinoks - Kapsamlı Çekim Motoru (Inflection Engine)
// İstanbul Üniversitesi Klasik Filoloji (Latin Dili ve Edebiyatı & Eski Yunan Dili ve Edebiyatı)
// Geliştirici: Genar Altınışık

const InflectionEngine = (function () {

  // Casus anahtarlarını seçilen sıralamaya göre döndürür
  function getOrderedCases(orderId) {
    const config = (typeof LATIN_CASE_ORDERS !== 'undefined' && LATIN_CASE_ORDERS[orderId])
      ? LATIN_CASE_ORDERS[orderId]
      : { order: ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'] };
    return config.order.map(key => LATIN_CASE_INFO[key]);
  }

  // Yardımcı: Makron ve aksanları temizleyip küçük harfe çevirir (Eşleştirme için)
  function normalizeLatin(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Fiillerin 4 temel parçasını (Praesens, Infinitivus, Perfectum, Supinum) ayrıştırır
  function parseVerbPrincipalParts(hw, lemma) {
    if (!hw) return { pres: lemma || '', inf: '', perf: '', sup: '' };
    const tokens = hw.replace(/[,;]/g, ' ').split(/\s+/).filter(Boolean);
    const pres = tokens[0] || lemma || '';
    const cleanRaw = (lemma || pres).replace(/[oō]$/, '');

    let inf = '', perf = '', sup = '';

    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      // Infinitivus: -re veya deponent için -rī / -ī
      if (/r[eēīi]$/i.test(t) || /ī$/i.test(t)) {
        if (!inf) {
          inf = t.startsWith('-') ? cleanRaw + t.slice(1) : t;
          continue;
        }
      }
      // Perfectum: -ī ile biter ve infinitivus/fui değildir
      if (/[iī]$/i.test(t) && !/r[eēīi]$/i.test(t) && t !== 'fui' && t !== 'fuī') {
        if (!perf) {
          perf = t.startsWith('-') ? cleanRaw + t.slice(1) : t;
          continue;
        }
      }
      // Supinum / Participium Perfectum: -um ile biter
      if (/um$/i.test(t)) {
        if (!sup) {
          sup = t.startsWith('-') ? cleanRaw + t.slice(1) : t;
          continue;
        }
      }
    }

    return { pres, inf, perf, sup };
  }

  // ==========================================================================
  // ANA DAĞITICI (MASTER DISPATCHER)
  // pos_en alanı üzerinden %100 temiz, Türkçe harf hatalarından bağımsız sınıflandırma
  // ==========================================================================
  function getWordInflection(word) {
    if (!word) return null;

    const pe = (word.pos_en || '').trim();
    const cleanLemma = normalizeLatin(word.lemma || '');
    const cleanHeadFirst = normalizeLatin((word.headword || '').split(/[\s,.;]+/)[0]);

    // 1. Fiil Çekimleri (Verb: ...)
    if (pe.startsWith('Verb')) {
      return generateVerbConjugation(word);
    }

    // 2. Özel / Düzensiz İsim İstisnaları (SADECE İsimler İçin)
    if (pe.startsWith('Noun')) {
      for (const [key, exc] of Object.entries(LATIN_EXCEPTIONS)) {
        const normKey = normalizeLatin(key);
        if (cleanLemma === normKey || cleanHeadFirst === normKey) {
          return {
            type: 'noun_declension',
            title: exc.title || word.headword,
            modelName: 'Özel / İstisnai İsim Çekimi',
            groupDescription: 'Düzensiz İsim (Nōmen Anōmalum)',
            isIrregular: true,
            gender: exc.gender || word.pos_tr,
            forms: exc.forms,
            note: exc.note || ''
          };
        }
      }
      return generateNounDeclension(word);
    }

    // 3. Sıfat Çekimleri (Adjective: ...)
    if (pe.startsWith('Adjective')) {
      return generateAdjectiveDeclension(word);
    }

    // 4. Zamir Çekimleri (Pronoun)
    if (pe.startsWith('Pronoun')) {
      return generatePronounDeclension(word);
    }

    // 5. Çekimsiz Sözcükler (Zarf, Edat, Bağlaç, Ünlem)
    return {
      type: 'indeclinable',
      title: `${word.headword} (${word.pos_tr})`,
      modelName: 'Değişmez Sözcük (Indeclinabile)',
      groupDescription: `${word.pos_tr} • Cümle içinde çekim eki almaz`,
      pos: word.pos_tr,
      cat: word.cat_tr,
      meaning_tr: word.def_tr,
      meaning_en: word.def_en,
      note: 'Bu sözcük çekimsizdir (Indeclinabile). Cümle içinde herhangi bir hâl (casus), şahıs veya zaman eki almaz; sözlükte yer aldığı kök biçimiyle sabit olarak kullanılır.'
    };
  }

  // ==========================================================================
  // İSİM ÇEKİMİ ÜRETİCİSİ (NOUN DECLENSION)
  // ==========================================================================
  function generateNounDeclension(word) {
    const hw = word.headword || '';
    const lemma = word.lemma || '';
    const pe = (word.pos_en || '').trim();
    const isNeuter = hw.includes(' n.') || word.cat_tr?.includes('Nötr') || pe.includes('Neuter');

    // 1. Declinatio: -a, -ae (puella modeli)
    if (pe === 'Noun: 1st Declension' || hw.includes('-ae') || hw.includes(', -ae') || hw.includes(' -ae')) {
      const stem = lemma.replace(/a$/, '');
      return {
        type: 'noun_declension',
        title: `${hw} (1. Çekim - Declinatio I)`,
        modelName: '1. Çekim İsim (Model: puella, -ae f.)',
        groupDescription: 'Genetivus tekil eki -ae ile biten dişil/eril isimler.',
        gender: hw.includes(' m.') ? 'Masculīnum (Eril)' : 'Fēminīnum (Dişil)',
        forms: {
          nom: { sg: stem + 'a', pl: stem + 'ae' },
          voc: { sg: stem + 'a', pl: stem + 'ae' },
          gen: { sg: stem + 'ae', pl: stem + 'ārum' },
          dat: { sg: stem + 'ae', pl: stem + 'īs' },
          acc: { sg: stem + 'am', pl: stem + 'ās' },
          abl: { sg: stem + 'ā', pl: stem + 'īs' }
        },
        note: 'Ablativus tekil -ā uzundur. Çoğul Dativus ve Ablativus -īs alır.'
      };
    }

    // 2. Declinatio: -us / -er / -um (servus, puer, bellum modeli)
    if (pe === 'Noun: 2nd Declension' || hw.includes('-i ') || hw.includes('-ī') || hw.includes(' -i') || hw.includes(' -ī')) {
      // 2. Çekim Nötr (-um, -ī)
      if (isNeuter || lemma.endsWith('um') || hw.includes(' n.')) {
        const stem = lemma.replace(/um$/, '');
        return {
          type: 'noun_declension',
          title: `${hw} (2. Çekim Nötr - Declinatio II)`,
          modelName: '2. Çekim Nötr İsim (Model: bellum, -ī n.)',
          groupDescription: 'Genetivus tekili -ī ile biten nötr isimler.',
          gender: 'Neutrum (Nötr)',
          forms: {
            nom: { sg: stem + 'um', pl: stem + 'a' },
            voc: { sg: stem + 'um', pl: stem + 'a' },
            gen: { sg: stem + 'ī', pl: stem + 'ōrum' },
            dat: { sg: stem + 'ō', pl: stem + 'īs' },
            acc: { sg: stem + 'um', pl: stem + 'a' },
            abl: { sg: stem + 'ō', pl: stem + 'īs' }
          },
          note: 'Nötr kuralı: Nominativus, Vocativus ve Accusativus her zaman aynıdır; çoğulda daima -a ile biter.'
        };
      }

      // 2. Çekim -er (puer / ager)
      if (lemma.endsWith('er')) {
        let stem = lemma;
        const tokens = hw.replace(/[,;]/g, '').split(/\s+/);
        if (tokens.length > 1) {
          const genToken = tokens[1];
          if (genToken.endsWith('i') || genToken.endsWith('ī')) {
            stem = genToken.replace(/^-/, '').replace(/[iī]$/, '');
            if (genToken.startsWith('-')) {
              stem = lemma.slice(0, -2) + stem;
            }
          }
        }
        return {
          type: 'noun_declension',
          title: `${hw} (2. Çekim -er - Declinatio II)`,
          modelName: '2. Çekim -er İsim (Model: puer, puerī m. / ager, agrī m.)',
          groupDescription: 'Nominativus tekili -er ile biten eril isimler.',
          gender: 'Masculīnum (Eril)',
          forms: {
            nom: { sg: lemma, pl: stem + 'ī' },
            voc: { sg: lemma, pl: stem + 'ī' },
            gen: { sg: stem + 'ī', pl: stem + 'ōrum' },
            dat: { sg: stem + 'ō', pl: stem + 'īs' },
            acc: { sg: stem + 'um', pl: stem + 'ōs' },
            abl: { sg: stem + 'ō', pl: stem + 'īs' }
          },
          note: 'Vocativus tekil istisna olmadan Nominativus ile aynıdır (-er).'
        };
      }

      // 2. Çekim Standart -us (servus)
      const stem = lemma.replace(/us$/, '');
      return {
        type: 'noun_declension',
        title: `${hw} (2. Çekim -us - Declinatio II)`,
        modelName: '2. Çekim -us İsim (Model: servus, -ī m.)',
        groupDescription: 'Genetivus tekili -ī ile biten eril isimler.',
        gender: 'Masculīnum (Eril)',
        forms: {
          nom: { sg: stem + 'us', pl: stem + 'ī' },
          voc: { sg: stem + 'e', pl: stem + 'ī' },
          gen: { sg: stem + 'ī', pl: stem + 'ōrum' },
          dat: { sg: stem + 'ō', pl: stem + 'īs' },
          acc: { sg: stem + 'um', pl: stem + 'ōs' },
          abl: { sg: stem + 'ō', pl: stem + 'īs' }
        },
        note: 'Sadece 2. çekim -us isimlerinde Vocativus tekil -e ekini alır (serve!).'
      };
    }

    // 4. Declinatio: -ūs (fructus, cornū)
    if (pe === 'Noun: 4th Declension' || hw.includes('-us') || hw.includes('-ūs')) {
      const stem = lemma.replace(/(us|ū|u)$/, '');
      if (isNeuter || lemma.endsWith('u') || lemma.endsWith('ū')) {
        return {
          type: 'noun_declension',
          title: `${hw} (4. Çekim Nötr - Declinatio IV)`,
          modelName: '4. Çekim Nötr İsim (Model: cornū, -ūs n.)',
          groupDescription: 'Genetivus tekili -ūs ile biten nötr isimler.',
          gender: 'Neutrum (Nötr)',
          forms: {
            nom: { sg: stem + 'ū', pl: stem + 'ua' },
            voc: { sg: stem + 'ū', pl: stem + 'ua' },
            gen: { sg: stem + 'ūs', pl: stem + 'uum' },
            dat: { sg: stem + 'ū', pl: stem + 'ibus' },
            acc: { sg: stem + 'ū', pl: stem + 'ua' },
            abl: { sg: stem + 'ū', pl: stem + 'ibus' }
          },
          note: 'Tekilde Nom, Voc, Dativus, Accusativus, Ablativus genellikle -ū ile biter.'
        };
      }
      return {
        type: 'noun_declension',
        title: `${hw} (4. Çekim - Declinatio IV)`,
        modelName: '4. Çekim İsim (Model: fructus, -ūs m.)',
        groupDescription: 'Genetivus tekili -ūs ile biten eril/dişil isimler.',
        gender: hw.includes(' f.') ? 'Fēminīnum (Dişil)' : 'Masculīnum (Eril)',
        forms: {
          nom: { sg: stem + 'us', pl: stem + 'ūs' },
          voc: { sg: stem + 'us', pl: stem + 'ūs' },
          gen: { sg: stem + 'ūs', pl: stem + 'uum' },
          dat: { sg: stem + 'uī', pl: stem + 'ibus' },
          acc: { sg: stem + 'um', pl: stem + 'ūs' },
          abl: { sg: stem + 'ū', pl: stem + 'ibus' }
        },
        note: 'Genetivus tekil ve çoğul Nominativus/Vocativus/Accusativus -ūs uzundur.'
      };
    }

    // 5. Declinatio: -ēī / -eī (rēs, diēs)
    if (pe === 'Noun: 5th Declension' || hw.includes('-ei') || hw.includes('-ēī') || hw.includes('-eī') || hw.includes('diei') || hw.includes('rei')) {
      const stem = lemma.replace(/(ēs|es)$/, '');
      return {
        type: 'noun_declension',
        title: `${hw} (5. Çekim - Declinatio V)`,
        modelName: '5. Çekim İsim (Model: rēs, reī f. / diēs, diēī m.)',
        groupDescription: 'Genetivus tekili -ēī veya -eī ile biten isimler.',
        gender: hw.includes(' m.') ? 'Masculīnum / Fēminīnum' : 'Fēminīnum (Dişil)',
        forms: {
          nom: { sg: lemma, pl: stem + 'ēs' },
          voc: { sg: lemma, pl: stem + 'ēs' },
          gen: { sg: stem + 'eī', pl: stem + 'ērum' },
          dat: { sg: stem + 'eī', pl: stem + 'ēbus' },
          acc: { sg: stem + 'em', pl: stem + 'ēs' },
          abl: { sg: stem + 'ē', pl: stem + 'ēbus' }
        },
        note: '5. çekimde yalnızca rēs ve diēs çoğulda tam çekim tablosuna sahiptir.'
      };
    }

    // 3. Declinatio (Varsayılan 3. Çekim: Sessiz Kökler ve i-Kökleri)
    let stem = lemma;
    const tokens = hw.replace(/[,;]/g, '').split(/\s+/);
    if (tokens.length >= 2) {
      const genPart = tokens[1];
      if (/^[a-zA-Z\u0100-\u017F]+is$/i.test(genPart) && !genPart.startsWith('-')) {
        stem = genPart.replace(/is$/i, '');
      } else if (genPart.startsWith('-') && genPart.endsWith('is')) {
        const suf = genPart.slice(1, -2);
        if (suf === '') {
          stem = lemma.replace(/(is|e|ēs|es)$/, '');
        } else if (lemma.endsWith('us') || lemma.endsWith('ūs')) {
          stem = lemma.slice(0, -2) + suf;
        } else if (lemma.endsWith('es') || lemma.endsWith('ēs')) {
          stem = lemma.slice(0, -2) + suf;
        } else if (lemma.endsWith('en')) {
          stem = lemma.slice(0, -2) + suf;
        } else if (lemma.endsWith('o') || lemma.endsWith('ō')) {
          stem = lemma.slice(0, -1) + suf;
        } else if (lemma.endsWith('or') || lemma.endsWith('ōr')) {
          stem = lemma;
        } else {
          stem = lemma + suf;
        }
      }
    }

    // i-kökü kontrolü (eşheceliler, çift sessizle bitenler, nötr -e, -al, -ar)
    const isIStem = (lemma.endsWith('is') || lemma.endsWith('e') || /[bcdfghjklmnpqrstvwxz]{2}$/i.test(lemma)) && !hw.includes('corpor') && !hw.includes('tempor');
    const plGen = isIStem ? stem + 'ium' : stem + 'um';
    const plNomAccNeu = isIStem ? stem + 'ia' : stem + 'a';
    const ablSgNeu = isIStem ? stem + 'ī' : stem + 'e';

    if (isNeuter) {
      return {
        type: 'noun_declension',
        title: `${hw} (3. Çekim Nötr - Declinatio III)`,
        modelName: isIStem ? '3. Çekim i-Kökü Nötr (Model: mare, maris n.)' : '3. Çekim Sessiz Kök Nötr (Model: corpus, corporis n.)',
        groupDescription: 'Genetivus tekili -is ile biten 3. çekim nötr isimler.',
        gender: 'Neutrum (Nötr)',
        forms: {
          nom: { sg: lemma, pl: plNomAccNeu },
          voc: { sg: lemma, pl: plNomAccNeu },
          gen: { sg: stem + 'is', pl: plGen },
          dat: { sg: stem + 'ī', pl: stem + 'ibus' },
          acc: { sg: lemma, pl: plNomAccNeu },
          abl: { sg: ablSgNeu, pl: stem + 'ibus' }
        },
        note: isIStem
          ? 'i-kökü nötrlerde Ablativus tekil -ī, çoğul Nom/Acc -ia, çoğul Genetivus -ium olur.'
          : 'Sessiz kök nötrlerde çoğul Nom/Acc -a, çoğul Genetivus -um olur.'
      };
    }

    return {
      type: 'noun_declension',
      title: `${hw} (3. Çekim - Declinatio III)`,
      modelName: isIStem ? '3. Çekim i-Kökü (Model: cīvis, cīvis m./f. & urbs, urbis f.)' : '3. Çekim Sessiz Kök (Model: rēx, rēgis m.)',
      groupDescription: 'Genetivus tekili -is ile biten eril/dişil 3. çekim isimler.',
      gender: hw.includes(' f.') ? 'Fēminīnum (Dişil)' : 'Masculīnum (Eril)',
      forms: {
        nom: { sg: lemma, pl: stem + 'ēs' },
        voc: { sg: lemma, pl: stem + 'ēs' },
        gen: { sg: stem + 'is', pl: plGen },
        dat: { sg: stem + 'ī', pl: stem + 'ibus' },
        acc: { sg: stem + 'em', pl: isIStem ? `${stem}ēs (${stem}īs)` : stem + 'ēs' },
        abl: { sg: stem + 'e', pl: stem + 'ibus' }
      },
      note: isIStem
        ? 'Eş hece kuralına uyan veya çift sessizle biten i-köklerde çoğul Genetivus -ium olur.'
        : 'Sessiz köklerde çoğul Genetivus -um ile biter.'
    };
  }

  // ==========================================================================
  // SIFAT ÇEKİMİ ÜRETİCİSİ (ADJECTIVE DECLENSION)
  // ==========================================================================
  function generateAdjectiveDeclension(word) {
    const hw = word.headword || '';
    const lemma = word.lemma || '';
    const pe = (word.pos_en || '').trim();

    // 1./2. Sınıf Sıfatlar (-us, -a, -um veya -er, -a, -um)
    if (pe === 'Adjective: 1st and 2nd Declension' || hw.includes('-a, -um') || hw.includes('-a -um') || hw.includes('-um') || lemma.endsWith('us')) {
      let stem = lemma.replace(/us$/, '').replace(/er$/, '');
      const tokens = hw.split(/\s+/);
      if (lemma.endsWith('er') && tokens.length > 1) {
        stem = tokens[1].replace(/^-/, '').replace(/a$/, '');
      }

      return {
        type: 'adjective_declension',
        title: `${hw} (1. ve 2. Sınıf Sıfat)`,
        modelName: '1. ve 2. Sınıf Sıfat (Model: bonus, bona, bonum)',
        groupDescription: 'Eril: 2. çekim (-us), Dişil: 1. çekim (-a), Nötr: 2. çekim (-um).',
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

    // 3. Sınıf Sıfatlar - İki Sonlanışlı (-is, -e: omnis, omne)
    if (hw.includes('-e') || lemma.endsWith('is')) {
      const stem = lemma.replace(/is$/, '');
      return {
        type: 'adjective_declension',
        title: `${hw} (3. Sınıf Sıfat - İki Sonlanışlı)`,
        modelName: '3. Sınıf Sıfat (Model: omnis, omne)',
        groupDescription: 'Eril ve Dişil: -is, Nötr: -e (Tam i-Kökü Çekimi).',
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
        },
        note: '3. sınıf sıfatlarda Ablativus tekil tüm cinsiyetlerde -ī ile biter; çoğul Genetivus -ium olur.'
      };
    }

    // 3. Sınıf Sıfatlar - Tek Sonlanışlı (ingēns, ingentis / fēlīx, fēlīcis)
    let stem = lemma;
    const tokens = hw.replace(/[,;]/g, '').split(/\s+/);
    if (tokens.length >= 2 && tokens[1].endsWith('is')) {
      stem = tokens[1].replace(/is$/, '');
    } else {
      stem = lemma.replace(/s$/, 't').replace(/x$/, 'c');
    }

    return {
      type: 'adjective_declension',
      title: `${hw} (3. Sınıf Sıfat - Tek Sonlanışlı)`,
      modelName: '3. Sınıf Tek Sonlanışlı Sıfat (Model: ingēns, ingentis)',
      groupDescription: 'Tüm cinsiyetler için tek Nominativus formu (-ns, -x vb.).',
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
  // ZAMİR ÇEKİMİ ÜRETİCİSİ (PRONOUN DECLENSION)
  // ==========================================================================
  function generatePronounDeclension(word) {
    const lemma = normalizeLatin(word.lemma || '');

    if (lemma === 'is' || lemma === 'ea' || lemma === 'id') {
      return {
        type: 'adjective_declension',
        title: 'is, ea, id (İşaret / 3. Şahıs Zamiri)',
        modelName: 'İşaret Zamiri (Model: is, ea, id)',
        groupDescription: '3. Şahıs / İşaret Zamiri (o eril, o dişil, o nötr)',
        ...LATIN_REFERENCE_PARADIGMS.pronouns[0]
      };
    }

    if (lemma === 'qui' || lemma === 'quae' || lemma === 'quod') {
      return {
        type: 'adjective_declension',
        title: 'quī, quae, quod (İlgi Zamiri)',
        modelName: 'İlgi Zamiri (Model: quī, quae, quod)',
        groupDescription: 'Yan cümle bağlayan ilgi zamiri (Relative Pronoun)',
        ...LATIN_REFERENCE_PARADIGMS.pronouns[1]
      };
    }

    if (lemma === 'ego' || lemma === 'tu' || lemma === 'nos' || lemma === 'vos') {
      return {
        type: 'adjective_declension',
        title: 'Kişi Zamirleri (ego & tū)',
        modelName: 'Kişi Zamirleri (Model: ego / tū)',
        groupDescription: '1. ve 2. Şahıs Kişi Zamirleri (ben ve sen)',
        ...LATIN_REFERENCE_PARADIGMS.pronouns[2]
      };
    }

    // Genel zamir fallback
    return generateAdjectiveDeclension(word);
  }

  // ==========================================================================
  // FİİL ÇEKİMİ ÜRETİCİSİ (VERB CONJUGATION)
  // ==========================================================================
  function generateVerbConjugation(word) {
    const hw = word.headword || '';
    const lemma = word.lemma || '';
    const pe = (word.pos_en || '').trim();
    const normLemma = normalizeLatin(lemma);
    const parts = parseVerbPrincipalParts(hw, lemma);

    // 1. DÜZENSİZ FİİLLER VE BİLEŞİKLERİ
    // A) sum ve bileşikleri (adsum, absum, desum, prosum, possum, supersum, intersum)
    if (normLemma === 'sum' || hw.includes('esse fui') || hw.includes('esse fuī')) {
      const p = LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_sum');
      return {
        type: 'verb_conjugation',
        title: `${hw} (Düzensiz Fiil)`,
        modelName: 'Düzensiz Fiil (Model: sum, esse, fuī)',
        groupDescription: 'Yardımcı ve Varlık Fiili (esse)',
        parts,
        tenses: p.tenses
      };
    }

    if (normLemma === 'possum' || hw.includes('posse potui') || hw.includes('posse potuī')) {
      const p = LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_possum');
      return {
        type: 'verb_conjugation',
        title: `${hw} (Düzensiz Fiil)`,
        modelName: 'Düzensiz Fiil (Model: possum, posse, potuī)',
        groupDescription: 'İktidar ve Yetenek Fiili (-ebilmek)',
        parts,
        tenses: p.tenses
      };
    }

    // sum bileşikleri: adsum, absum, desum, prosum, supersum, intersum
    const sumCompounds = ['adsum', 'absum', 'desum', 'prosum', 'supersum', 'intersum'];
    for (const sc of sumCompounds) {
      if (normLemma === sc || hw.startsWith(sc)) {
        let pref = sc.replace(/sum$/, '');
        let p1s = sc, p2s = pref + 'es', p3s = pref + 'est', p1p = pref + 'sumus', p2p = pref + 'estis', p3p = pref + 'sunt';
        let imp1 = pref + 'eram', fut1 = pref + 'erō';

        // prosum istisnası (sesli harf öncesinde prod- olur)
        if (sc === 'prosum') {
          p2s = 'prōdes'; p3s = 'prōdest'; p2p = 'prōdestis';
          imp1 = 'prōderam'; fut1 = 'prōderō';
        }

        const perfBase = parts.perf ? parts.perf.replace(/[iī]$/, '') : (pref + 'fu');
        return {
          type: 'verb_conjugation',
          title: `${hw} (sum Bileşiği Fiil)`,
          modelName: 'sum Bileşiği (Model: sum, esse, fuī)',
          groupDescription: 'Ön ek almış düzensiz sum bileşiği.',
          parts,
          tenses: {
            praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s, p2s, p3s, p1p, p2p, p3p },
            imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: imp1, p2s: imp1.slice(0, -1) + 's', p3s: imp1.slice(0, -1) + 't', p1p: imp1.slice(0, -1) + 'mus', p2p: imp1.slice(0, -1) + 'tis', p3p: imp1.slice(0, -1) + 'nt' },
            futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: fut1, p2s: fut1.slice(0, -1) + 'is', p3s: fut1.slice(0, -1) + 'it', p1p: fut1.slice(0, -1) + 'imus', p2p: fut1.slice(0, -1) + 'itis', p3p: fut1.slice(0, -1) + 'unt' },
            perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: perfBase + 'ī', p2s: perfBase + 'istī', p3s: perfBase + 'it', p1p: perfBase + 'imus', p2p: perfBase + 'istis', p3p: perfBase + 'ērunt' },
            plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: perfBase + 'eram', p2s: perfBase + 'erās', p3s: perfBase + 'erat', p1p: perfBase + 'erāmus', p2p: perfBase + 'erātis', p3p: perfBase + 'erant' },
            futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: perfBase + 'erō', p2s: perfBase + 'eris', p3s: perfBase + 'erit', p1p: perfBase + 'erimus', p2p: perfBase + 'eritis', p3p: perfBase + 'erint' }
          }
        };
      }
    }

    // B) ferō ve bileşikleri (refero, affero, aufero, confero, infero, defero, offero, differo)
    const isFeroCompound = normLemma === 'fero' || normLemma.endsWith('fero');
    if (isFeroCompound) {
      const pref = normLemma === 'fero' ? '' : normLemma.replace(/fero$/, '');
      const perfBase = parts.perf ? parts.perf.replace(/[iī]$/, '') : (pref + 'tul');
      return {
        type: 'verb_conjugation',
        title: `${hw} (ferō ve Bileşikleri)`,
        modelName: 'Düzensiz Fiil (Model: ferō, ferre, tulī, lātum)',
        groupDescription: 'Kökten değişen düzensiz fiil çekimi.',
        parts,
        tenses: {
          praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s: pref + 'ferō', p2s: pref + 'fers', p3s: pref + 'fert', p1p: pref + 'ferimus', p2p: pref + 'fertis', p3p: pref + 'ferunt' },
          imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: pref + 'ferēbam', p2s: pref + 'ferēbās', p3s: pref + 'ferēbat', p1p: pref + 'ferēbāmus', p2p: pref + 'ferēbātis', p3p: pref + 'ferēbant' },
          futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: pref + 'feram', p2s: pref + 'ferēs', p3s: pref + 'feret', p1p: pref + 'ferēmus', p2p: pref + 'ferētis', p3p: pref + 'ferent' },
          perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: perfBase + 'ī', p2s: perfBase + 'istī', p3s: perfBase + 'it', p1p: perfBase + 'imus', p2p: perfBase + 'istis', p3p: perfBase + 'ērunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: perfBase + 'eram', p2s: perfBase + 'erās', p3s: perfBase + 'erat', p1p: perfBase + 'erāmus', p2p: perfBase + 'erātis', p3p: perfBase + 'erant' },
          futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: perfBase + 'erō', p2s: perfBase + 'eris', p3s: perfBase + 'erit', p1p: perfBase + 'erimus', p2p: perfBase + 'eritis', p3p: perfBase + 'erint' }
        }
      };
    }

    // C) eō ve bileşikleri (redeo, pereo, transeo, subeo, abeo, adeo, exeo)
    const isEoCompound = normLemma === 'eo' || normLemma.endsWith('eo') && pe.includes('Irregular');
    if (isEoCompound) {
      const pref = normLemma === 'eo' ? '' : normLemma.replace(/eo$/, '');
      const perfBase = parts.perf ? parts.perf.replace(/[iī]$/, '') : (pref + 'i');
      return {
        type: 'verb_conjugation',
        title: `${hw} (eō ve Bileşikleri)`,
        modelName: 'Düzensiz Fiil (Model: eō, īre, iī, itum)',
        groupDescription: 'Kökten değişen düzensiz gitmek fiili ve bileşikleri.',
        parts,
        tenses: {
          praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s: pref + 'eō', p2s: pref + 'īs', p3s: pref + 'it', p1p: pref + 'īmus', p2p: pref + 'ītis', p3p: pref + 'eunt' },
          imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: pref + 'ībam', p2s: pref + 'ībās', p3s: pref + 'ībat', p1p: pref + 'ībāmus', p2p: pref + 'ībātis', p3p: pref + 'ībant' },
          futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: pref + 'ībō', p2s: pref + 'ībis', p3s: pref + 'ībit', p1p: pref + 'ībimus', p2p: pref + 'ībitis', p3p: pref + 'ībunt' },
          perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: perfBase + 'ī', p2s: perfBase + 'stī', p3s: perfBase + 'it', p1p: perfBase + 'imus', p2p: perfBase + 'stis', p3p: perfBase + 'ērunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: perfBase + 'eram', p2s: perfBase + 'erās', p3s: perfBase + 'erat', p1p: perfBase + 'erāmus', p2p: perfBase + 'erātis', p3p: perfBase + 'erant' },
          futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: perfBase + 'erō', p2s: perfBase + 'eris', p3s: perfBase + 'erit', p1p: perfBase + 'erimus', p2p: perfBase + 'eritis', p3p: perfBase + 'erint' }
        }
      };
    }

    // D) volō, nōlō, mālō
    if (normLemma === 'volo' || normLemma === 'nolo' || normLemma === 'malo') {
      if (normLemma === 'volo') {
        const p = LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_volo');
        return { type: 'verb_conjugation', title: `${hw}`, modelName: 'Düzensiz Fiil (Model: volō, velle, voluī)', groupDescription: 'İstemek Fiili', parts, tenses: p.tenses };
      }
      if (normLemma === 'nolo') {
        return {
          type: 'verb_conjugation',
          title: `${hw} (Düzensiz Fiil: nōlō)`,
          modelName: 'Düzensiz Fiil (Model: nōlō, nōlle, nōluī)',
          groupDescription: 'İstememek Fiili (nōn + volō)',
          parts,
          tenses: {
            praesens_act: { name: 'Praesens', p1s: 'nōlō', p2s: 'nōn vīs', p3s: 'nōn vult', p1p: 'nōlumus', p2p: 'nōn vultis', p3p: 'nōlunt' },
            imperfectum_act: { name: 'Imperfectum', p1s: 'nōlēbam', p2s: 'nōlēbās', p3s: 'nōlēbat', p1p: 'nōlēbāmus', p2p: 'nōlēbātis', p3p: 'nōlēbant' },
            futurum_act: { name: 'Futurum I', p1s: 'nōlam', p2s: 'nōlēs', p3s: 'nōlet', p1p: 'nōlēmus', p2p: 'nōlētis', p3p: 'nōlent' },
            perfectum_act: { name: 'Perfectum', p1s: 'nōluī', p2s: 'nōluistī', p3s: 'nōluit', p1p: 'nōluimus', p2p: 'nōluistis', p3p: 'nōluērunt' },
            plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'nōlueram', p2s: 'nōluerās', p3s: 'nōluerat', p1p: 'nōluerāmus', p2p: 'nōluerātis', p3p: 'nōluerant' },
            futurum_perf_act: { name: 'Futurum II', p1s: 'nōluerō', p2s: 'nōlueris', p3s: 'nōluerit', p1p: 'nōluerimus', p2p: 'nōlueritis', p3p: 'nōluerint' }
          }
        };
      }
      if (normLemma === 'malo') {
        return {
          type: 'verb_conjugation',
          title: `${hw} (Düzensiz Fiil: mālō)`,
          modelName: 'Düzensiz Fiil (Model: mālō, mālle, māluī)',
          groupDescription: 'Yeğlemek / Tercih Etmek Fiili (magis + volō)',
          parts,
          tenses: {
            praesens_act: { name: 'Praesens', p1s: 'mālō', p2s: 'māvīs', p3s: 'māvult', p1p: 'mālumus', p2p: 'māvultis', p3p: 'mālunt' },
            imperfectum_act: { name: 'Imperfectum', p1s: 'mālēbam', p2s: 'mālēbās', p3s: 'mālēbat', p1p: 'mālēbāmus', p2p: 'mālēbātis', p3p: 'mālēbant' },
            futurum_act: { name: 'Futurum I', p1s: 'mālam', p2s: 'mālēs', p3s: 'mālet', p1p: 'mālēmus', p2p: 'mālētis', p3p: 'mālent' },
            perfectum_act: { name: 'Perfectum', p1s: 'māluī', p2s: 'māluistī', p3s: 'māluit', p1p: 'māluimus', p2p: 'māluistis', p3p: 'māluērunt' },
            plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'mālueram', p2s: 'māluerās', p3s: 'māluerat', p1p: 'māluerāmus', p2p: 'māluerātis', p3p: 'māluerant' },
            futurum_perf_act: { name: 'Futurum II', p1s: 'māluerō', p2s: 'mālueris', p3s: 'māluerit', p1p: 'māluerimus', p2p: 'mālueritis', p3p: 'māluerint' }
          }
        };
      }
    }

    // E) fīō (fīō, fierī, factus sum)
    if (normLemma === 'fio') {
      return {
        type: 'verb_conjugation',
        title: `${hw} (Yarı Deponent / Düzensiz Fiil)`,
        modelName: 'Düzensiz Fiil (Model: fīō, fierī, factus sum)',
        groupDescription: 'Olmak / Edilgen Yapılmak Fiili (faciō fiilinin edilgeni gibi işler)',
        parts,
        tenses: {
          praesens_act: { name: 'Praesens', p1s: 'fīō', p2s: 'fīs', p3s: 'fit', p1p: 'fīmus', p2p: 'fītis', p3p: 'fīunt' },
          imperfectum_act: { name: 'Imperfectum', p1s: 'fīēbam', p2s: 'fīēbās', p3s: 'fīēbat', p1p: 'fīēbāmus', p2p: 'fīēbātis', p3p: 'fīēbant' },
          futurum_act: { name: 'Futurum I', p1s: 'fīam', p2s: 'fīēs', p3s: 'fīet', p1p: 'fīēmus', p2p: 'fīētis', p3p: 'fīent' },
          perfectum_act: { name: 'Perfectum', p1s: 'factus sum', p2s: 'factus es', p3s: 'factus est', p1p: 'factī sumus', p2p: 'factī estis', p3p: 'factī sunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum', p1s: 'factus eram', p2s: 'factus erās', p3s: 'factus erat', p1p: 'factī erāmus', p2p: 'factī erātis', p3p: 'factī erant' },
          futurum_perf_act: { name: 'Futurum II', p1s: 'factus erō', p2s: 'factus eris', p3s: 'factus erit', p1p: 'factī erimus', p2p: 'factī eritis', p3p: 'factī erunt' }
        }
      };
    }

    // F) Defective / Yalnızca Perfectum kökü olan fiiller (coepī, meminī, ōdī)
    if (normLemma === 'coepi' || normLemma === 'memini' || normLemma === 'odi') {
      const perfBase = normLemma;
      return {
        type: 'verb_conjugation',
        title: `${hw} (Eksik / Defective Fiil)`,
        modelName: `Eksik Fiil (Model: ${lemma})`,
        groupDescription: 'Praesens sistemi bulunmaz; Perfectum kökü şimdiki zaman anlamı taşır.',
        parts,
        tenses: {
          perfectum_act: { name: 'Perfectum (Praesens Anlamlı)', p1s: perfBase + 'ī', p2s: perfBase + 'istī', p3s: perfBase + 'it', p1p: perfBase + 'imus', p2p: perfBase + 'istis', p3p: perfBase + 'ērunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum (Geçmiş Zaman Anlamlı)', p1s: perfBase + 'eram', p2s: perfBase + 'erās', p3s: perfBase + 'erat', p1p: perfBase + 'erāmus', p2p: perfBase + 'erātis', p3p: perfBase + 'erant' },
          futurum_perf_act: { name: 'Futurum II (Gelecek Zaman Anlamlı)', p1s: perfBase + 'erō', p2s: perfBase + 'eris', p3s: perfBase + 'erit', p1p: perfBase + 'erimus', p2p: perfBase + 'eritis', p3p: perfBase + 'erint' }
        },
        note: 'Klasik filolojide "Verba Defectīva" olarak adlandırılır. Praesens gövdesi yoktur; perfectum kökleri şimdiki zaman gibi tercüme edilir (örn: ōdī = nefret ediyorum).'
      };
    }

    // G) YARI DEPONENT FİİLLER (audeō, gaudeō)
    // Praesens sistemi: ETKEN (-ō, -s, -t, -mus, -tis, -nt)
    // Perfectum sistemi: EDİLGEN BİÇİM (-us sum)
    if (normLemma === 'audeo' || normLemma === 'gaudeo') {
      const isGaud = normLemma === 'gaudeo';
      const base = isGaud ? 'gaud' : 'aud';
      const perfPart = isGaud ? 'gāvīsus' : 'ausus';
      return {
        type: 'verb_conjugation',
        title: `${hw} (Yarı Deponent Fiil - Verbum Semidēpōnēns)`,
        modelName: `Yarı Deponent Fiil (Model: ${isGaud ? 'gaudeō, gaudēre, gāvīsus sum' : 'audeō, audēre, ausus sum'})`,
        groupDescription: 'Praesens sistemi etken (-ō, -s, -t...), Perfectum sistemi ise edilgen biçimli ve etken anlamlıdır (-us sum).',
        parts,
        tenses: {
          praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s: base + 'eō', p2s: base + 'ēs', p3s: base + 'et', p1p: base + 'ēmus', p2p: base + 'ētis', p3p: base + 'ent' },
          imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: base + 'ēbam', p2s: base + 'ēbās', p3s: base + 'ēbat', p1p: base + 'ēbāmus', p2p: base + 'ēbātis', p3p: base + 'ēbant' },
          futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: base + 'ēbō', p2s: base + 'ēbis', p3s: base + 'ēbit', p1p: base + 'ēbimus', p2p: base + 'ēbitis', p3p: base + 'ēbunt' },
          perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: perfPart + ' sum', p2s: perfPart + ' es', p3s: perfPart + ' est', p1p: perfPart.replace(/us$/, 'ī') + ' sumus', p2p: perfPart.replace(/us$/, 'ī') + ' estis', p3p: perfPart.replace(/us$/, 'ī') + ' sunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: perfPart + ' eram', p2s: perfPart + ' erās', p3s: perfPart + ' erat', p1p: perfPart.replace(/us$/, 'ī') + ' erāmus', p2p: perfPart.replace(/us$/, 'ī') + ' erātis', p3p: perfPart.replace(/us$/, 'ī') + ' erant' },
          futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: perfPart + ' erō', p2s: perfPart + ' eris', p3s: perfPart + ' erit', p1p: perfPart.replace(/us$/, 'ī') + ' erimus', p2p: perfPart.replace(/us$/, 'ī') + ' eritis', p3p: perfPart.replace(/us$/, 'ī') + ' erunt' }
        },
        note: 'Yarı deponent fiillerin Praesens gövdesi kurallı 2. çekim etken eklerini alır (-eō, -ēs, -et, -ēmus, -ētis, -ent). Sadece Perfectum gövdesi edilgen yapılıdır ve etken tercüme edilir.'
      };
    }

    // 2. DEPONENT FİİLLER (Biçimce Edilgen, Anlamca Etken)
    // SADECE ve SADECE pos_en === 'Verb: Deponent' olan gerçek deponent fiiller!
    // (Supinum eki -sum olan etken fiiller asla deponent yapılmaz!)
    const isDeponent = pe === 'Verb: Deponent';
    if (isDeponent) {
      let depGroup = 3;
      let model = 'sequor, sequī, secūtus sum';

      if (hw.includes('ari') || hw.includes('ārī') || hw.includes(' -ari')) {
        depGroup = 1;
        model = 'cōnor, cōnārī, cōnātus sum (1. Çekim Deponent)';
      } else if (hw.includes('eri') || hw.includes('ērī') || hw.includes(' -eri') || lemma.endsWith('eor')) {
        depGroup = 2;
        model = 'vereor, verērī, veritus sum (2. Çekim Deponent)';
      } else if (hw.includes('iri') || hw.includes('īrī') || hw.includes(' -iri') || lemma === 'orior' || lemma === 'experior') {
        depGroup = 4;
        model = 'orior, orīrī, ortus sum / experior (4. Çekim Deponent)';
      } else if (lemma.endsWith('ior')) {
        depGroup = 35;
        model = 'patior, patī, passus sum (3. Çekim -ior Deponent)';
      } else {
        depGroup = 3;
        model = 'sequor, sequī, secūtus sum (3. Çekim Deponent)';
      }

      const baseStem = lemma.replace(/ior$/, '').replace(/eor$/, '').replace(/or$/, '');
      const perfPart = parts.perf ? parts.perf.replace(/\s+sum$/, '') : (baseStem + 't');

      let p1s = lemma, p2s = '', p3s = '', p1p = '', p2p = '', p3p = '';
      let imp1s = '', imp2s = '', imp3s = '', imp1p = '', imp2p = '', imp3p = '';
      let fut1s = '', fut2s = '', fut3s = '', fut1p = '', fut2p = '', fut3p = '';

      if (depGroup === 1) {
        // 1. Çekim Deponent (cōnor, cōnārī)
        p2s = baseStem + 'āris'; p3s = baseStem + 'ātur'; p1p = baseStem + 'āmur'; p2p = baseStem + 'āminī'; p3p = baseStem + 'antur';
        imp1s = baseStem + 'ābar'; imp2s = baseStem + 'ābāris'; imp3s = baseStem + 'ābātur'; imp1p = baseStem + 'ābāmur'; imp2p = baseStem + 'ābāminī'; imp3p = baseStem + 'ābantur';
        fut1s = baseStem + 'ābor'; fut2s = baseStem + 'āberis'; fut3s = baseStem + 'ābitur'; fut1p = baseStem + 'ābimur'; fut2p = baseStem + 'ābiminī'; fut3p = baseStem + 'ābuntur';
      } else if (depGroup === 2) {
        // 2. Çekim Deponent (vereor, verērī)
        p2s = baseStem + 'ēris'; p3s = baseStem + 'ētur'; p1p = baseStem + 'ēmur'; p2p = baseStem + 'ēminī'; p3p = baseStem + 'entur';
        imp1s = baseStem + 'ēbar'; imp2s = baseStem + 'ēbāris'; imp3s = baseStem + 'ēbātur'; imp1p = baseStem + 'ēbāmur'; imp2p = baseStem + 'ēbāminī'; imp3p = baseStem + 'ēbantur';
        fut1s = baseStem + 'ēbor'; fut2s = baseStem + 'ēberis'; fut3s = baseStem + 'ēbitur'; fut1p = baseStem + 'ēbimur'; fut2p = baseStem + 'ēbiminī'; fut3p = baseStem + 'ēbuntur';
      } else if (depGroup === 3) {
        // 3. Çekim Deponent (sequor, sequī)
        p2s = baseStem + 'eris'; p3s = baseStem + 'itur'; p1p = baseStem + 'imur'; p2p = baseStem + 'iminī'; p3p = baseStem + 'untur';
        imp1s = baseStem + 'ēbar'; imp2s = baseStem + 'ēbāris'; imp3s = baseStem + 'ēbātur'; imp1p = baseStem + 'ēbāmur'; imp2p = baseStem + 'ēbāminī'; imp3p = baseStem + 'ēbantur';
        fut1s = baseStem + 'ar'; fut2s = baseStem + 'ēris'; fut3s = baseStem + 'ētur'; fut1p = baseStem + 'ēmur'; fut2p = baseStem + 'ēminī'; fut3p = baseStem + 'entur';
      } else if (depGroup === 35) {
        // 3. Çekim -ior Deponent (patior, patī)
        p2s = baseStem + 'eris'; p3s = baseStem + 'itur'; p1p = baseStem + 'imur'; p2p = baseStem + 'iminī'; p3p = baseStem + 'iuntur';
        imp1s = baseStem + 'iēbar'; imp2s = baseStem + 'iēbāris'; imp3s = baseStem + 'iēbātur'; imp1p = baseStem + 'iēbāmur'; imp2p = baseStem + 'iēbāminī'; imp3p = baseStem + 'iēbantur';
        fut1s = baseStem + 'iar'; fut2s = baseStem + 'iēris'; fut3s = baseStem + 'iētur'; fut1p = baseStem + 'iēmur'; fut2p = baseStem + 'iēminī'; fut3p = baseStem + 'ientur';
      } else {
        // 4. Çekim Deponent (orior, orīrī)
        p2s = baseStem + 'īris'; p3s = baseStem + 'ītur'; p1p = baseStem + 'īmur'; p2p = baseStem + 'īminī'; p3p = baseStem + 'iuntur';
        imp1s = baseStem + 'iēbar'; imp2s = baseStem + 'iēbāris'; imp3s = baseStem + 'iēbātur'; imp1p = baseStem + 'iēbāmur'; imp2p = baseStem + 'iēbāminī'; imp3p = baseStem + 'iēbantur';
        fut1s = baseStem + 'iar'; fut2s = baseStem + 'iēris'; fut3s = baseStem + 'iētur'; fut1p = baseStem + 'iēmur'; fut2p = baseStem + 'iēminī'; fut3p = baseStem + 'ientur';
      }

      return {
        type: 'verb_conjugation',
        title: `${hw} (Deponent Fiil)`,
        modelName: `Deponent Fiil (Model: ${model})`,
        groupDescription: 'Biçimce Edilgen (Passīvum), Anlamca Etken (Actīvum).',
        parts,
        tenses: {
          praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s, p2s, p3s, p1p, p2p, p3p },
          imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: imp1s, p2s: imp2s, p3s: imp3s, p1p: imp1p, p2p: imp2p, p3p: imp3p },
          futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: fut1s, p2s: fut2s, p3s: fut3s, p1p: fut1p, p2p: fut2p, p3p: fut3p },
          perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: perfPart + ' sum', p2s: perfPart + ' es', p3s: perfPart + ' est', p1p: perfPart.replace(/us$/, 'ī') + ' sumus', p2p: perfPart.replace(/us$/, 'ī') + ' estis', p3p: perfPart.replace(/us$/, 'ī') + ' sunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: perfPart + ' us eram', p2s: perfPart + ' us erās', p3s: perfPart + ' us erat', p1p: perfPart.replace(/us$/, 'ī') + ' erāmus', p2p: perfPart.replace(/us$/, 'ī') + ' erātis', p3p: perfPart.replace(/us$/, 'ī') + ' erant' },
          futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: perfPart + ' us erō', p2s: perfPart + ' us eris', p3s: perfPart + ' us erit', p1p: perfPart.replace(/us$/, 'ī') + ' erimus', p2p: perfPart.replace(/us$/, 'ī') + ' eritis', p3p: perfPart.replace(/us$/, 'ī') + ' erunt' }
        },
        note: 'Deponent fiiller biçimce edilgen sonlanışlar almalarına rağmen daima etken olarak çevrilir.'
      };
    }

    // 3. STANDART ETKEN FİİLLER (1-4 CONIUGATIO)
    let conjGroup = 1;
    let modelName = '1. Çekim Fiil (Model: amō, amāre, amāvī, amātum)';
    let groupDescription = '1. Çekim (-āre) düzenli etken fiil çekimi.';

    if (pe === 'Verb: 2nd Conjugation' || hw.includes('ēre') || hw.includes('-ēre') || hw.includes(' -ere') && lemma.endsWith('eo')) {
      conjGroup = 2;
      modelName = '2. Çekim Fiil (Model: habeō, habēre / videō, vidēre)';
      groupDescription = '2. Çekim (-ēre) etken fiil çekimi.';
    } else if (pe === 'Verb: 3rd Conjugation -io' || (pe.includes('3rd') && lemma.endsWith('io'))) {
      conjGroup = 35;
      modelName = '3. Çekim -iō Fiil (Model: capiō, capere, cēpī, captum)';
      groupDescription = '3. Çekim -iō karma etken fiil çekimi.';
    } else if (pe === 'Verb: 3rd Conjugation -o' || pe === 'Verb: 3rd Conjugation' || hw.includes('ere') || hw.includes('-ere')) {
      conjGroup = 3;
      modelName = '3. Çekim Fiil (Model: dīcō, dīcere / legō, legere)';
      groupDescription = '3. Çekim (-ere) konsonant kök etken fiil çekimi.';
    } else if (pe === 'Verb: 4th Conjugation' || hw.includes('īre') || hw.includes('-īre')) {
      conjGroup = 4;
      modelName = '4. Çekim Fiil (Model: audiō, audīre, audīvī, audītum)';
      groupDescription = '4. Çekim (-īre) saf i-kökü etken fiil çekimi.';
    }

    // Köklerin tespiti
    const cleanRaw = lemma.replace(/[oō]$/, '');

    // Perfectum kökünü 3. parçadan çıkar
    let perfStem = '';
    if (parts.perf) {
      perfStem = parts.perf.replace(/[iī]$/, '');
    } else {
      // Fallback
      if (conjGroup === 1) perfStem = cleanRaw + 'āv';
      else if (conjGroup === 2) perfStem = cleanRaw.replace(/e$/, '') + 'u';
      else if (conjGroup === 4) perfStem = cleanRaw + 'īv';
      else perfStem = cleanRaw + 's';
    }

    let p1s = lemma, p2s = '', p3s = '', p1p = '', p2p = '', p3p = '';
    let imp1s = '', imp2s = '', imp3s = '', imp1p = '', imp2p = '', imp3p = '';
    let fut1s = '', fut2s = '', fut3s = '', fut1p = '', fut2p = '', fut3p = '';

    if (conjGroup === 1) {
      // 1. Çekim (amō, amāre)
      p2s = cleanRaw + 'ās'; p3s = cleanRaw + 'at'; p1p = cleanRaw + 'āmus'; p2p = cleanRaw + 'ātis'; p3p = cleanRaw + 'ant';
      imp1s = cleanRaw + 'ābam'; imp2s = cleanRaw + 'ābās'; imp3s = cleanRaw + 'ābat'; imp1p = cleanRaw + 'ābāmus'; imp2p = cleanRaw + 'ābātis'; imp3p = cleanRaw + 'ābant';
      fut1s = cleanRaw + 'ābō'; fut2s = cleanRaw + 'ābis'; fut3s = cleanRaw + 'ābit'; fut1p = cleanRaw + 'ābimus'; fut2p = cleanRaw + 'ābitis'; fut3p = cleanRaw + 'ābunt';
    } else if (conjGroup === 2) {
      // 2. Çekim (videō, vidēre) - cleanRaw 'vide'
      const base2 = cleanRaw.endsWith('e') ? cleanRaw.slice(0, -1) : cleanRaw;
      p1s = base2 + 'eō'; p2s = base2 + 'ēs'; p3s = base2 + 'et'; p1p = base2 + 'ēmus'; p2p = base2 + 'ētis'; p3p = base2 + 'ent';
      imp1s = base2 + 'ēbam'; imp2s = base2 + 'ēbās'; imp3s = base2 + 'ēbat'; imp1p = base2 + 'ēbāmus'; imp2p = base2 + 'ēbātis'; imp3p = base2 + 'ēbant';
      fut1s = base2 + 'ēbō'; fut2s = base2 + 'ēbis'; fut3s = base2 + 'ēbit'; fut1p = base2 + 'ēbimus'; fut2p = base2 + 'ēbitis'; fut3p = base2 + 'ēbunt';
    } else if (conjGroup === 3) {
      // 3. Çekim -o (dīcō, dīcere)
      p2s = cleanRaw + 'is'; p3s = cleanRaw + 'it'; p1p = cleanRaw + 'imus'; p2p = cleanRaw + 'itis'; p3p = cleanRaw + 'unt';
      imp1s = cleanRaw + 'ēbam'; imp2s = cleanRaw + 'ēbās'; imp3s = cleanRaw + 'ēbat'; imp1p = cleanRaw + 'ēbāmus'; imp2p = cleanRaw + 'ēbātis'; imp3p = cleanRaw + 'ēbant';
      fut1s = cleanRaw + 'am'; fut2s = cleanRaw + 'ēs'; fut3s = cleanRaw + 'et'; fut1p = cleanRaw + 'ēmus'; fut2p = cleanRaw + 'ētis'; fut3p = cleanRaw + 'ent';
    } else if (conjGroup === 35) {
      // 3. Çekim -io (capiō, capere)
      const consStem = cleanRaw.replace(/i$/, '');
      p1s = consStem + 'iō'; p2s = consStem + 'is'; p3s = consStem + 'it'; p1p = consStem + 'imus'; p2p = consStem + 'itis'; p3p = consStem + 'iunt';
      imp1s = consStem + 'iēbam'; imp2s = consStem + 'iēbās'; imp3s = consStem + 'iēbat'; imp1p = consStem + 'iēbāmus'; imp2p = consStem + 'iēbātis'; imp3p = consStem + 'iēbant';
      fut1s = consStem + 'iam'; fut2s = consStem + 'iēs'; fut3s = consStem + 'iet'; fut1p = consStem + 'iēmus'; fut2p = consStem + 'iētis'; fut3p = consStem + 'ient';
    } else {
      // 4. Çekim (audiō, audīre)
      const consStem = cleanRaw.replace(/i$/, '');
      p1s = consStem + 'iō'; p2s = consStem + 'īs'; p3s = consStem + 'it'; p1p = consStem + 'īmus'; p2p = consStem + 'ītis'; p3p = consStem + 'iunt';
      imp1s = consStem + 'iēbam'; imp2s = consStem + 'iēbās'; imp3s = consStem + 'iēbat'; imp1p = consStem + 'iēbāmus'; imp2p = consStem + 'iēbātis'; imp3p = consStem + 'iēbant';
      fut1s = consStem + 'iam'; fut2s = consStem + 'iēs'; fut3s = consStem + 'iet'; fut1p = consStem + 'iēmus'; fut2p = consStem + 'iētis'; fut3p = consStem + 'ient';
    }

    return {
      type: 'verb_conjugation',
      title: `${hw}`,
      modelName,
      groupDescription,
      parts,
      tenses: {
        praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s, p2s, p3s, p1p, p2p, p3p },
        imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: imp1s, p2s: imp2s, p3s: imp3s, p1p: imp1p, p2p: imp2p, p3p: imp3p },
        futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: fut1s, p2s: fut2s, p3s: fut3s, p1p: fut1p, p2p: fut2p, p3p: fut3p },
        perfectum_act: { name: 'Perfectum (Görülen / Tamamlanmış Geçmiş: -di)', p1s: perfStem + 'ī', p2s: perfStem + 'istī', p3s: perfStem + 'it', p1p: perfStem + 'imus', p2p: perfStem + 'istis', p3p: perfStem + 'ērunt' },
        plusquamperfectum_act: { name: 'Plusquamperfectum (Öncelikli Geçmiş: -mişti)', p1s: perfStem + 'eram', p2s: perfStem + 'erās', p3s: perfStem + 'erat', p1p: perfStem + 'erāmus', p2p: perfStem + 'erātis', p3p: perfStem + 'erant' },
        futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: perfStem + 'erō', p2s: perfStem + 'eris', p3s: perfStem + 'erit', p1p: perfStem + 'erimus', p2p: perfStem + 'eritis', p3p: perfStem + 'erint' }
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

    // Model Bilgi Bannerı (Tüm çekimli türler için standart)
    const modelBannerHtml = `
      <div class="paradigm-model-banner">
        <div class="paradigm-model-info">
          <span class="paradigm-model-title">🏛️ Ait Olduğu Model Paradigma</span>
          <span class="paradigm-model-name">${data.modelName || 'Klasik Latin Çekim Modeli'}</span>
        </div>
        <span class="tag-badge pos-tag">${word.pos_tr || data.gender}</span>
      </div>
    `;

    // Fiiller için 4 Temel Parça Kutusu
    const verbPartsHtml = data.parts ? `
      <div class="verb-parts-container">
        <div class="verb-parts-header">📋 4 Temel Sözlük Parçası (Partēs Prīncipālēs)</div>
        <div class="verb-parts-grid">
          <div class="verb-part-item">
            <span class="part-label">1. Praesens (1. Tekil):</span>
            <span class="part-val latin-text">${data.parts.pres || '-'}</span>
          </div>
          <div class="verb-part-item">
            <span class="part-label">2. Infinitivus (Mastar):</span>
            <span class="part-val latin-text">${data.parts.inf || '-'}</span>
          </div>
          <div class="verb-part-item">
            <span class="part-label">3. Perfectum (1. Tekil):</span>
            <span class="part-val latin-text">${data.parts.perf || '-'}</span>
          </div>
          <div class="verb-part-item">
            <span class="part-label">4. Supinum:</span>
            <span class="part-val latin-text">${data.parts.sup || '-'}</span>
          </div>
        </div>
      </div>
    ` : '';

    // Logeion Canlı Bağlantı Bannerı
    const logeionBannerHtml = `
      <div class="logeion-direct-banner">
        <a href="${word.logeion_url}" target="_blank" rel="noopener noreferrer" class="logeion-direct-link-btn" title="Lewis & Short ve Morpheus morfoloji motoru">
          <span>📖</span> Chicago Logeion'da Bu Kelimenin Tüm Resmi Çekimlerini Aç (Lewis & Short / Morpheus Engine) ↗
        </a>
      </div>
    `;

    // İsim Çekimi
    if (data.type === 'noun_declension') {
      return `
        <div class="paradigm-container">
          ${modelBannerHtml}
          ${logeionBannerHtml}

          <div class="paradigm-card-header">
            <h3 class="paradigm-word-title">${data.title}</h3>
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
          ${modelBannerHtml}
          ${logeionBannerHtml}

          <div class="paradigm-card-header">
            <h3 class="paradigm-word-title">${data.title}</h3>
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
          ${modelBannerHtml}
          ${verbPartsHtml}
          ${logeionBannerHtml}

          <div class="paradigm-card-header">
            <h3 class="paradigm-word-title">${data.title}</h3>
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

          ${data.note ? `<div class="paradigm-footer-note">💡 <strong>Gramer Notu:</strong> ${data.note}</div>` : ''}
        </div>
      `;
    }

    return '';
  }

  // ==========================================================================
  // GENEL REFERANS REHBERİ RENDER METODU (GENEL SAYFA VE MODAL İÇİN)
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

    if (category === 'irregulars') {
      const irregularVerbs = LATIN_REFERENCE_PARADIGMS.verbs.filter(v => 
        ['verb_sum', 'verb_possum', 'verb_volo', 'verb_fero', 'verb_eo'].includes(v.id)
      );
      const irregularNouns = Object.values(LATIN_EXCEPTIONS);

      return `
        <div class="reference-section-list">
          <div style="margin: 0.5rem 0 1.25rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color);">
            <h3 style="font-family: var(--font-serif); color: var(--primary); font-size: 1.3rem; margin: 0 0 0.25rem 0;">⚡ Temel Düzensiz Fiiller (Verba Anōmala)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">Klasik metinlerde en sık karşılaşılan ve kurallı çekimlere uymayan kök fiiller.</p>
          </div>
          ${irregularVerbs.map(item => `
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

          <div style="margin: 2rem 0 1.25rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color);">
            <h3 style="font-family: var(--font-serif); color: var(--primary); font-size: 1.3rem; margin: 0 0 0.25rem 0;">🏛️ Düzensiz & Özel İsimler (Nōmina Anōmala)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">Kökte değişim gösteren veya bazı halleri eksik olan özel isim çekimleri.</p>
          </div>
          ${irregularNouns.map(item => `
            <div class="reference-item-card">
              <div class="reference-item-header">
                <div>
                  <h4 class="reference-item-title">${item.title}</h4>
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

    return '';
  }

  return {
    getOrderedCases,
    getWordInflection,
    renderWordInflectionHtml,
    renderReferenceCategoryHtml
  };
})();
