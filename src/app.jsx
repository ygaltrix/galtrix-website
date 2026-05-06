import React, { useState, useEffect, useRef, useContext, useMemo, createContext } from 'react';
import { createRoot } from 'react-dom/client';

/* ---------- Icons (inline SVG) ---------- */
const I = {
  spark:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  cpu:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>,
  flow:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 7h10a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h12"/><circle cx="4" cy="7" r="1.6"/><circle cx="20" cy="19" r="1.6"/></svg>,
  stack:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="M3 12l9 4.5L21 12"/><path d="M3 16.5l9 4.5 9-4.5"/></svg>,
  rocket:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3c4 2 7 5 7 11-6 0-9-3-11-7l4-4Z"/><path d="M7 17c-2 0-4 2-4 4 2 0 4-2 4-4Z"/><path d="M10 14l-3 3"/><circle cx="16" cy="8" r="1"/></svg>,
  arrow:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  check:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 12l5 5L20 6"/></svg>,
  target:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  compass:(p)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-6 2 2-6 6-2Z" fill="currentColor" fillOpacity="0.2"/></svg>,
};

/* ---------- Scroll-reveal helper ---------- */
function Reveal({ children, delay=0, className="" }){
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const io = new IntersectionObserver(([e])=>{
      if(e.isIntersecting){ setShow(true); io.disconnect(); }
    }, { threshold:0.12 });
    io.observe(el); return ()=>io.disconnect();
  },[]);
  return (
    <div ref={ref} style={{transitionDelay:`${delay}ms`}}
      className={`transition-all duration-[900ms] ease-out ${show?'opacity-100 translate-y-0':'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// i18n — English / Spanish translations
// Brand-fixed strings (NEVER translated): "GALTRIX", "Built for What's Next.",
// galtrix.info@galtrix.net, URLs, AI/AUTO/INFRA/VNTR pillar codes.
// ───────────────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    nav: { about:'About', focus:'Focus', principles:'Principles', founders:'Founders', contact:'Contact', startProject:'Start a Project' },
    hero: {
      badge: 'Private Corporation — Venture Platform',
      taglinePrefix: 'Built for ',
      taglineAccent: "What's Next.",
      description: 'A forward-thinking corporation focused on innovation, technology, and intelligent solutions. Built on ambition, precision, and vision — designed to create scalable ventures across AI, automation, digital infrastructure, and next-generation business systems.',
      ctaPrimary: 'Explore Focus Areas',
      ctaSecondary: 'View Corporate Profile',
      pillars: [['AI','Artificial Intelligence'],['AUTO','Automation'],['INFRA','Digital Infrastructure'],['VNTR','Strategic Ventures']],
    },
    about: {
      eyebrow: 'About Galtrix',
      heading: 'A corporate overview of innovation, technology, and intelligent systems.',
      body1:   'Galtrix is a forward-thinking corporation focused on innovation, technology, and intelligent solutions for the future. Built on ambition, precision, and vision, Galtrix is designed to create scalable ventures across AI, automation, digital infrastructure, and next-generation business systems.',
      body2:   'Our mission is to develop powerful ideas into lasting enterprises that shape industries and drive progress.',
      meta: [
        { k:'Founders',         v:'Jann Gabriel Guillermety · Edwin Gabriel Garcia' },
        { k:'Company Type',     v:'Private Corporation / Venture Platform' },
        { k:'Primary Identity', v:'AI · Automation · Digital Infrastructure · Scalable Ventures' },
        { k:'Positioning',      v:'Modern, premium, and future-facing' },
      ],
      vision:  { eyebrow:'Vision',  body:'To build a modern enterprise platform where engineering, automation, and strategic thinking converge to create high-impact businesses with long-term value.' },
      mission: { eyebrow:'Mission', body:'Develop intelligent systems, scalable ventures, and premium digital solutions that transform ambition into operational excellence.' },
    },
    focus: {
      eyebrow:'Strategic Focus',
      heading:'A scalable brand platform across high-value sectors.',
      sub:    'Galtrix is structured to operate as a scalable brand platform with room to expand into multiple high-value sectors.',
      items: [
        { title:'Artificial Intelligence', text:'Applied AI systems, intelligent workflows, and next-generation digital services.' },
        { title:'Automation',              text:'Operational tools and process automation designed for efficiency, scale, and reliability.' },
        { title:'Digital Infrastructure',  text:'Technology foundations that support performance, growth, and modern business execution.' },
        { title:'Strategic Ventures',      text:'A scalable business model built to expand into future products, services, and markets.' },
      ],
    },
    principles: {
      eyebrow:'Core Principles',
      heading:'Disciplined ambition. Intelligent execution.',
      brandStatementLabel:'Brand Statement',
      brandStatementParts: ['Galtrix represents ', 'disciplined ambition', ', ', 'intelligent execution', ', and the pursuit of lasting enterprise value.'],
      items: ['Precision in execution','Scalable systems over temporary fixes','Modern design with real-world utility','Long-term value creation'],
    },
    founders: {
      eyebrow:'Founders',
      headingPrefix:'Leadership Behind ',
      headingAccent:'GALTRIX',
      sub:'GALTRIX is led by a focused founding team with defined responsibilities across technology, engineering, finance, legal, operations, strategy, and growth.',
      people: [
        {
          role:'Co-Founder / Technical Development & Engineering',
          description:"Jann Gabriel Guillermety oversees GALTRIX's technical development and engineering. His responsibilities center on building scalable digital systems, technical architecture, automation structures, and intelligent technology solutions that support the company's long-term vision.",
          tags:['Technical Development','Engineering','Digital Systems','Automation Architecture','Scalable Technology'],
        },
        {
          role:'Co-Founder / Financial, Legal & Operations',
          description:"Edwin Gabriel Garcia Flores oversees GALTRIX's financial, legal, and operational functions. His responsibilities center on business structure, operational coordination, legal readiness, financial organization, and building a strong foundation for sustainable growth.",
          tags:['Financial Oversight','Legal Structure','Operations','Business Organization','Sustainable Growth'],
        },
      ],
      sharedPrefix:'Both members share responsibility for ',
      sharedAccent:'strategy and growth',
      sharedSupport:"Together, the founding team aligns GALTRIX's technical execution, operational structure, and long-term business direction.",
    },
    contact: {
      eyebrow:'Contact',
      heading:'Start the next phase of your digital presence.',
      sub:    'Galtrix partners with ambitious teams building at the edges of AI, automation, and digital infrastructure. Share your project and our team will follow up.',
      bullets:['Enterprise-grade positioning','Scalable systems, engineered to last','Modern design with real-world utility'],
      labels: { fullName:'Full Name', email:'Email', company:'Company', companyOptional:'(optional)', project:'Tell us about your project' },
      placeholders: { fullName:'Your name', email:'you@company.com', company:'Your company', project:'What are you trying to build?' },
      submit:'Submit Inquiry',
      submitSending:'Sending…',
      privacyNote:"We'll never share your information.",
      validation: {
        name:'Please enter your name.',
        email:'Please enter your email.',
        emailLong:'That email is too long.',
        emailFormat:'That email address looks invalid.',
        emailLocalLong:'The part before "@" is too long.',
        emailDomainDots:'That domain looks invalid (consecutive dots).',
        emailDomainBad:'That domain looks invalid.',
        emailDisposable:'Please use a permanent email address — disposable inboxes are not accepted.',
        project:'Please tell us about your project.',
      },
      pending: {
        heading:'One last step — confirm your email.',
        bodyPrefix:'We just sent a confirmation link to ',
        bodySuffix:'. Click it to complete your inquiry — our team will then review and follow up within 24–48 hours.',
        expiryPrefix:'The link expires in 24 hours. Don’t see it? Check your spam folder, or ',
        tryAnother:'try a different email',
        sendAnother:'Send another inquiry',
      },
      errorGeneric:'We couldn’t submit your inquiry. Please try again or email galtrix.info@galtrix.net.',
      errorNetwork:'Network error. Please check your connection and try again.',
    },
    footer: {
      tagline:'Galtrix is a private corporation and venture platform — designed to create scalable ventures across AI, automation, digital infrastructure, and next-generation business systems.',
      operating:'Operating globally',
      cols: { company:'Company', focus:'Focus', legal:'Legal' },
      companyItems:['About','Founders','Principles','Contact'],
      focusItems:  ['AI','Automation','Infrastructure','Ventures'],
      legalItems:  { privacy:'Privacy', terms:'Terms', security:'Security' },
      copyright:'All rights reserved.',
    },
    legal: {
      privacy: {
        accent:'cyan', eyebrow:'Privacy', modalTitle:'Privacy Policy',
        intro:'How GALTRIX collects, uses, and safeguards the personal information you share with us.',
        blocks: [
          { h:'Our commitment',         p:'At GALTRIX, we respect your privacy and handle personal information with care. This notice explains what we collect, how it is used, and the choices available to you.' },
          { h:'Information we collect', p:'When you contact us through our website, we may collect the name, email address, and message details you voluntarily submit. We do not knowingly collect sensitive personal data.' },
          { h:'How we use it',          p:'Information is used to respond to your inquiry, follow up on your request, and maintain the quality of our services. We do not sell or rent personal data to third parties.' },
          { h:'Third-party processing', p:'Contact form submissions may be processed through trusted third-party providers (such as Formspree). These providers operate under their own privacy and security standards.' },
          { h:'Your choices',           p:'You may request access to, correction of, or deletion of your personal information at any time by contacting galtrix.info@galtrix.net.' },
        ],
      },
      terms: {
        accent:'purple', eyebrow:'Terms', modalTitle:'Terms of Use',
        intro:'The terms and conditions that apply when you access or use the GALTRIX website.',
        blocks: [
          { h:'Overview',                  p:'The GALTRIX website is provided for general informational and business purposes. By accessing or using this site, you agree to the terms outlined below.' },
          { h:'Acceptable use',            p:'You agree to use the site lawfully and in a manner that does not infringe on the rights of others or restrict their use of the platform.' },
          { h:'Intellectual property',     p:'All content, branding, visual identity, and materials on this website are owned or controlled by GALTRIX and protected by applicable intellectual property laws. Unauthorized copying, reproduction, misuse, or interference with the site is prohibited.' },
          { h:'Updates',                   p:'Information on this website may be modified, updated, or removed at any time without prior notice.' },
          { h:'Limitation of liability',   p:'GALTRIX provides this website on an "as is" basis and is not liable for any indirect or consequential damages arising from its use.' },
        ],
      },
      security: {
        accent:'cyan', eyebrow:'Security', modalTitle:'Security Practices',
        intro:'Our approach to safeguarding the information submitted through the GALTRIX website.',
        blocks: [
          { h:'Our approach',     p:'GALTRIX takes the protection of submitted information seriously. We apply reasonable technical and organizational measures designed to safeguard personal data shared through our website.' },
          { h:'Secure processing',p:'Where applicable, trusted third-party providers are used to process and transmit information through established security practices.' },
          { h:'Limitations',      p:'While we take meaningful steps to protect your data, no digital platform can guarantee complete security.' },
          { h:'Report a concern', p:'If you believe you have identified a security issue related to the GALTRIX website, please contact us at galtrix.info@galtrix.net so we can review it promptly.' },
        ],
      },
    },
  },
  es: {
    nav: { about:'Acerca de', focus:'Enfoque', principles:'Principios', founders:'Fundadores', contact:'Contacto', startProject:'Iniciar un Proyecto' },
    hero: {
      badge: 'Corporación Privada — Plataforma de Ventures',
      taglinePrefix: 'Built for ',
      taglineAccent: "What's Next.",
      description: 'Una corporación visionaria enfocada en innovación, tecnología y soluciones inteligentes. Construida sobre ambición, precisión y visión — diseñada para crear ventures escalables a través de IA, automatización, infraestructura digital y sistemas empresariales de próxima generación.',
      ctaPrimary: 'Explorar Áreas de Enfoque',
      ctaSecondary: 'Ver Perfil Corporativo',
      pillars: [['AI','Inteligencia Artificial'],['AUTO','Automatización'],['INFRA','Infraestructura Digital'],['VNTR','Ventures Estratégicos']],
    },
    about: {
      eyebrow: 'Acerca de Galtrix',
      heading: 'Una visión corporativa de innovación, tecnología y sistemas inteligentes.',
      body1:   'Galtrix es una corporación visionaria enfocada en innovación, tecnología y soluciones inteligentes para el futuro. Construida sobre ambición, precisión y visión, Galtrix está diseñada para crear ventures escalables a través de IA, automatización, infraestructura digital y sistemas empresariales de próxima generación.',
      body2:   'Nuestra misión es convertir ideas poderosas en empresas duraderas que transformen industrias e impulsen el progreso.',
      meta: [
        { k:'Fundadores',          v:'Jann Gabriel Guillermety · Edwin Gabriel Garcia' },
        { k:'Tipo de Empresa',     v:'Corporación Privada / Plataforma de Ventures' },
        { k:'Identidad Principal', v:'IA · Automatización · Infraestructura Digital · Ventures Escalables' },
        { k:'Posicionamiento',     v:'Moderno, premium y orientado al futuro' },
      ],
      vision:  { eyebrow:'Visión', body:'Construir una plataforma empresarial moderna donde la ingeniería, la automatización y el pensamiento estratégico convergen para crear negocios de alto impacto con valor a largo plazo.' },
      mission: { eyebrow:'Misión', body:'Desarrollar sistemas inteligentes, ventures escalables y soluciones digitales premium que transforman la ambición en excelencia operativa.' },
    },
    focus: {
      eyebrow:'Enfoque Estratégico',
      heading:'Una plataforma de marca escalable en sectores de alto valor.',
      sub:    'Galtrix está estructurada para operar como una plataforma de marca escalable con capacidad para expandirse a múltiples sectores de alto valor.',
      items: [
        { title:'Inteligencia Artificial', text:'Sistemas de IA aplicada, flujos de trabajo inteligentes y servicios digitales de próxima generación.' },
        { title:'Automatización',          text:'Herramientas operativas y automatización de procesos diseñadas para eficiencia, escala y confiabilidad.' },
        { title:'Infraestructura Digital', text:'Bases tecnológicas que soportan el rendimiento, el crecimiento y la ejecución empresarial moderna.' },
        { title:'Ventures Estratégicos',   text:'Un modelo de negocio escalable construido para expandirse a productos, servicios y mercados futuros.' },
      ],
    },
    principles: {
      eyebrow:'Principios Fundamentales',
      heading:'Ambición disciplinada. Ejecución inteligente.',
      brandStatementLabel:'Declaración de Marca',
      brandStatementParts: ['Galtrix representa ', 'ambición disciplinada', ', ', 'ejecución inteligente', ', y la búsqueda de valor empresarial duradero.'],
      items: ['Precisión en la ejecución','Sistemas escalables sobre soluciones temporales','Diseño moderno con utilidad real','Creación de valor a largo plazo'],
    },
    founders: {
      eyebrow:'Fundadores',
      headingPrefix:'Liderazgo detrás de ',
      headingAccent:'GALTRIX',
      sub:'GALTRIX está liderada por un equipo fundador enfocado, con responsabilidades definidas en tecnología, ingeniería, finanzas, legal, operaciones, estrategia y crecimiento.',
      people: [
        {
          role:'Cofundador / Desarrollo Técnico e Ingeniería',
          description:'Jann Gabriel Guillermety supervisa el desarrollo técnico y la ingeniería de GALTRIX. Sus responsabilidades se centran en construir sistemas digitales escalables, arquitectura técnica, estructuras de automatización y soluciones tecnológicas inteligentes que apoyan la visión a largo plazo de la empresa.',
          tags:['Desarrollo Técnico','Ingeniería','Sistemas Digitales','Arquitectura de Automatización','Tecnología Escalable'],
        },
        {
          role:'Cofundador / Finanzas, Legal y Operaciones',
          description:'Edwin Gabriel Garcia Flores supervisa las funciones financieras, legales y operativas de GALTRIX. Sus responsabilidades se centran en la estructura del negocio, la coordinación operativa, la preparación legal, la organización financiera y la construcción de una base sólida para el crecimiento sostenible.',
          tags:['Supervisión Financiera','Estructura Legal','Operaciones','Organización Empresarial','Crecimiento Sostenible'],
        },
      ],
      sharedPrefix:'Ambos miembros comparten la responsabilidad de la ',
      sharedAccent:'estrategia y el crecimiento',
      sharedSupport:'Juntos, el equipo fundador alinea la ejecución técnica, la estructura operativa y la dirección empresarial a largo plazo de GALTRIX.',
    },
    contact: {
      eyebrow:'Contacto',
      heading:'Inicia la próxima fase de tu presencia digital.',
      sub:    'Galtrix se asocia con equipos ambiciosos que construyen en la frontera de la IA, la automatización y la infraestructura digital. Comparte tu proyecto y nuestro equipo dará seguimiento.',
      bullets:['Posicionamiento empresarial de alto nivel','Sistemas escalables, diseñados para durar','Diseño moderno con utilidad real'],
      labels: { fullName:'Nombre Completo', email:'Correo Electrónico', company:'Empresa', companyOptional:'(opcional)', project:'Cuéntanos sobre tu proyecto' },
      placeholders: { fullName:'Tu nombre', email:'tu@empresa.com', company:'Tu empresa', project:'¿Qué quieres construir?' },
      submit:'Enviar Consulta',
      submitSending:'Enviando…',
      privacyNote:'Nunca compartiremos tu información.',
      validation: {
        name:'Por favor ingresa tu nombre.',
        email:'Por favor ingresa tu correo electrónico.',
        emailLong:'Ese correo es demasiado largo.',
        emailFormat:'Esa dirección de correo no parece válida.',
        emailLocalLong:'La parte antes del "@" es demasiado larga.',
        emailDomainDots:'Ese dominio no parece válido (puntos consecutivos).',
        emailDomainBad:'Ese dominio no parece válido.',
        emailDisposable:'Por favor usa una dirección de correo permanente — los buzones desechables no son aceptados.',
        project:'Por favor cuéntanos sobre tu proyecto.',
      },
      pending: {
        heading:'Un último paso — confirma tu correo.',
        bodyPrefix:'Acabamos de enviarte un enlace de confirmación a ',
        bodySuffix:'. Haz click para completar tu consulta — nuestro equipo revisará y dará seguimiento en 24–48 horas.',
        expiryPrefix:'El enlace expira en 24 horas. ¿No lo ves? Revisa tu carpeta de spam, o ',
        tryAnother:'prueba con otro correo',
        sendAnother:'Enviar otra consulta',
      },
      errorGeneric:'No pudimos enviar tu consulta. Por favor intenta de nuevo o envíanos un correo a galtrix.info@galtrix.net.',
      errorNetwork:'Error de red. Por favor verifica tu conexión e intenta de nuevo.',
    },
    footer: {
      tagline:'Galtrix es una corporación privada y plataforma de ventures — diseñada para crear ventures escalables a través de IA, automatización, infraestructura digital y sistemas empresariales de próxima generación.',
      operating:'Operando globalmente',
      cols: { company:'Empresa', focus:'Enfoque', legal:'Legal' },
      companyItems:['Acerca de','Fundadores','Principios','Contacto'],
      focusItems:  ['IA','Automatización','Infraestructura','Ventures'],
      legalItems:  { privacy:'Privacidad', terms:'Términos', security:'Seguridad' },
      copyright:'Todos los derechos reservados.',
    },
    legal: {
      privacy: {
        accent:'cyan', eyebrow:'Privacidad', modalTitle:'Política de Privacidad',
        intro:'Cómo GALTRIX recopila, utiliza y protege la información personal que compartes con nosotros.',
        blocks: [
          { h:'Nuestro compromiso',          p:'En GALTRIX, respetamos tu privacidad y manejamos la información personal con cuidado. Este aviso explica qué recopilamos, cómo se utiliza y las opciones disponibles para ti.' },
          { h:'Información que recopilamos', p:'Cuando nos contactas a través de nuestro sitio web, podemos recopilar el nombre, dirección de correo electrónico y detalles del mensaje que envías voluntariamente. No recopilamos datos personales sensibles a sabiendas.' },
          { h:'Cómo la utilizamos',          p:'La información se utiliza para responder a tu consulta, dar seguimiento a tu solicitud y mantener la calidad de nuestros servicios. No vendemos ni alquilamos datos personales a terceros.' },
          { h:'Procesamiento por terceros',  p:'Los envíos del formulario de contacto pueden ser procesados a través de proveedores externos confiables (como Formspree). Estos proveedores operan bajo sus propios estándares de privacidad y seguridad.' },
          { h:'Tus opciones',                p:'Puedes solicitar acceso, corrección o eliminación de tu información personal en cualquier momento contactándonos a galtrix.info@galtrix.net.' },
        ],
      },
      terms: {
        accent:'purple', eyebrow:'Términos', modalTitle:'Términos de Uso',
        intro:'Los términos y condiciones que aplican cuando accedes o utilizas el sitio web de GALTRIX.',
        blocks: [
          { h:'Resumen',                       p:'El sitio web de GALTRIX se proporciona con fines generales informativos y de negocios. Al acceder o usar este sitio, aceptas los términos descritos a continuación.' },
          { h:'Uso aceptable',                 p:'Aceptas usar el sitio de manera legal y de una forma que no infrinja los derechos de otros ni restrinja su uso de la plataforma.' },
          { h:'Propiedad intelectual',         p:'Todo el contenido, la marca, la identidad visual y los materiales de este sitio web son propiedad o están controlados por GALTRIX y están protegidos por las leyes de propiedad intelectual aplicables. Queda prohibida la copia, reproducción, uso indebido o interferencia no autorizada con el sitio.' },
          { h:'Actualizaciones',               p:'La información en este sitio web puede ser modificada, actualizada o eliminada en cualquier momento sin previo aviso.' },
          { h:'Limitación de responsabilidad', p:'GALTRIX proporciona este sitio web bajo una base de "tal cual" y no se hace responsable de daños indirectos o consecuentes que surjan de su uso.' },
        ],
      },
      security: {
        accent:'cyan', eyebrow:'Seguridad', modalTitle:'Prácticas de Seguridad',
        intro:'Nuestro enfoque para proteger la información enviada a través del sitio web de GALTRIX.',
        blocks: [
          { h:'Nuestro enfoque',         p:'GALTRIX toma en serio la protección de la información enviada. Aplicamos medidas técnicas y organizativas razonables diseñadas para proteger los datos personales compartidos a través de nuestro sitio web.' },
          { h:'Procesamiento seguro',    p:'Cuando aplica, se utilizan proveedores externos confiables para procesar y transmitir información a través de prácticas de seguridad establecidas.' },
          { h:'Limitaciones',            p:'Si bien tomamos medidas significativas para proteger tus datos, ninguna plataforma digital puede garantizar seguridad completa.' },
          { h:'Reportar una inquietud',  p:'Si crees haber identificado un problema de seguridad relacionado con el sitio web de GALTRIX, por favor contáctanos a galtrix.info@galtrix.net para que podamos revisarlo prontamente.' },
        ],
      },
    },
  },
};

const LANG_STORAGE_KEY = 'galtrix-lang';
const VALID_LANGS = ['en','es'];

const LangContext = createContext({ lang:'en', setLang:()=>{}, t: TRANSLATIONS.en });
const useLang = () => useContext(LangContext);

function readSavedLang(){
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY);
    return VALID_LANGS.includes(v) ? v : 'en';
  } catch (_) { return 'en'; }
}

function LanguageToggle(){
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language"
         className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-0.5 backdrop-blur-md">
      {VALID_LANGS.map(code => {
        const active = lang === code;
        return (
          <button key={code} type="button" onClick={()=>setLang(code)} aria-pressed={active}
                  aria-label={code === 'en' ? 'Switch to English' : 'Cambiar a Español'}
                  className={`min-w-[34px] rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase transition focus:outline-none ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-[#04050d] shadow-[0_0_18px_rgba(34,211,238,0.35)]'
                      : 'text-white/65 hover:text-white hover:bg-white/[0.08]'
                  }`}>
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function Logo({ full = false }){
  // Header (default) → icon-only mark (galtrix-icon.png)
  // Footer (full)    → full logo with wordmark + tagline (galtrix-logo-new.png)
  // Both source PNGs have aspect ratio ≈ 1.41 (3508x2480).
  const src = full ? "galtrix-logo-new.png" : "galtrix-icon.png";
  const alt = full ? "GALTRIX — Built for what's next" : "GALTRIX";
  const h = full ? 96 : 72;
  const w = Math.round(h * (3508/2480));
  const loadHint = full ? 'lazy' : 'eager';   // footer is below the fold
  const decodeHint = full ? 'async' : 'auto';
  const fetchHint = full ? 'low' : 'high';
  return (
    <a href="#home" className="group flex items-center" aria-label={alt}>
      <img src={src} alt={alt}
           width={w} height={h}
           loading={loadHint} decoding={decodeHint} fetchpriority={fetchHint}
           style={{
             display:'block', height: h, width: w,
             filter:'drop-shadow(0 0 14px rgba(34,211,238,0.4)) drop-shadow(0 0 24px rgba(168,85,247,0.3))',
             transition:'transform .3s ease',
           }}
           className="group-hover:scale-[1.04]"/>
    </a>
  );
}

function Header(){
  const { t } = useLang();
  const links = [
    {id:'about',      label: t.nav.about},
    {id:'focus',      label: t.nav.focus},
    {id:'principles', label: t.nav.principles},
    {id:'founders',   label: t.nav.founders},
    {id:'contact',    label: t.nav.contact},
  ];
  const [scrolled, setScrolled] = useState(false);
  useEffect(()=>{
    const on = ()=>setScrolled(window.scrollY>16);
    on(); window.addEventListener('scroll', on, {passive:true});
    return ()=>window.removeEventListener('scroll', on);
  },[]);
  return (
    <header className={`sticky top-0 z-50 transition-colors ${scrolled?'border-b border-white/10 bg-[#04050d]/80 backdrop-blur-md':'bg-transparent'}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6 py-4 lg:px-10">
        <Logo/>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md md:flex">
          {links.map(l=>(
            <a key={l.id} href={`#${l.id}`} className="rounded-full px-4 py-1.5 text-[13px] font-medium text-white/70 transition hover:text-white hover:bg-white/10">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle/>
          <a href="#contact" className="group inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-2.5 text-sm font-semibold text-[#04050d] glow-cyan transition hover:scale-[1.02]">
            {t.nav.startProject}
            <I.arrow className="h-4 w-4 transition group-hover:translate-x-0.5"/>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero(){
  const { t } = useLang();
  return (
    <section id="home" className="relative">
      <div className="mx-auto grid min-h-[94vh] w-full max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="relative z-20 max-w-3xl">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-300/5 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-cyan-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70"/>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300 glow-cyan"/>
              </span>
              {t.hero.badge}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="font-display text-[48px] font-bold leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-[96px]">
              <span className="block">GALTRIX</span>
              <span className="block mt-3 text-[24px] sm:text-3xl lg:text-[40px] font-medium text-white/80">
                {t.hero.taglinePrefix}
                <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">{t.hero.taglineAccent}</span>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              {t.hero.description}
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#focus" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3.5 text-sm font-semibold text-[#04050d] glow-cyan transition hover:shadow-[0_0_60px_rgba(34,211,238,0.45)]">
                {t.hero.ctaPrimary}
                <I.arrow className="h-4 w-4 transition group-hover:translate-x-0.5"/>
              </a>
              <a href="#about" className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-400/5 px-6 py-3.5 text-sm text-purple-100 backdrop-blur transition hover:bg-purple-400/10 hover:border-purple-300/60">
                {t.hero.ctaSecondary}
              </a>
            </div>
          </Reveal>

          <Reveal delay={520}>
            <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-2xl">
              {t.hero.pillars.map(([k,v])=>(
                <div key={k} className="border-l border-white/10 pl-3">
                  <div className="font-display text-xs font-bold tracking-[0.2em] text-cyan-300">{k}</div>
                  <div className="mt-1 text-[12px] leading-5 text-white/65">{v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right: portal visual */}
        <Reveal delay={400}>
          <div className="relative flex items-center justify-center py-8 lg:py-0">
            <div className="relative aspect-square w-full max-w-[420px]">
              {/* rings */}
              <div className="absolute inset-0 rounded-full border border-cyan-300/25 glow-cyan"/>
              <div className="absolute inset-[10%] rounded-full border border-purple-400/25 glow-purple"/>
              <div className="absolute inset-[22%] rounded-full border border-cyan-300/30 glow-cyan"/>
              <div className="absolute inset-[36%] rounded-full border border-purple-400/30 glow-purple"/>
              {/* core */}
              <div className="absolute inset-[42%] rounded-full bg-gradient-to-br from-cyan-300 via-white to-purple-400 glow-cyan animate-pulse"/>
              {/* orbiting dots */}
              <div className="absolute inset-0 animate-[spin_18s_linear_infinite]">
                <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 glow-cyan"/>
              </div>
              <div className="absolute inset-[10%] animate-[spin_28s_linear_infinite_reverse]">
                <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-purple-400 glow-purple"/>
              </div>
              <div className="absolute inset-[22%] animate-[spin_36s_linear_infinite]">
                <div className="absolute left-1/2 bottom-0 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-200 glow-cyan"/>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function About(){
  const { t } = useLang();
  return (
    <section id="about" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <div className="divider-glow mb-16 w-32"/>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/90">{t.about.eyebrow}</div>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              {t.about.heading}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-[15px] leading-8 text-white/75">{t.about.body1}</p>
            <p className="mt-5 text-[15px] leading-8 text-white/65">{t.about.body2}</p>
          </Reveal>
        </div>

        {/* Meta grid */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] sm:grid-cols-2">
          {t.about.meta.map((m,i)=>(
            <Reveal key={m.k} delay={i*100}>
              <div className="border border-white/5 bg-[#06081a]/50 p-7 backdrop-blur-md transition hover:bg-[#06081a]/80">
                <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">{m.k}</div>
                <div className="mt-3 text-lg font-medium text-white">{m.v}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Vision + Mission */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-3xl border border-cyan-300/30 bg-[#06081a]/70 p-8 backdrop-blur-md glow-cyan">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl"/>
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-300/10"><I.target className="h-5 w-5 text-cyan-300"/></span>
                <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300">{t.about.vision.eyebrow}</div>
              </div>
              <p className="relative mt-6 text-[15px] leading-8 text-white/80">{t.about.vision.body}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-purple-400/30 bg-[#06081a]/70 p-8 backdrop-blur-md glow-purple">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-400/15 blur-3xl"/>
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-purple-300/40 bg-purple-300/10"><I.compass className="h-5 w-5 text-purple-300"/></span>
                <div className="text-[11px] uppercase tracking-[0.4em] text-purple-300">{t.about.mission.eyebrow}</div>
              </div>
              <p className="relative mt-6 text-[15px] leading-8 text-white/80">{t.about.mission.body}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Focus(){
  const { t } = useLang();
  // Icon + accent are layout-fixed; titles + text come from translations.
  const layout = [
    { icon: I.cpu,    accent: 'cyan'   },
    { icon: I.flow,   accent: 'purple' },
    { icon: I.stack,  accent: 'cyan'   },
    { icon: I.rocket, accent: 'purple' },
  ];
  const items = layout.map((l, i) => ({ ...l, ...t.focus.items[i] }));
  return (
    <section id="focus" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <Reveal className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.4em] text-purple-300/90">{t.focus.eyebrow}</div>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              {t.focus.heading}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="max-w-md text-[14px] leading-7 text-white/60">{t.focus.sub}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {items.map((c,i)=>{
            const Icn = c.icon;
            const isCyan = c.accent==='cyan';
            return (
              <Reveal key={c.title} delay={(i%2)*120}>
                <div className={`group relative h-full overflow-hidden rounded-[28px] border bg-[#06081a]/70 p-8 backdrop-blur-md transition hover:-translate-y-1 ${isCyan?'border-cyan-300/20 hover:border-cyan-300/40 hover:glow-cyan':'border-purple-400/20 hover:border-purple-400/40 hover:glow-purple'}`}>
                  <div aria-hidden className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-opacity ${isCyan?'bg-cyan-400/10 group-hover:bg-cyan-400/25':'bg-purple-400/10 group-hover:bg-purple-400/25'}`}/>
                  <div className="relative flex items-start justify-between">
                    <div className={`grid h-14 w-14 place-items-center rounded-2xl border ${isCyan?'border-cyan-300/30 bg-cyan-300/5':'border-purple-400/30 bg-purple-400/5'}`}>
                      <Icn className={`h-6 w-6 ${isCyan?'text-cyan-300':'text-purple-300'}`}/>
                    </div>
                    <span className={`font-display text-[11px] font-bold tracking-[0.3em] ${isCyan?'text-cyan-300/80':'text-purple-300/80'}`}>0{i+1}</span>
                  </div>
                  <h3 className="relative mt-6 text-2xl font-semibold text-white">{c.title}</h3>
                  <p className="relative mt-3 text-[14px] leading-7 text-white/70">{c.text}</p>
                  <div className={`relative mt-8 h-px w-full bg-gradient-to-r ${isCyan?'from-cyan-300/60 via-white/10 to-transparent':'from-purple-400/60 via-white/10 to-transparent'}`}/>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Principles(){
  const { t } = useLang();
  const parts = t.principles.brandStatementParts;
  return (
    <section id="principles" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/90">{t.principles.eyebrow}</div>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              {t.principles.heading}
            </h2>
            <div className="mt-10 rounded-3xl border border-gradient-to-r border-cyan-300/20 bg-[#06081a]/70 p-7 backdrop-blur-md"
                 style={{borderImage:'linear-gradient(135deg,rgba(34,211,238,0.4),rgba(168,85,247,0.4)) 1'}}>
              <div className="text-[11px] uppercase tracking-[0.38em] text-purple-300">{t.principles.brandStatementLabel}</div>
              <p className="mt-4 text-lg leading-8 text-white/85">
                {parts[0]}
                <span className="text-glow-cyan text-cyan-200">{parts[1]}</span>
                {parts[2]}
                <span className="text-glow-purple text-purple-200">{parts[3]}</span>
                {parts[4]}
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {t.principles.items.map((label, i)=>(
              <Reveal key={label} delay={i*110}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#06081a]/70 p-7 backdrop-blur-md transition hover:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className={`font-display text-3xl font-bold ${i%2===0?'text-cyan-300 text-glow-cyan':'text-purple-300 text-glow-purple'}`}>
                      0{i+1}
                    </span>
                    <span className={`grid h-9 w-9 place-items-center rounded-full border ${i%2===0?'border-cyan-300/40 bg-cyan-300/10':'border-purple-400/40 bg-purple-400/10'}`}>
                      <I.check className={`h-4 w-4 ${i%2===0?'text-cyan-300':'text-purple-300'}`}/>
                    </span>
                  </div>
                  <div className="mt-6 text-lg font-medium text-white">{label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Founders(){
  const { t } = useLang();
  // Names + initials + accent are language-independent; role/description/tags
  // come from translations.
  const fixed = [
    { name: 'Jann Gabriel Guillermety',    initials: 'JG', accent: 'cyan'   },
    { name: 'Edwin Gabriel Garcia Flores', initials: 'EG', accent: 'purple' },
  ];
  const people = fixed.map((p, i) => ({ ...p, ...t.founders.people[i] }));
  return (
    <section id="founders" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <Reveal className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.4em] text-purple-300/90">{t.founders.eyebrow}</div>
          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
            {t.founders.headingPrefix}<span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">{t.founders.headingAccent}</span>
          </h2>
          <p className="mt-6 text-[15px] leading-8 text-white/70">{t.founders.sub}</p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {people.map((p,i)=>{
            const isCyan = p.accent==='cyan';
            return (
              <Reveal key={p.name} delay={i*120}>
                <div className={`group relative h-full overflow-hidden rounded-3xl border bg-[#06081a]/70 p-8 backdrop-blur-md transition hover:-translate-y-1 ${isCyan?'border-cyan-300/25 hover:glow-cyan':'border-purple-400/25 hover:glow-purple'}`}>
                  <div aria-hidden className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl ${isCyan?'bg-cyan-400/15':'bg-purple-400/15'}`}/>
                  <div className="relative flex items-start gap-5">
                    <div className={`shrink-0 grid h-20 w-20 place-items-center rounded-2xl border text-lg font-display font-bold tracking-[0.1em] ${isCyan?'border-cyan-300/40 bg-cyan-300/10 text-cyan-200 glow-cyan':'border-purple-400/40 bg-purple-400/10 text-purple-200 glow-purple'}`}>
                      {p.initials}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[10.5px] uppercase tracking-[0.22em] ${isCyan?'text-cyan-200/85':'text-purple-200/85'}`}>{p.role}</div>
                      <div className="mt-1.5 text-xl font-semibold text-white leading-snug">{p.name}</div>
                    </div>
                  </div>
                  <div className="relative mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"/>
                  <p className="relative mt-6 text-[14px] leading-7 text-white/70">{p.description}</p>
                  <div className="relative mt-6 flex flex-wrap gap-2">
                    {p.tags.map(tag=>(
                      <span key={tag} className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.04em] backdrop-blur-sm ${isCyan?'border-cyan-300/30 bg-cyan-300/[0.06] text-cyan-100/85':'border-purple-400/30 bg-purple-400/[0.06] text-purple-100/85'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Shared responsibility statement — visually separated, still part of section */}
        <Reveal delay={200}>
          <div className="mt-16">
            <div className="flex items-center justify-center gap-4" aria-hidden>
              <span className="h-px w-20 bg-gradient-to-r from-transparent via-cyan-300/40 to-purple-400/40"/>
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-cyan-300 to-purple-400 glow-cyan"/>
              <span className="h-px w-20 bg-gradient-to-r from-purple-400/40 via-cyan-300/40 to-transparent"/>
            </div>
            <p className="mx-auto mt-7 max-w-3xl text-center font-display text-2xl font-medium leading-[1.35] tracking-[-0.015em] text-white sm:text-[28px]">
              {t.founders.sharedPrefix}
              <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">{t.founders.sharedAccent}</span>.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-center text-[14px] leading-7 text-white/60">
              {t.founders.sharedSupport}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Inquiry endpoint
// ───────────────────────────────────────────────────────────────────────────
// All inquiries go through the GALTRIX Apps Script. The script:
//   1. Stores the inquiry as "pending" in a Google Sheet
//   2. Sends a verification email to the submitter (24h TTL)
//   3. Once the link is clicked, marks the row "verified" AND fires Formspree
//      server-side (which still runs the Telegram + admin Gmail flow)
//
// See APPS_SCRIPT_SETUP.md for the script properties (SHEET_ID, FORMSPREE_URL,
// DASHBOARD_KEY, SITE_BASE_URL) that need to be set on the Apps Script side.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby01wraZ1Bew0Af1OycbeqMrcmjsnrq4OgsqAyqyspaYTdE9zF-a8AYMe2ArUihiguA/exec';

// Mirror of the Apps Script's disposable-domain blocklist so we can fail
// fast on the frontend. Keep this list in sync with DISPOSABLE_DOMAINS in
// apps-script/galtrix-confirmation.gs.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','tempmail.net',
  'temp-mail.org','10minutemail.com','10minutemail.net','yopmail.com',
  'throwawaymail.com','getairmail.com','sharklasers.com','maildrop.cc',
  'trashmail.com','fakeinbox.com','mintemail.com','mohmal.com',
]);

// Returns null if the email is acceptable, or a user-facing error string.
// Accepts a translation table so messages are localized to the current language.
function emailValidationError(raw, tv){
  const s = String(raw || '').trim();
  if (!s) return tv.email;
  if (s.length > 254) return tv.emailLong;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return tv.emailFormat;
  const [local, domain] = s.split('@');
  if (local.length > 64) return tv.emailLocalLong;
  if (domain.indexOf('..') !== -1) return tv.emailDomainDots;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return tv.emailDomainBad;
  const dom = domain.toLowerCase();
  for (const d of DISPOSABLE_DOMAINS) {
    if (dom === d || dom.endsWith('.' + d)) {
      return tv.emailDisposable;
    }
  }
  return null;
}

function Contact(){
  const { t, lang } = useLang();
  const [form, setForm] = useState({ fullName:'', email:'', company:'', project:'' });
  // statuses:
  //   'idle' | 'sending'
  //   'pending'  — Apps Script accepted the inquiry, verification email sent
  //   'error'    — server returned ok:false, or the request itself failed
  const [status, setStatus] = useState('idle');
  const [validationError, setValidationError] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');

  const onChange = (k)=>(e)=>{
    setForm(f=>({...f,[k]:e.target.value}));
    if (validationError) setValidationError('');
  };

  const validate = ()=>{
    if (!form.fullName.trim()) return t.contact.validation.name;
    const emailErr = emailValidationError(form.email, t.contact.validation);
    if (emailErr) return emailErr;
    if (!form.project.trim()) return t.contact.validation.project;
    return '';
  };

  const submit = async (e)=>{
    e.preventDefault();
    const err = validate();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    setServerMessage('');
    setStatus('sending');

    // Send to the GALTRIX Apps Script. Using text/plain avoids the CORS
    // preflight that Apps Script Web Apps don't handle, while still letting
    // us READ the JSON response (which 'no-cors' would block).
    // `lang` is forwarded so future Apps Script versions can localize the
    // verification email — current script ignores unknown fields safely.
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body:   JSON.stringify({
          name:    form.fullName.trim(),
          email:   form.email.trim(),
          company: form.company.trim(),
          message: form.project.trim(),
          source:  'Galtrix Website Contact Form',
          lang:    lang,
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
      });
      let json = null;
      try { json = await res.json(); } catch (_) { /* non-JSON */ }
      if (res.ok && json && json.ok) {
        setVerifyEmail(form.email.trim());
        setStatus('pending');
      } else {
        setServerMessage((json && json.error) || t.contact.errorGeneric);
        setStatus('error');
      }
    } catch (netErr) {
      setServerMessage(t.contact.errorNetwork);
      setStatus('error');
    }
  };

  const reset = ()=>{
    setStatus('idle');
    setForm({fullName:'',email:'',company:'',project:''});
    setVerifyEmail('');
    setServerMessage('');
    setValidationError('');
  };

  const inputBase = "w-full rounded-2xl border bg-[#04050d]/60 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 transition focus:bg-[#04050d]/90";

  return (
    <section id="contact" className="relative border-t border-white/10 cv-auto">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-28 lg:grid-cols-[1fr_0.95fr] lg:px-10">
        <Reveal>
          <div className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/90">{t.contact.eyebrow}</div>
          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
            {t.contact.heading}
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-8 text-white/70">{t.contact.sub}</p>
          <ul className="mt-10 space-y-4 text-[14px] text-white/80">
            {t.contact.bullets.map((b, i)=>(
              <li key={b} className="flex items-center gap-3">
                <span className={`grid h-6 w-6 place-items-center rounded-full border ${i%2===0?'border-cyan-300/40 bg-cyan-300/10':'border-purple-400/40 bg-purple-400/10'}`}>
                  <I.check className={`h-3.5 w-3.5 ${i%2===0?'text-cyan-200':'text-purple-200'}`}/>
                </span>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={140}>
          <form
            onSubmit={submit}
            noValidate
            className="relative overflow-hidden rounded-[32px] border border-cyan-300/20 bg-[#06081a]/80 p-7 backdrop-blur-md glow-cyan">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"/>
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-400/15 blur-3xl"/>

            <input type="hidden" name="source" value="Galtrix Website Contact Form" />
            <input type="hidden" name="lang" value={lang} />

            {status === 'pending' ? (
              <div className="relative flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 glow-cyan">
                  {/* mail-open icon */}
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9.5L12 4l9 5.5"/>
                    <path d="M3 9.5V19a2 2 0 002 2h14a2 2 0 002-2V9.5"/>
                    <path d="M3 9.5l9 7 9-7"/>
                  </svg>
                </div>
                <div className="text-xl font-semibold text-white">{t.contact.pending.heading}</div>
                <p className="max-w-md text-[14px] leading-7 text-white/70">
                  {t.contact.pending.bodyPrefix}
                  <span className="font-semibold text-cyan-200 break-all">{verifyEmail}</span>
                  {t.contact.pending.bodySuffix}
                </p>
                <p className="max-w-md text-[12px] leading-6 text-white/45">
                  {t.contact.pending.expiryPrefix}
                  <button type="button" onClick={reset} className="text-cyan-300 underline-offset-2 hover:underline">{t.contact.pending.tryAnother}</button>.
                </p>
                <button type="button" onClick={reset}
                  className="mt-4 rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white">
                  {t.contact.pending.sendAnother}
                </button>
              </div>
            ) : (
              <div className="relative grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">{t.contact.labels.fullName}</span>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange('fullName')}
                    required
                    className={`${inputBase} border-white/10 focus:border-cyan-300/50`}
                    placeholder={t.contact.placeholders.fullName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">{t.contact.labels.email}</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange('email')}
                    required
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                    className={`${inputBase} border-white/10 focus:border-purple-400/50`}
                    placeholder={t.contact.placeholders.email} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">{t.contact.labels.company} <span className="text-white/30 normal-case tracking-normal">{t.contact.labels.companyOptional}</span></span>
                  <input
                    name="company"
                    value={form.company}
                    onChange={onChange('company')}
                    className={`${inputBase} border-white/10 focus:border-cyan-300/50`}
                    placeholder={t.contact.placeholders.company} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.3em] text-white/50">{t.contact.labels.project}</span>
                  <textarea
                    name="project"
                    value={form.project}
                    onChange={onChange('project')}
                    required
                    className={`${inputBase} min-h-[140px] border-white/10 focus:border-cyan-300/50`}
                    placeholder={t.contact.placeholders.project} />
                </label>
                <button type="submit" disabled={status==='sending'}
                  className="group mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-4 text-sm font-semibold text-[#04050d] glow-cyan transition hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] disabled:opacity-70">
                  {status==='sending' ? t.contact.submitSending : t.contact.submit}
                  <I.arrow className="h-4 w-4 transition group-hover:translate-x-0.5"/>
                </button>
                {validationError && (
                  <p className="text-center text-[13px] text-amber-300/90">{validationError}</p>
                )}
                {status === 'error' && (
                  <p className="text-center text-[13px] text-red-300/90">
                    {serverMessage || t.contact.errorGeneric}
                  </p>
                )}
                <p className="text-center text-[11px] uppercase tracking-[0.25em] text-white/35">
                  {t.contact.privacyNote}
                </p>
              </div>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}

// LegalModal — opens when the user clicks Privacy/Terms/Security in the
// footer. Pulls content from TRANSLATIONS.legal[slug] so the modal title
// + body switch language live with the EN/ES toggle.
function LegalModal({ slug, onClose }){
  const { t } = useLang();
  const closeBtnRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(()=>{
    if (!slug) return;
    triggerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(()=>closeBtnRef.current?.focus(), 0);
    const onKey = (e)=>{ if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return ()=>{
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
      const trigger = triggerRef.current;
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    };
  }, [slug, onClose]);

  if (!slug) return null;
  const data = t.legal[slug];
  if (!data) return null;
  const isCyan = data.accent === 'cyan';
  const titleId = `legal-modal-title-${slug}`;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId}
         className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 sm:px-6"
         onClick={(e)=>{ if (e.target === e.currentTarget) onClose(); }}>
      <div aria-hidden className="absolute inset-0 bg-[#02030a]/80 backdrop-blur-md"/>
      <div className={`relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-[#06081a]/85 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ${isCyan?'border-cyan-300/30 glow-cyan':'border-purple-400/30 glow-purple'}`}
           onClick={(e)=>e.stopPropagation()}>
        <div aria-hidden className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${isCyan?'bg-cyan-400/15':'bg-purple-400/15'}`}/>
        <div aria-hidden className={`pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl ${isCyan?'bg-cyan-400/10':'bg-purple-400/10'}`}/>

        <button ref={closeBtnRef} type="button" onClick={onClose}
                aria-label={t.legal[slug].modalTitle + ' — close'}
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className={`text-[11px] uppercase tracking-[0.4em] ${isCyan?'text-cyan-300/90':'text-purple-300/90'}`}>{data.eyebrow}</div>
          <h2 id={titleId} className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl">
            {data.modalTitle}
          </h2>
          <p className="mt-4 max-w-xl text-[14px] leading-7 text-white/65">{data.intro}</p>
          <div className={`mt-6 h-px w-24 bg-gradient-to-r ${isCyan?'from-cyan-300/70 to-transparent':'from-purple-400/70 to-transparent'}`}/>
          <div className="mt-8 space-y-6">
            {data.blocks.map(b => (
              <div key={b.h}>
                <div className={`text-[11px] uppercase tracking-[0.32em] ${isCyan?'text-cyan-200/85':'text-purple-200/85'}`}>{b.h}</div>
                <p className="mt-2 text-[14.5px] leading-8 text-white/75">{b.p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ onOpenLegal }){
  const { t } = useLang();
  // Anchor columns — scroll/jump to sections. Headings + labels translate;
  // hash targets stay as the anchor IDs (which are language-independent).
  const companyHrefs = ['#about','#founders','#principles','#contact'];
  const focusHrefs   = ['#focus','#focus','#focus','#focus'];
  const cols = [
    { h: t.footer.cols.company, l: t.footer.companyItems.map((label, i)=>({ t: label, h: companyHrefs[i] })) },
    { h: t.footer.cols.focus,   l: t.footer.focusItems.map((label, i)=>({ t: label, h: focusHrefs[i] })) },
  ];
  // Legal column → buttons that open the LegalModal (no anchor scroll).
  const legal = [
    { t: t.footer.legalItems.privacy,  slug: 'privacy'  },
    { t: t.footer.legalItems.terms,    slug: 'terms'    },
    { t: t.footer.legalItems.security, slug: 'security' },
  ];
  return (
    <footer className="relative border-t border-white/10 bg-[#04050d]/90 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Logo full/>
          <p className="mt-5 max-w-xs text-[13px] leading-7 text-white/55">
            {t.footer.tagline}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 glow-cyan"/>
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/65">{t.footer.operating}</span>
          </div>
        </div>
        {cols.map(c=>(
          <div key={c.h}>
            <div className="text-[11px] uppercase tracking-[0.4em] text-white/40">{c.h}</div>
            <ul className="mt-5 space-y-3">
              {c.l.map(x=>(
                <li key={x.t}><a href={x.h} className="text-[14px] text-white/70 transition hover:text-white">{x.t}</a></li>
              ))}
            </ul>
          </div>
        ))}
        {/* Legal column — buttons open the modal */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.4em] text-white/40">{t.footer.cols.legal}</div>
          <ul className="mt-5 space-y-3">
            {legal.map(x=>(
              <li key={x.slug}>
                <button type="button" onClick={()=>onOpenLegal(x.slug)}
                        className="text-[14px] text-white/70 transition hover:text-white text-left">
                  {x.t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-6 py-6 text-[12px] uppercase tracking-[0.3em] text-white/45 md:flex-row md:items-center lg:px-10">
          <div>© {new Date().getFullYear()} GALTRIX — {t.footer.copyright}</div>
          <div className="flex items-center gap-6">
            {legal.map(x=>(
              <button key={x.slug} type="button" onClick={()=>onOpenLegal(x.slug)} className="transition hover:text-white">
                {x.t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function App(){
  // Language ('en' | 'es') — restored from localStorage on first paint.
  const [lang, setLangState] = useState(readSavedLang);
  // Which legal modal is open ('privacy' | 'terms' | 'security' | null).
  const [legalSlug, setLegalSlug] = useState(null);

  const setLang = (next)=>{
    if (!VALID_LANGS.includes(next)) return;
    setLangState(next);
    try { window.localStorage.setItem(LANG_STORAGE_KEY, next); } catch (_) {}
  };

  useEffect(()=>{ document.documentElement.style.scrollBehavior = 'smooth'; }, []);
  // Keep <html lang="…"> in sync for screen readers and SEO.
  useEffect(()=>{ document.documentElement.lang = lang; }, [lang]);

  const langCtx = useMemo(()=>({ lang, setLang, t: TRANSLATIONS[lang] }), [lang]);

  return (
    <LangContext.Provider value={langCtx}>
      <div className="min-h-screen text-white selection:bg-cyan-400/30">
        <Header/>
        <main>
          <Hero/>
          <About/>
          <Focus/>
          <Principles/>
          <Founders/>
          <Contact/>
          {/* Legal moved to LegalModal — opened from footer Privacy/Terms/Security */}
        </main>
        <Footer onOpenLegal={setLegalSlug}/>
        <LegalModal slug={legalSlug} onClose={()=>setLegalSlug(null)}/>
      </div>
    </LangContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
