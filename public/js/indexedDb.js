let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
  event.target.result.createObjectStore("pendingTransaction", {
    keyPath: "pendingTransaction",
    autoIncrement: true
  });
};

request.onerror = (err) => {
  console.log(err.message);
};

request.onsuccess = (event) => {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};


function saveRecord(record) {
  const transaction = db.transaction("pendingTransaction", "readwrite");
  const store = transaction.objectStore("pendingTransaction");
  store.add(record);
}


function checkDatabase() {
  const transaction = db.transaction("pendingTransaction", "readonly");
  const storedTransaction = transaction.objectStore("pendingTransaction");
  const getAll = storedTransaction.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then((response) => response.json())
        .then(() => {
          const transaction = db.transaction("pendingTransaction", "readwrite");
          const storedTransaction = transaction.objectStore("pendingTransaction");
          storedTransaction.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);