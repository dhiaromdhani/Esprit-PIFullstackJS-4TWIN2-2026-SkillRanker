// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { TranslateService } from '@ngx-translate/core';
// import { UI_TEXT_TRANSLATIONS } from './ui-translation.map';

// @Injectable({
//   providedIn: 'root'
// })
// export class LanguageService {
//   private currentLanguage = new BehaviorSubject<string>('en');
//   public currentLanguage$: Observable<string> = this.currentLanguage.asObservable();

//   private readonly STORAGE_KEY = 'app_language';
//   private readonly SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];
//   private originalTextNodes = new WeakMap<Text, string>();
//   private originalAttrs = new WeakMap<Element, Map<string, string>>();
//   private observer?: MutationObserver;
//   private translateTimer?: ReturnType<typeof setTimeout>;

//   constructor(private translate: TranslateService) {
//     this.initializeLanguage();
//   }

//   private initializeLanguage(): void {
//     this.translate.addLangs(this.SUPPORTED_LANGUAGES);
//     this.translate.setDefaultLang('en');

//     const savedLanguage = this.isBrowser() ? localStorage.getItem(this.STORAGE_KEY) : null;
//     const browserLanguage = this.getBrowserLanguage();
//     const initialLanguage = savedLanguage || browserLanguage || 'en';

//     this.startDomTranslator();
//     this.setLanguage(initialLanguage);
//   }

//   private isBrowser(): boolean {
//     return typeof window !== 'undefined' && typeof document !== 'undefined';
//   }

//   private getBrowserLanguage(): string {
//     const browserLang = this.translate.getBrowserLang();
//     return this.SUPPORTED_LANGUAGES.includes(browserLang || '') ? browserLang! : 'en';
//   }

//   setLanguage(lang: string): void {
//     if (!this.SUPPORTED_LANGUAGES.includes(lang)) {
//       lang = 'en';
//     }

//     this.translate.use(lang);

//     if (this.isBrowser()) {
//       const direction = lang === 'ar' ? 'rtl' : 'ltr';
//       document.documentElement.dir = direction;
//       document.documentElement.lang = lang;
//       document.documentElement.setAttribute('lang', lang);
//       document.body.classList.toggle('rtl-mode', lang === 'ar');
//       localStorage.setItem(this.STORAGE_KEY, lang);
//     }

//     this.currentLanguage.next(lang);
//     this.scheduleDomTranslation();
//     this.announceLanguageChange(lang);
//   }

//   getCurrentLanguage(): string {
//     return this.currentLanguage.value;
//   }

//   getLanguages(): { code: string; name: string; nativeName: string }[] {
//     return [
//       { code: 'en', name: 'English', nativeName: 'English' },
//       { code: 'fr', name: 'Français', nativeName: 'Français' },
//       { code: 'ar', name: 'العربية', nativeName: 'العربية' }
//     ];
//   }

//   private startDomTranslator(): void {
//     if (!this.isBrowser() || typeof MutationObserver === 'undefined' || this.observer) {
//       return;
//     }

//     this.observer = new MutationObserver(() => this.scheduleDomTranslation());
//     setTimeout(() => {
//       if (document.body && this.observer) {
//         this.observer.observe(document.body, {
//           childList: true,
//           subtree: true,
//           characterData: true,
//           attributes: true,
//           attributeFilter: ['placeholder', 'title', 'aria-label', 'alt']
//         });
//         this.scheduleDomTranslation();
//       }
//     });
//   }

//   private scheduleDomTranslation(): void {
//     if (!this.isBrowser()) return;
//     if (this.translateTimer) clearTimeout(this.translateTimer);
//     this.translateTimer = setTimeout(() => this.translateHardcodedTexts(this.currentLanguage.value), 40);
//   }

//   private translateHardcodedTexts(lang: string): void {
//     if (!this.isBrowser() || !document.body) return;
//     this.translateTextNodes(document.body, lang);
//     this.translateAttributes(document.body, lang);
//   }

