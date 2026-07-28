"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

// Language Context
const LanguageContext = createContext();

const translations = {
  de: {
    // Sidebar section headers
    dashboard: "Dashboard",
    onboarding: "Onboarding",
    management: "Verwaltung",
    audits: "Audits",
    governance: "Governance",
    finance: "Finanzen",
    documents: "Dokumente",
    members: "Mitglieder",
    reports: "Berichte",
    tickets: "Tickets",
    assembly: "Versammlung",

    // Sidebar items
    overview: "Übersicht",
    transactions: "Transaktionen",
    payouts: "Auszahlungen",
    "notice board": "Mitteilungen",
    noticeboard: "Mitteilungen",
    "geng settings": "GenG-Einstellungen",
    settings: "Einstellungen",
    mails: "E-Mails",
    email: "E-Mails",
    esignature: "E-Signatur",
    calendar: "Kalender",
    "financial analysis": "Finanzanalyse",
    invoices: "Rechnungen",
    "datev export": "DATEV-Export",
    "share register summary": "Mitgliederliste",
    "financial year summary": "Kapitalkonten-Entwicklung",
    repository: "Archiv",
    sharing: "Freigaben",
    directory: "Verzeichnis",
    group: "Gruppen",
    "former members": "Ausgeschiedene Mitglieder",
    admin: "Administrator",
    member: "Mitglied",
    niederschrift: "Protokolle",
    filing: "Einreichungen",
    history: "Verlauf",
    discrepancy: "Abweichungen",
    "pending action": "Ausstehende Aktion",
    profile: "Profil",
    suggest: "Vorschlagen",
    explore: "Erkunden",
    "add cooperative": "Genossenschaft hinzufügen",
    "about us": "Über uns",
    "contact us": "Kontakt",
    logout: "Abmelden",
    "sign in": "Anmelden",
    "get started": "Loslegen",
    home: "Startseite",
    "for cooperatives": "Für Genossenschaften",
    "for members": "Für Mitglieder",
    pricing: "Preise",
    about: "Über uns",
    "choose role": "Rolle wählen",
    "book free demo": "Kostenlose Demo buchen",
    "sign up": "Registrieren",
    product: "Produkt",
    "use cases": "Anwendungsbereiche",
    company: "Unternehmen",
    legal: "Rechtliches",
    imprint: "Impressum",
    "privacy policy": "Datenschutzerklärung",
    contact: "Kontakt",
    "gdpr compliant": "DSGVO-konform",
    "secure and encrypted": "Sicher und verschlüsselt",
    "built for cooperatives": "Für Genossenschaften entwickelt",

    // Additional items
    "my shares": "Meine Anteile",
    notifications: "Benachrichtigungen",
    proposals: "Anträge",
    kündigung: "Kündigung",
    "kyc resubmission": "KYC-Neueinreichung",
    "data export": "Datenexport",
    "shared with me": "Mit mir geteilt",
    "assembly & shipping": "Einladung & Versand",
    "share subscription": "Anteilszeichnung",
    "loading...": "Wird geladen...",
    "total members": "Mitglieder gesamt",
    "active docs": "Aktive Dokumente",
    "upcoming assemblies": "Anstehende Verslg.",
    compliance: "Compliance",
    "in publications": "in Publikationen",
    in: "in",
    total: "gesamt",
    "good evening": "Guten Abend",
    user: "Mitglied",
    id: "ID",
    "---select cooperative---": "--- Genossenschaft auswählen ---",
    "all cooperatives": "Alle Genossenschaften",
    "no coops found": "Keine Genossenschaften gefunden",
    view: "Ansehen",
    Assemblies: "Vers.",
    "all assemblies": "Alle Versammlungen",
    "create assembly": "Versammlung erstellen",
    "polls dashboard": "Umfragen-Dashboard",
    "account verification": "Kontoverifizierung",
    "audit discrepancies": "Audit-Abweichungen",
    "admin onboarding": "Admin-Onboarding",
    "member onboarding": "Mitglieder-Onboarding",
    "audit log": "Audit-Protokoll",
    integrations: "Integrationen",
    upload: "Hochladen",
    share: "Freigabe",

    // UI elements
    processing: "Verarbeitung",
    "back to list": "Zurück zur Liste",
    compose: "Verfassen",
    inbox: "Posteingang",
    sent: "Gesendet",
    "mailbox status": "Postfach-Status",
    active: "Aktiv",
    "alias address": "Alias-Adresse",
    subject: "Betreff",
    to: "An",
    body: "Inhalt",
    send: "Senden",
    language: "Sprache",
  },
  en: {
    // Sidebar section headers
    dashboard: "Dashboard",
    onboarding: "Onboarding",
    management: "Management",
    audits: "Audits",
    governance: "Governance",
    finance: "Finance",
    documents: "Documents",
    members: "Members",
    reports: "Reports",
    tickets: "Tickets",
    assembly: "Assembly",

    // Sidebar items
    overview: "Overview",
    transactions: "Transactions",
    payouts: "Payouts",
    "notice board": "Notice Board",
    noticeboard: "Notice Board",
    "geng settings": "GenG Settings",
    settings: "Settings",
    mails: "Mails",
    email: "Mails",
    esignature: "eSignature",
    calendar: "Calendar",
    "financial analysis": "Financial Analysis",
    invoices: "Invoices",
    "datev export": "DATEV Export",
    "share register summary": "Share Register Summary",
    "financial year summary": "Financial Year Summary",
    repository: "Repository",
    sharing: "Sharing",
    directory: "Directory",
    group: "Group",
    "former members": "Former Members",
    admin: "Admin",
    member: "Member",
    niederschrift: "Niederschrift",
    filing: "Filing",
    history: "History",
    discrepancy: "Discrepancy",
    "pending action": "Pending Action",
    profile: "Profile",
    suggest: "Suggest",
    explore: "Explore",
    "add cooperative": "Add Cooperative",
    "about us": "About Us",
    "contact us": "Contact Us",
    logout: "Logout",
    "sign in": "Sign In",
    "get started": "Get Started",
    home: "Home",
    "for cooperatives": "For Cooperatives",
    "for members": "For Members",
    pricing: "Pricing",
    about: "About",
    "choose role": "Choose Role",
    "book free demo": "Book free Demo",
    "sign up": "Sign Up",
    product: "Product",
    "use cases": "Use Cases",
    company: "Company",
    legal: "Legal",
    imprint: "Imprint",
    "privacy policy": "Privacy Policy",
    contact: "Contact",
    "gdpr compliant": "GDPR Compliant",
    "secure and encrypted": "Secure and Encrypted",
    "built for cooperatives": "Built for Cooperatives",

    // Additional items
    "my shares": "My Shares",
    notifications: "Notifications",
    proposals: "Proposals",
    kündigung: "Kündigung",
    "kyc resubmission": "KYC Resubmission",
    "data export": "Data Export",
    "shared with me": "Shared with me",
    "assembly & shipping": "Notice & Attachments",
    "share subscription": "Share subscription",
    "loading...": "Loading...",
    "total members": "Total Members",
    "active docs": "Active Docs",
    "upcoming assemblies": "Upcoming Assemblies",
    compliance: "Compliance",
    "in publications": "in Publications",
    in: "in",
    total: "total",
    "good evening": "Good evening",
    user: "User",
    id: "ID",
    "---select cooperative---": "--- Select Cooperative ---",
    "all cooperatives": "All Cooperatives",
    "no coops found": "No coops found",
    view: "View",
    "all assemblies": "All Assemblies",
    Assemblies: "Assemblies",
    "create assembly": "Create Assembly",
    "polls dashboard": "Polls Dashboard",
    "account verification": "Account Verification",
    "audit discrepancies": "Audit Discrepancies",
    "admin onboarding": "Admin Onboarding",
    "member onboarding": "Member Onboarding",
    "audit log": "Audit Log",
    integrations: "Integrations",
    upload: "Upload",
    share: "Share",

    // UI elements
    processing: "Processing",
    "back to list": "Back to List",
    compose: "Compose",
    inbox: "Inbox",
    sent: "Sent",
    "mailbox status": "Mailbox Status",
    active: "Active",
    "alias address": "Alias Address",
    subject: "Subject",
    to: "To",
    body: "Body",
    send: "Send",
    language: "Language",
  },
};

