import { Homework } from "@/types/homework";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc as unknown as string;

function toDate(day: string, month: string, year: string) {
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

const SUBJECT_KEYWORDS = [
  "Mathematik",
  "Deutsch",
  "Englisch",
  "Geographie",
  "Geschichte",
  "Evang. Religionslehre",
  "Islamischer Unterricht",
  "Ethik",
  "Sport",
  "Kunst",
  "Informationstechnologie",
  "Informatik",
];

function normalizeSubject(raw: string) {
  const cleaned = raw
    .replace(/Keine Hausaufgabe eingetragen\.?/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const found = SUBJECT_KEYWORDS.find((k) => cleaned.toLowerCase().includes(k.toLowerCase()));
  return found ?? cleaned;
}

export async function parsePDF(file: File, fileId: string): Promise<Homework[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items as any[]).map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  // 1) Alle Header (Fach + Lehrkraft) vorab extrahieren mit Index
  const headerRegex = /(?:#\s*)?([A-Za-zÄÖÜäöüß .()\/-]+?)\s*-\s*Lehrkraft:\s*([^()#\n]+?)(?=\s*(?:\(|Unterrichtsinhalt|Hausaufgabe|$))/g;
  type Header = { index: number; subject: string; teacher: string };
  const headers: Header[] = [];

  let hMatch: RegExpExecArray | null;
  while ((hMatch = headerRegex.exec(fullText)) !== null) {
    const subjectRaw = hMatch[1];
    const teacherRaw = hMatch[2];
    const subject = normalizeSubject(subjectRaw);
    const teacher = teacherRaw.replace(/\s{2,}/g, " ").trim();

    if (!/keine hausaufgabe/i.test(subject)) {
      headers.push({ index: hMatch.index, subject, teacher });
    }
  }

  // 2) Fälligkeiten suchen und auf den letzten Header mappen
  const dueRegex = /Zu\s*Erledigen\s*bis:\s*(\d{2})\.(\d{2})\.(\d{4})/gi;

  const homeworks: Homework[]= [];
  let match: RegExpExecArray | null;
  let foundCount = 0;

  while ((match = dueRegex.exec(fullText)) !== null) {
    foundCount++;
    const idx = match.index;
    const [fullMatch, dd, mm, yyyy] = match;
    const dueDate = toDate(dd, mm, yyyy);

    // Letzter Header vor idx
    const prevHeader = headers
      .filter((h) => h.index <= idx)
      .sort((a, b) => b.index - a.index)[0];

    if (!prevHeader) {
      continue;
    }

    // Extract lesson content and homework description
    const sectionText = fullText.slice(prevHeader.index, idx);
    
    // Extract lesson content
    const lessonContentMatch = sectionText.match(/Unterrichtsinhalt:?\s*(.*?)(?=\s*#?\s*Hausaufgabe|$)/is);
    const lessonContent = lessonContentMatch 
      ? lessonContentMatch[1]
          .replace(/Keine Hausaufgabe eingetragen\.?/gi, " ")
          .replace(/\s{2,}/g, " ")
          .trim()
      : "";
    
    // Extract homework description
    const hausIdx = sectionText.toLowerCase().lastIndexOf("hausaufgabe");
    let rawDesc = hausIdx >= 0 ? sectionText.slice(hausIdx + "hausaufgabe".length) : sectionText;

    const cleaned = rawDesc
      .replace(/Keine Hausaufgabe eingetragen\.?/gi, " ")
      .replace(/#?\s*Unterrichtsinhalt:?/gi, " ")
      .replace(/#?\s*Hausaufgabe:?/gi, " ")
      .replace(/Klassenbuch der Klasse.*?den\s*\d{2}\.\d{2}\.\d{4}/gi, " ")
      .replace(/Lehrkraft:/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/^[:‑\-\s]+/, "")
      .replace(/[:‑\-\s]+$/, "")
      .trim();


    if (cleaned.length <= 2) {
      continue;
    }

    homeworks.push({
      id: `${prevHeader.subject}-${dueDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      subject: prevHeader.subject,
      teacher: prevHeader.teacher,
      description: cleaned,
      lessonContent: lessonContent,
      dueDate,
      sourceFileIds: [fileId],
    });
  }

  return homeworks;
}

export function getSubjectColor(subject: string): string {
  const subjectLower = subject.toLowerCase();

  if (subjectLower.includes("mathematik") || subjectLower.includes("math")) {
    return "34 100% 55%"; // --math
  } else if (subjectLower.includes("deutsch")) {
    return "350 85% 60%"; // --deutsch
  } else if (subjectLower.includes("englisch") || subjectLower.includes("english")) {
    return "210 90% 55%"; // --english
  } else if (subjectLower.includes("geographie") || subjectLower.includes("erdkunde")) {
    return "140 60% 50%"; // --geography
  } else if (subjectLower.includes("geschichte")) {
    return "25 85% 55%"; // --history
  } else if (subjectLower.includes("religion") || subjectLower.includes("islamisch") || subjectLower.includes("evang")) {
    return "280 65% 60%"; // --religion
  } else if (subjectLower.includes("sport")) {
    return "120 50% 50%"; // --sport
  } else if (subjectLower.includes("kunst")) {
    return "320 80% 60%"; // --art
  } else if (subjectLower.includes("informatik") || subjectLower.includes("informationstechnologie") || subjectLower.includes("it")) {
    return "200 80% 55%"; // --it
  } else if (subjectLower.includes("ethik")) {
    return "180 60% 50%"; // --ethics
  }

  return "262 83% 58%"; // --primary
}
