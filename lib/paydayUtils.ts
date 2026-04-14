/**
 * Returns true if `today` is a payday for the given salary configuration.
 *
 * For cycle-based frequencies (Weekly, 2-weeks, 4-weeks) the `jobStartDate`
 * is used as the cycle anchor. If `jobStartDate` is null the user cannot be
 * checked and the function returns false.
 */
export function isPayday(
  salaryFrequency: string,
  dayOfMonthPaid: number,
  jobStartDate: Date | null,
  today: Date
): boolean {
  const dayOfMonth = today.getDate();

  switch (salaryFrequency) {
    case "Monthly":
      return dayOfMonth === dayOfMonthPaid;

    case "Twice Monthly":
      return dayOfMonth === 1 || dayOfMonth === dayOfMonthPaid;

    case "Weekly": {
      if (!jobStartDate) return false;
      return daysSince(jobStartDate, today) % 7 === 0;
    }

    case "2-weeks": {
      if (!jobStartDate) return false;
      return daysSince(jobStartDate, today) % 14 === 0;
    }

    case "4-weeks": {
      if (!jobStartDate) return false;
      return daysSince(jobStartDate, today) % 28 === 0;
    }

    default:
      return false;
  }
}

function daysSince(referenceDate: Date, today: Date): number {
  const referenceMs = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((todayMs - referenceMs) / 86_400_000);
}
