// Latince Ekinoks - Çekim Motoru (Inflection Engine)

const InflectionEngine = (function () {

  // Casus anahtarlarını seçilen sıralamaya göre döndürür
  function getOrderedCases(orderId) {
    const config = LATIN_CASE_ORDERS[orderId] || LATIN_CASE_ORDERS['NVGDAcAb'];
    return config.order.map(key => LATIN_CASE_INFO[key]);
  }

  // Yardımcı: Makron ve aksanları temizleyip küçük harfe çevirir
  function normalizeLatin(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Kelime için çekim verisi üretir
  function getWordInflection(word) {
    if (!word) return null;

    const posGroup = (word.pos_group || '').toLowerCase();
    const posTr = (word.pos_tr || '').toLowerCase();
    const cleanLemma = normalizeLatin(word.lemma || '');
    const cleanHeadFirst = normalizeLatin((word.headword || '').split(/[\s,.;]+/)[0]);

    // 1. Fiil Çekimi (En öncelikli; fiiller asla isim istisnalarıyla karışmamalı!)
    if (posGroup.includes('fiil') || posTr.includes('fiil')) {
      return generateVerbConjugation(word);
    }

    // 2. Özel / Düzensiz İsim İstisnaları (vīs, vir, deus, domus, nēmō)
    // SADECE isimler için ve KESİN lemma/başlık eşleşmesiyle (substring DEĞİL!)
    if (posGroup.includes('isim') || posTr.includes('isim')) {
      for (const [key, exc] of Object.entries(LATIN_EXCEPTIONS)) {
        const normKey = normalizeLatin(key);
        if (cleanLemma === normKey || cleanHeadFirst === normKey) {
          return {
            type: 'noun_declension',
            title: exc.title || word.headword,
            isIrregular: true,
            forms: exc.forms,
            note: exc.note || ''
          };
        }
      }
      return generateNounDeclension(word);
    }

    // 3. Sıfat Çekimi
    if (posGroup.includes('sıfat') || posGroup.includes('sifat') || posTr.includes('sıfat') || posTr.includes('sifat')) {
      return generateAdjectiveDeclension(word);
    }

    // 4. Zamir Çekimi
    if (posGroup.includes('zamir') || posTr.includes('zamir')) {
      return generatePronounDeclension(word);
    }

    // 5. Çekimsiz Sözcükler (Zarf, Edat, Bağlaç, Ünlem)
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
    const hw = word.headword || '';
    const lemma = word.lemma || '';
    const posTr = (word.pos_tr || '').toLowerCase();
    const normLemma = normalizeLatin(lemma);

    // 1. DÜZENSİZ FİİLLER (sum, possum, fero, volo, eo ve bileşikleri)
    if (normLemma === 'sum' || hw.includes('esse fui') || hw.includes('esse fuī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_sum') };
    }
    if (normLemma === 'possum' || hw.includes('posse potui') || hw.includes('posse potuī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_possum') };
    }
    if (normLemma === 'fero' || hw.includes('ferre tuli') || hw.includes('ferre tulī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_fero') };
    }
    if (normLemma === 'volo' || hw.includes('velle volui') || hw.includes('velle voluī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_volo') };
    }
    if (normLemma === 'eo' || hw.includes('ire ii') || hw.includes('īre iī')) {
      return { type: 'verb_conjugation', ...LATIN_REFERENCE_PARADIGMS.verbs.find(v => v.id === 'verb_eo') };
    }

    // 2. DEPONENT FİİLLER (Biçimce Edilgen, Anlamca Etken)
    const isDeponent = posTr.includes('deponens') || lemma.endsWith('or') || hw.includes('sum');
    if (isDeponent) {
      const baseStem = lemma.replace(/ior$/, '').replace(/or$/, '');
      const perfPartMatch = hw.match(/([a-zA-Z\u0100-\u017F]+us)\s+sum/);
      const perfPart = perfPartMatch ? perfPartMatch[1].replace(/us$/, '') : (baseStem + 't');

      let p2s = baseStem + 'ris', p3s = baseStem + 'tur', p1p = baseStem + 'mur', p2p = baseStem + 'minī', p3p = baseStem + 'ntur';
      let imp1s = baseStem + 'bar', imp2s = baseStem + 'bāris', imp3s = baseStem + 'bātur', imp1p = baseStem + 'bāmur', imp2p = baseStem + 'bāminī', imp3p = baseStem + 'bantur';
      let fut1s = baseStem + 'bor', fut2s = baseStem + 'beris', fut3s = baseStem + 'bitur', fut1p = baseStem + 'bimur', fut2p = baseStem + 'biminī', fut3p = baseStem + 'buntur';

      // 3. ve 4. çekim deponentler için futurum (-ar, -ēris...)
      if (posTr.includes('3.') || posTr.includes('4.')) {
        fut1s = baseStem + 'ar';
        fut2s = baseStem + 'ēris';
        fut3s = baseStem + 'ētur';
        fut1p = baseStem + 'ēmur';
        fut2p = baseStem + 'ēminī';
        fut3p = baseStem + 'entur';
      }

      return {
        type: 'verb_conjugation',
        title: `${hw} (Deponent Fiil - Verbum Dēpōnēns)`,
        model: `${hw} • Biçimce Edilgen, Anlamca Etken`,
        tenses: {
          praesens_act: { name: 'Praesens (Şimdiki / Geniş Zaman)', p1s: lemma, p2s, p3s, p1p, p2p, p3p },
          imperfectum_act: { name: 'Imperfectum (Geçmişte Süreklilik: -yordu)', p1s: imp1s, p2s: imp2s, p3s: imp3s, p1p: imp1p, p2p: imp2p, p3p: imp3p },
          futurum_act: { name: 'Futurum I (Gelecek Zaman: -ecek)', p1s: fut1s, p2s: fut2s, p3s: fut3s, p1p: fut1p, p2p: fut2p, p3p: fut3p },
          perfectum_act: { name: 'Perfectum (Görülen Geçmiş: -di)', p1s: perfPart + 'us sum', p2s: perfPart + 'us es', p3s: perfPart + 'us est', p1p: perfPart + 'ī sumus', p2p: perfPart + 'ī estis', p3p: perfPart + 'ī sunt' },
          plusquamperfectum_act: { name: 'Plusquamperfectum (-mişti)', p1s: perfPart + 'us eram', p2s: perfPart + 'us erās', p3s: perfPart + 'us erat', p1p: perfPart + 'ī erāmus', p2p: perfPart + 'ī erātis', p3p: perfPart + 'ī erant' },
          futurum_perf_act: { name: 'Futurum II (Bitmiş Gelecek Zaman)', p1s: perfPart + 'us erō', p2s: perfPart + 'us eris', p3s: perfPart + 'us erit', p1p: perfPart + 'ī erimus', p2p: perfPart + 'ī eritis', p3p: perfPart + 'ī erunt' }
        }
      };
    }

    // 3. STANDART ETKEN FİİLLER (1-4 Coniugatio)
    let conjGroup = 1;
    let conjName = '1. Çekim (-āre)';
    if (posTr.includes('2.') || hw.includes('ēre') || hw.includes('-ēre')) {
      conjGroup = 2;
      conjName = '2. Çekim (-ēre)';
    } else if (posTr.includes('3.') && posTr.includes('-io')) {
      conjGroup = 35; // 3. Çekim -io
      conjName = '3. Çekim (-ere, -iō)';
    } else if (posTr.includes('3.') || hw.includes('ere') || hw.includes('-ere')) {
      conjGroup = 3;
      conjName = '3. Çekim (-ere)';
    } else if (posTr.includes('4.') || hw.includes('īre') || hw.includes('-īre')) {
      conjGroup = 4;
      conjName = '4. Çekim (-īre)';
    }

    const rawStem = lemma.replace(/[ōo]$/, '');
    
    // Perfect kökünü headword'deki 3. parçadan çıkar
    let perfStem = '';
    const tokens = hw.split(/[\s,;]+/);
    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i].trim();
      if (/^-?[a-zA-Z\u0100-\u017F]+[iī]$/.test(t) && !t.includes('re') && !t.includes('rī')) {
        if (t.startsWith('-')) {
          perfStem = rawStem + t.replace(/^-/, '').replace(/[iī]$/, '');
        } else {
          perfStem = t.replace(/[iī]$/, '');
        }
        break;
      }
    }

    if (!perfStem) {
      if (conjGroup === 1) perfStem = rawStem + 'āv';
      else if (conjGroup === 2) perfStem = rawStem + 'u';
      else if (conjGroup === 4) perfStem = rawStem + 'īv';
      else perfStem = rawStem + 's';
    }

    let p1s = lemma, p2s, p3s, p1p, p2p, p3p;
    let imp1s, imp2s, imp3s, imp1p, imp2p, imp3p;
    let fut1s, fut2s, fut3s, fut1p, fut2p, fut3p;

    if (conjGroup === 1) {
      // 1. Çekim (amō, amāre)
      p2s = rawStem + 'ās'; p3s = rawStem + 'at'; p1p = rawStem + 'āmus'; p2p = rawStem + 'ātis'; p3p = rawStem + 'ant';
      imp1s = rawStem + 'ābam'; imp2s = rawStem + 'ābās'; imp3s = rawStem + 'ābat'; imp1p = rawStem + 'ābāmus'; imp2p = rawStem + 'ābātis'; imp3p = rawStem + 'ābant';
      fut1s = rawStem + 'ābō'; fut2s = rawStem + 'ābis'; fut3s = rawStem + 'ābit'; fut1p = rawStem + 'ābimus'; fut2p = rawStem + 'ābitis'; fut3p = rawStem + 'ābunt';
    } else if (conjGroup === 2) {
      // 2. Çekim (videō, vidēre)
      p2s = rawStem + 's'; p3s = rawStem + 't'; p1p = rawStem + 'mus'; p2p = rawStem + 'tis'; p3p = rawStem + 'nt';
      imp1s = rawStem + 'bam'; imp2s = rawStem + 'bās'; imp3s = rawStem + 'bat'; imp1p = rawStem + 'bāmus'; imp2p = rawStem + 'bātis'; imp3p = rawStem + 'bant';
      fut1s = rawStem + 'bō'; fut2s = rawStem + 'bis'; fut3s = rawStem + 'bit'; fut1p = rawStem + 'bimus'; fut2p = rawStem + 'bitis'; fut3p = rawStem + 'bunt';
    } else if (conjGroup === 3) {
      // 3. Çekim -o (dīcō, dīcere)
      p2s = rawStem + 'is'; p3s = rawStem + 'it'; p1p = rawStem + 'imus'; p2p = rawStem + 'itis'; p3p = rawStem + 'unt';
      imp1s = rawStem + 'ēbam'; imp2s = rawStem + 'ēbās'; imp3s = rawStem + 'ēbat'; imp1p = rawStem + 'ēbāmus'; imp2p = rawStem + 'ēbātis'; imp3p = rawStem + 'ēbant';
      fut1s = rawStem + 'am'; fut2s = rawStem + 'ēs'; fut3s = rawStem + 'et'; fut1p = rawStem + 'ēmus'; fut2p = rawStem + 'ētis'; fut3p = rawStem + 'ent';
    } else if (conjGroup === 35) {
      // 3. Çekim -io (capiō, capere)
      const consStem = rawStem.slice(0, -1);
      p2s = consStem + 'is'; p3s = consStem + 'it'; p1p = consStem + 'imus'; p2p = consStem + 'itis'; p3p = rawStem + 'unt';
      imp1s = rawStem + 'ēbam'; imp2s = rawStem + 'ēbās'; imp3s = rawStem + 'ēbat'; imp1p = rawStem + 'ēbāmus'; imp2p = rawStem + 'ēbātis'; imp3p = rawStem + 'ēbant';
      fut1s = rawStem + 'am'; fut2s = rawStem + 'ēs'; fut3s = rawStem + 'et'; fut1p = rawStem + 'ēmus'; fut2p = rawStem + 'ētis'; fut3p = rawStem + 'ent';
    } else {
      // 4. Çekim (audiō, audīre)
      p2s = rawStem + 's'; p3s = rawStem + 't'; p1p = rawStem + 'mus'; p2p = rawStem + 'tis'; p3p = rawStem + 'unt';
      imp1s = rawStem + 'ēbam'; imp2s = rawStem + 'ēbās'; imp3s = rawStem + 'ēbat'; imp1p = rawStem + 'ēbāmus'; imp2p = rawStem + 'ēbātis'; imp3p = rawStem + 'ēbant';
      fut1s = rawStem + 'am'; fut2s = rawStem + 'ēs'; fut3s = rawStem + 'et'; fut1p = rawStem + 'ēmus'; fut2p = rawStem + 'ētis'; fut3p = rawStem + 'ent';
    }

    return {
      type: 'verb_conjugation',
      title: `${hw} (${conjName})`,
      model: `${hw} • Etken Çekim (Actīvum)`,
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