//   private translateTextNodes(root: Node, lang: string): void {
//     const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
//       acceptNode: (node) => {
//         const parent = node.parentElement;
//         if (!parent) return NodeFilter.FILTER_REJECT;
//         const tag = parent.tagName.toLowerCase();
//         if (['script', 'style', 'code', 'pre', 'textarea'].includes(tag)) return NodeFilter.FILTER_REJECT;
//         if (parent.closest('.notranslate')) return NodeFilter.FILTER_REJECT;
//         const value = this.normalize(node.textContent || '');
//         return value ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
//       }
//     });

//     const nodes: Text[] = [];
//     while (walker.nextNode()) nodes.push(walker.currentNode as Text);

//     nodes.forEach((node) => {
//       const raw = node.textContent || '';
//       const normalized = this.normalize(raw);
//       if (!normalized) return;

//       let original = this.originalTextNodes.get(node);
//       if (!original) {
//         original = this.findOriginalKey(normalized) || normalized;
//         this.originalTextNodes.set(node, original);
//       }

//       const translated = this.lookup(original, lang);
//       if (translated !== undefined && translated !== normalized) {
//         node.textContent = this.withOriginalSpacing(raw, translated);
//       }
//     });
//   }

//   private translateAttributes(root: Element, lang: string): void {
//     const attrs = ['placeholder', 'title', 'aria-label', 'alt'];
//     const elements = root.querySelectorAll(attrs.map(attr => `[${attr}]`).join(','));

//     elements.forEach((el) => {
//       attrs.forEach((attr) => {
//         const raw = el.getAttribute(attr);
//         if (!raw || raw.includes('{{')) return;
//         const normalized = this.normalize(raw);
//         if (!normalized) return;

//         let attrMap = this.originalAttrs.get(el);
//         if (!attrMap) {
//           attrMap = new Map<string, string>();
//           this.originalAttrs.set(el, attrMap);
//         }

//         let original = attrMap.get(attr);
//         if (!original) {
//           original = this.findOriginalKey(normalized) || normalized;
//           attrMap.set(attr, original);
//         }

//         const translated = this.lookup(original, lang);
//         if (translated !== undefined && translated !== normalized) {
//           el.setAttribute(attr, translated);
//         }
//       });
//     });
//   }

//   private lookup(original: string, lang: string): string | undefined {
//     const direct = UI_TEXT_TRANSLATIONS[original]?.[lang];
//     if (direct !== undefined) return direct;

//     const key = this.findOriginalKey(original);
//     return key ? UI_TEXT_TRANSLATIONS[key]?.[lang] : undefined;
//   }

//   private findOriginalKey(value: string): string | undefined {
//     if (UI_TEXT_TRANSLATIONS[value]) return value;
//     return Object.keys(UI_TEXT_TRANSLATIONS).find((key) => {
//       const item = UI_TEXT_TRANSLATIONS[key];
//       return item['en'] === value || item['fr'] === value || item['ar'] === value;
//     });
//   }

//   private normalize(value: string): string {
//     return value.replace(/\s+/g, ' ').trim();
//   }

//   private withOriginalSpacing(original: string, translated: string): string {
//     const leading = original.match(/^\s*/)?.[0] || '';
//     const trailing = original.match(/\s*$/)?.[0] || '';
//     return `${leading}${translated}${trailing}`;
//   }

//   private announceLanguageChange(lang: string): void {
//     if (!this.isBrowser() || !document.body) return;
//     const announcement = this.getLanguageName(lang);
//     const ariaLive = document.createElement('div');
//     ariaLive.setAttribute('aria-live', 'polite');
//     ariaLive.setAttribute('aria-atomic', 'true');
//     ariaLive.className = 'sr-only';
//     ariaLive.textContent = `Language changed to ${announcement}`;
//     document.body.appendChild(ariaLive);
//     setTimeout(() => ariaLive.remove(), 1000);
//   }

//   private getLanguageName(lang: string): string {
//     const languages: { [key: string]: string } = {
//       en: 'English',
//       fr: 'Français',
//       ar: 'العربية'
//     };
//     return languages[lang] || lang;
//   }
// }
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'fr' | 'en' | 'ar';

type LangMap = {
  fr: string;
  en: string;
  ar: string;
};

