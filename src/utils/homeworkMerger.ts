import { Homework } from "@/types/homework";

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\säöüß]/g, "")
    .trim();
}

// Check if two homeworks are duplicates
export function areDuplicates(hw1: Homework, hw2: Homework): boolean {
  // Same subject
  if (hw1.subject !== hw2.subject) return false;
  
  // Same date
  if (hw1.dueDate.toDateString() !== hw2.dueDate.toDateString()) return false;
  
  // Similar description (normalized)
  const desc1 = normalizeText(hw1.description);
  const desc2 = normalizeText(hw2.description);
  
  // Exact match or very similar (allow 10% difference)
  if (desc1 === desc2) return true;
  
  const similarity = calculateSimilarity(desc1, desc2);
  return similarity > 0.9;
}

// Calculate text similarity (simple approach)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance for similarity calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Merge homework arrays, combining sourceFileIds for duplicates
export function mergeHomeworks(existing: Homework[], newHomeworks: Homework[]): Homework[] {
  const merged = [...existing];

  for (const newHw of newHomeworks) {
    const duplicateIndex = merged.findIndex(existingHw => areDuplicates(existingHw, newHw));
    
    if (duplicateIndex !== -1) {
      // If duplicate found, add the new sourceFileIds to existing homework
      const existingHw = merged[duplicateIndex];
      const combinedFileIds = [...new Set([...existingHw.sourceFileIds, ...newHw.sourceFileIds])];
      merged[duplicateIndex] = {
        ...existingHw,
        sourceFileIds: combinedFileIds
      };
    } else {
      // If not a duplicate, add as new homework
      merged.push(newHw);
    }
  }

  return merged;
}
