export const DEFAULT_TEMPLATE = `# PRÜFUNGSBERICHT nach § 53 Genossenschaftsgesetz
für **{{@name}}**, Sitz in **{{@registeredOffice}}**
Prüfungszeitraum: Geschäftsjahre **{{@fiscalYears}}**

---

## Prüfungsbescheinigung
Hiermit bescheinigen wir der **{{@name}}** mit Sitz in **{{@registeredOffice}}** die Durchführung der Prüfung gemäß § 53 Abs. 1 Genossenschaftsgesetz. Die Prüfung wurde durchgeführt für die Geschäftsjahre **{{@fiscalYears}}**.

Hildesheim, **{{@certificatePlaceDate}}**
**{{@associationName}}**

Vorstand: **{{@signer1}}**  
Vorstand: **{{@signer2}}**

---

## I. Auftrag und Auftragsdurchführung der Prüfung
Der Deutsche Interessenverband der Kleingenossenschaften e.V. – im weiteren „Verband“ – führte bei der Genossenschaft die Prüfung nach den geltenden Vorschriften (§ 53 GenG) durch.

Gegenstand unserer Prüfung gemäß § 53 Abs. 1 GenG zwecks Feststellung der wirtschaftlichen Verhältnisse und der Ordnungsmäßigkeit der Geschäftsführung waren die Einrichtungen, die Vermögenslage sowie die Geschäftsführung der Genossenschaft. *Die Prüfung der Jahresabschlüsse* zum **{{@fiscalYears}}** war nicht Gegenstand unserer Tätigkeit.

Der Vorstand der Genossenschaft hat uns mit Schreiben vom **{{@engagementLetterDate}}** beauftragt, die Prüfung gemäß § 53 GenG durchzuführen. Die Prüfung wurde durch interne Verbandsprüfer vorgenommen.

Erklärung nach § 55 Abs. 2 GenG (Befangenheit): Keiner der gesetzlichen Vertreter, Mitarbeiter oder Prüfer des Verbandes ist zugleich Mitarbeiter, Mitglied, Mitglied des Vorstandes oder Aufsichtsrates der zu prüfenden Genossenschaft.

---

## II. Unterlagen zum Prüfungsbericht
Als Grundlage für die Erstellung unseres Prüfungsberichts lagen uns u. a. vor:
- Protokolle der Generalversammlungen im Prüfungszeitraum
- Beschlossene Satzung sowie etwaige Änderungen
- Auszug aus dem Genossenschaftsregister und die Gewerbeanmeldung
- Aktuelle Mitgliederliste sowie Mitgliederlisten am Ende jedes Prüfungsjahres
- Jahresabschlüsse zum Ende eines jeden Prüfungsjahres sowie die aktuelle BWA
- Summen- und Saldenlisten sowie Sachkonten
- Steuerbescheide und Nachweise der Offenlegung im Bundesanzeiger
- Verträge von besonderer Bedeutung
- Offenlegung von Mitgliederdarlehen

Auskunftsperson der Genossenschaft bei der Prüfung war der gewählte Vorstand der Genossenschaft. Uns wurden alle verlangten Aufklärungen und Nachweise bereitwillig erbracht.

---

## III. Rechtliche Grundlagen
**{{@legalPurposeText}}**

Gegenstand des Unternehmens ist die Erbringung von Dienstleistungen und Handelsgeschäften als Produktivgenossenschaft.

Jedes Mitglied ist verpflichtet, mindestens einen Geschäftsanteil zu übernehmen und sofort einzuzahlen.

Hinsichtlich der gemäß § 9 GenG vorgeschriebenen Organe besteht die Genossenschaft aus Vorstand und Aufsichtsrat. Zum Zeitpunkt der Prüfung hat die Genossenschaft **{{@membersCount}}** Mitglieder. Bis zur Aufnahme des 21. Mitglieds nimmt eine/r Bevollmächtigte/r der Generalversammlung die Aufgaben des Aufsichtsrats wahr.

Vorstand: **{{@boardMember1}}**  
Vorstand: **{{@boardMember2}}**  
Bevollmächtigter der Generalversammlung: **{{@generalAssemblyRepresentative}}**

- Höhe des Geschäftsanteils: **{{@shareAmount}}**
- Kündigungsfrist: **{{@noticePeriod}}**
- Nachschusspflicht der Mitglieder: **{{@liabilityClause}}**

---

## IV. Mitgliederförderung
**{{@promotionSummary}}**

Aus dem Förderbericht ergibt sich, dass die Mitglieder in folgender Weise **{{@promotionVerb}}** :
**{{@promotionDetails}}**

**{{@noDoubtsClause}}**

---

## V. Geschäftsbetrieb
Die Genossenschaft **{{@businessOperationsText}}**

---

## VI. Rechnungslegung und wirtschaftliche Verhältnisse
Für die Geschäftsjahre **{{@accountingYears}}** wurden dem Prüfungsverband die Jahresabschlüsse vorgelegt. Aus den vorgelegten Jahresabschlüssen ergibt sich **{{@profitYearIntro}}** **{{@profitText}}**

Im Prüfungszeitraum wurden **{{@memberLoans}}** Mitgliederdarlehen aufgenommen.

Die eingereichten Unterlagen lassen **{{@bookkeepingDeficiencyWord}}** Mangel an der Buchführung oder dem unternehmerischen Handeln des Vorstands erkennen. Eine Gefährdung der Belange der Mitglieder ist nicht zu besorgen.

---

## VII. Mitglieder
Die Genossenschaft besteht zum Ende des Prüfungszeitraumes aus **{{@membershipStatus}}**. Zum Beginn des Prüfungszeitraumes bestand die Genossenschaft aus lediglich einem **{{@membershipGrowthText}}** Der Prüfungsverband begrüßt diese Entwicklung. Die ordentlichen Mitglieder haben zurzeit insgesamt **{{@membershipSharesText}}**

---

## VIII. Fazit
Nach der Prüfung gemäß § 53 Abs. 1 GenG (Feststellung der wirtschaftlichen Verhältnisse, Ordnungsmäßigkeit der Geschäftsführung, Einrichtungen sowie Vermögenslage) bestätigen wir auf Grundlage der vorgelegten Unterlagen und erteilten Auskünfte:
- Die Satzung entspricht den Vorschriften des Genossenschaftsgesetz.
- Die wirtschaftlichen Verhältnisse sind geordnet.
- Die Geschäftsführung ist ordnungsgemäß.
- Eine Gefährdung der Belange der Mitglieder oder der Gläubiger der Genossenschaft ist aktuell nicht zu besorgen.

---

## IX. Weiteres Vorgehen
Am **{{@briefingDate}}** wurden Vorstand und Bevollmächtigte der Generalversammlung über die wesentlichen Feststellungen der Prüfung unterrichtet.

Nach § 59 Abs. 1 GenG hat der Vorstand den Prüfungsbericht bei Einberufung der nächsten Generalversammlung als Gegenstand der Beratung und möglichen Beschlussfassung anzukündigen.

**{{@closingPlaceDate}}**

Vorstand: **{{@signer1}}**  
Vorstand: **{{@signer2}}**
`;
