/**
 * Calendar-day formatting in the player's own timezone.
 *
 * `new Date(ms).toISOString().slice(0, 10)` is the tempting one-liner and it is
 * wrong: it reports the UTC day. A player in UTC+12 who finishes a run at 09:00
 * on Monday sees Sunday's date in their run history; west of Greenwich the same
 * construction rolls the date forward after an evening session. The run happened
 * on the player's Monday, so that is the day to show.
 *
 * Using the local getters instead of an offset subtraction keeps this correct
 * across daylight-saving transitions, where the offset is not constant.
 */
export function localDayKey(epochMs: number): string {
  const date = new Date(epochMs);
  if (!Number.isFinite(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