const TEXT_TRANSLATIONS: Record<string, LangMap> = {
  'Dashboard': {
    fr: 'Tableau de bord',
    en: 'Dashboard',
    ar: 'لوحة التحكم'
  },
  'HR Dashboard': {
    fr: 'Tableau de bord RH',
    en: 'HR Dashboard',
    ar: 'لوحة تحكم الموارد البشرية'
  },
  'Admin Dashboard': {
    fr: 'Tableau de bord Admin',
    en: 'Admin Dashboard',
    ar: 'لوحة تحكم المسؤول'
  },
  'Home': {
    fr: 'Accueil',
    en: 'Home',
    ar: 'الرئيسية'
  },
  'Activities': {
    fr: 'Activités',
    en: 'Activities',
    ar: 'الأنشطة'
  },
  'Recommendations': {
    fr: 'Recommandations',
    en: 'Recommendations',
    ar: 'التوصيات'
  },
  'Profile': {
    fr: 'Profil',
    en: 'Profile',
    ar: 'الملف الشخصي'
  },
  'Statistics': {
    fr: 'Statistiques',
    en: 'Statistics',
    ar: 'الإحصائيات'
  },
  'History': {
    fr: 'Historique',
    en: 'History',
    ar: 'السجل'
  },
  'Logout': {
    fr: 'Déconnexion',
    en: 'Logout',
    ar: 'تسجيل الخروج'
  },
  'Total Users': {
    fr: 'Total utilisateurs',
    en: 'Total Users',
    ar: 'إجمالي المستخدمين'
  },
  'Total Activities': {
    fr: 'Total activités',
    en: 'Total Activities',
    ar: 'إجمالي الأنشطة'
  },
  'Open Activities': {
    fr: 'Activités ouvertes',
    en: 'Open Activities',
    ar: 'الأنشطة المفتوحة'
  },
  'Completed Activities': {
    fr: 'Activités terminées',
    en: 'Completed Activities',
    ar: 'الأنشطة المكتملة'
  },
  'Completed': {
    fr: 'Terminé',
    en: 'Completed',
    ar: 'مكتمل'
  },
  'Quick Actions': {
    fr: 'Actions rapides',
    en: 'Quick Actions',
    ar: 'إجراءات سريعة'
  },
  'New Activity': {
    fr: 'Nouvelle activité',
    en: 'New Activity',
    ar: 'نشاط جديد'
  },
  'NOUVELLE ACTIVITÉ': {
    fr: 'NOUVELLE ACTIVITÉ',
    en: 'NEW ACTIVITY',
    ar: 'نشاط جديد'
  },
  'Add Employee': {
    fr: 'Ajouter employé',
    en: 'Add Employee',
    ar: 'إضافة موظف'
  },
  'Employee Management': {
    fr: 'Gestion des employés',
    en: 'Employee Management',
    ar: 'إدارة الموظفين'
  },
  'Search': {
    fr: 'Rechercher',
    en: 'Search',
    ar: 'بحث'
  },
  'Filter': {
    fr: 'Filtrer',
    en: 'Filter',
    ar: 'تصفية'
  },
  'Name': {
    fr: 'Nom',
    en: 'Name',
    ar: 'الاسم'
  },
  'Email': {
    fr: 'Email',
    en: 'Email',
    ar: 'البريد الإلكتروني'
  },
  'Job Title': {
    fr: 'Poste',
    en: 'Job Title',
    ar: 'الوظيفة'
  },
  'Role': {
    fr: 'Rôle',
    en: 'Role',
    ar: 'الدور'
  },
  'Actions': {
    fr: 'Actions',
    en: 'Actions',
    ar: 'الإجراءات'
  },
  'Edit': {
    fr: 'Modifier',
    en: 'Edit',
    ar: 'تعديل'
  },
  'Delete': {
    fr: 'Supprimer',
    en: 'Delete',
    ar: 'حذف'
  },
  'Light': {
    fr: 'Clair',
    en: 'Light',
    ar: 'فاتح'
  },
  'Dark': {
    fr: 'Sombre',
    en: 'Dark',
    ar: 'داكن'
  },
  'Speak Dashboard': {
    fr: 'Lire le tableau de bord',
    en: 'Speak Dashboard',
    ar: 'قراءة لوحة التحكم'
  }
};

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<AppLanguage>('fr');
  currentLanguage$ = this.currentLanguageSubject.asObservable();

  readonly languages = [
    { code: 'fr' as AppLanguage, label: 'FR', name: 'Français' },
    { code: 'en' as AppLanguage, label: 'EN', name: 'English' },
    { code: 'ar' as AppLanguage, label: 'AR', name: 'العربية' }
  ];

  private originalTextNodes = new WeakMap<Text, string>();
  private originalAttributes = new WeakMap<Element, Map<string, string>>();
  private observer?: MutationObserver;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['fr', 'en', 'ar']);
    this.translate.setDefaultLang('fr');

    const savedLang = this.isBrowser()
      ? (localStorage.getItem('lang') as AppLanguage | null)
      : null;

    this.startDomTranslator();
    this.setLanguage(savedLang === 'fr' || savedLang === 'en' || savedLang === 'ar' ? savedLang : 'fr');
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  setLanguage(lang: AppLanguage): void {
    this.currentLanguageSubject.next(lang);
    this.translate.use(lang);

    if (!this.isBrowser()) return;

    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl-mode', lang === 'ar');

    this.scheduleDomTranslation();
  }

  getCurrentLanguage(): AppLanguage {
    return this.currentLanguageSubject.value;
  }

  private startDomTranslator(): void {
    if (!this.isBrowser() || this.observer) return;

    this.observer = new MutationObserver(() => this.scheduleDomTranslation());

    setTimeout(() => {
      if (!document.body || !this.observer) return;

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'title', 'aria-label', 'alt']
      });

      this.scheduleDomTranslation();
    }, 100);
  }

  private scheduleDomTranslation(): void {
    if (!this.isBrowser()) return;

    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this.translateHardcodedTexts(this.currentLanguageSubject.value);
    }, 80);
  }

  private translateHardcodedTexts(lang: AppLanguage): void {
    if (!this.isBrowser() || !document.body) return;

    this.translateTextNodes(document.body, lang);
    this.translateAttributes(document.body, lang);
  }

  private translateTextNodes(root: Node, lang: AppLanguage): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'code', 'pre', 'textarea'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest('.notranslate')) {
          return NodeFilter.FILTER_REJECT;
        }

        const text = this.clean(node.textContent || '');
        if (!text || /^\d+$/.test(text)) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes: Text[] = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text);
    }

    nodes.forEach((node) => {
      const raw = node.textContent || '';
      const current = this.clean(raw);
      if (!current) return;

      let original = this.originalTextNodes.get(node);

      if (!original) {
        original = this.findOriginalKey(current) || current;
        this.originalTextNodes.set(node, original);
      }

      const translated = this.lookup(original, lang);
      if (!translated) return;

      node.textContent = this.keepSpacing(raw, translated);
    });
  }

  private translateAttributes(root: Element, lang: AppLanguage): void {
    const attrs = ['placeholder', 'title', 'aria-label', 'alt'];
    const elements = root.querySelectorAll(attrs.map(attr => `[${attr}]`).join(','));

    elements.forEach((el) => {
      attrs.forEach((attr) => {
        const raw = el.getAttribute(attr);
        if (!raw || raw.includes('{{')) return;

        const current = this.clean(raw);
        if (!current) return;

        let map = this.originalAttributes.get(el);
        if (!map) {
          map = new Map<string, string>();
          this.originalAttributes.set(el, map);
        }

        let original = map.get(attr);
        if (!original) {
          original = this.findOriginalKey(current) || current;
          map.set(attr, original);
        }

        const translated = this.lookup(original, lang);
        if (!translated) return;

        el.setAttribute(attr, translated);
      });
    });
  }

  private lookup(original: string, lang: AppLanguage): string | undefined {
    const key = this.findOriginalKey(original);
    return key ? TEXT_TRANSLATIONS[key]?.[lang] : undefined;
  }

  private findOriginalKey(value: string): string | undefined {
    const cleaned = this.clean(value);

    if (TEXT_TRANSLATIONS[cleaned]) return cleaned;

    return Object.keys(TEXT_TRANSLATIONS).find((key) => {
      const item = TEXT_TRANSLATIONS[key];
      return item.fr === cleaned || item.en === cleaned || item.ar === cleaned;
    });
  }

  private clean(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private keepSpacing(original: string, translated: string): string {
    const before = original.match(/^\s*/)?.[0] || '';
    const after = original.match(/\s*$/)?.[0] || '';
    return `${before}${translated}${after}`;
  }
}