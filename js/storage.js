const RECORDS_KEY = "studyjap.practiceRecords.v1";

export function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveRecord(record) {
  const records = getRecords();
  const nextRecords = [record, ...records].slice(0, 30);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(nextRecords));
  return nextRecords;
}

export function getRecord(id) {
  return getRecords().find((record) => record.id === id);
}