// Initialize i18next
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      de: {
        translation: translations.de,
      },
      en: {
        translation: translations.en,
      },
    },
    lng: "de", // default language
    fallbackLng: "de",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
}

const LanguageProvider = ({ children }) => {
  const { i18n: i18nInstance } = useTranslation();
  const [language, setLanguage] = useState("de");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedLanguage = localStorage.getItem("language");
      if (
        storedLanguage &&
        (storedLanguage === "de" || storedLanguage === "en")
      ) {
        setLanguage(storedLanguage);
        i18nInstance.changeLanguage(storedLanguage);
      }
    }
  }, [i18nInstance]);

  const toggleLanguage = () => {
    const next = language === "de" ? "en" : "de";
    setLanguage(next);
    i18nInstance.changeLanguage(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", next);
    }
  };

  const t = (key) => {
    if (!key) return "";
    const cleanKey = key.trim();
    // Try matching case-sensitive
    const translation = i18nInstance.t(cleanKey);
    if (translation !== cleanKey) {
      return translation;
    }
    // Try matching case-insensitive
    const lowerKey = cleanKey.toLowerCase();
    const translationLower = i18nInstance.t(lowerKey);
    if (translationLower !== lowerKey) {
      return translationLower;
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t, mounted }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export { LanguageProvider, useLanguage };
