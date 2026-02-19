import { FormType } from '@/lib/types'

/**
 * Aggregates IEP form submissions by formSubmissionId to combine multiple goal-based entries
 * into a single row with total points. This ensures history shows one row per submission
 * with total points (same as PDF format).
 * 
 * @param data - Array of point history entries
 * @returns Aggregated array with IEP entries combined by formSubmissionId
 */
export const aggregateHistoryData = (data: any[]) => {
  const groupedData: { [key: string]: any } = {};
  const nonIEPData: any[] = [];

  data.forEach((item) => {
    // For IEP forms, group by formSubmissionId
    if (item.formType === FormType.AwardPointsIEP && item.formSubmissionId) {
      const submissionId = String(item.formSubmissionId);
      if (!groupedData[submissionId]) {
        groupedData[submissionId] = {
          ...item,
          points: item.points || 0,
        };
      } else {
        groupedData[submissionId].points += item.points || 0;
      }
    } else {
      // Non-IEP forms or entries without formSubmissionId go as-is
      nonIEPData.push(item);
    }
  });

  // Combine grouped IEP entries with non-IEP entries
  return [...Object.values(groupedData), ...nonIEPData];
}

