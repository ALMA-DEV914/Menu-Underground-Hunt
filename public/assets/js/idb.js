// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'recipe_hunt' and set it to version 1
const request = indexedDB.open('recipe_hunt', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_recipe`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_recipe', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadPizza() function to send all local db data to api
  if (navigator.onLine) {
    // we haven't created this yet, but we will soon, so let's comment it out for now
    uploadRecipe();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_recipe'], 'readwrite');
  
    // access the object store for `new_recipe`
    const recipeObjectStore = transaction.objectStore('new_recipe');
  
    // add record to your store with add method
    recipeObjectStore.add(record);
  }

  function uploadRecipe() {
    // open a transaction on your db
    const transaction = db.transaction(['new_recipe'], 'readwrite');
  
    // access your object store
    const recipeObjectStore = transaction.objectStore('new_recipe');
  
    // get all records from store and set to a variable
    const getAll = recipeObjectStore.getAll();
  
    // more to come...
    // upon a successful .getAll() execution, run this function
getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_recipe'], 'readwrite');
          // access the new_pizza object store
          const recipeObjectStore = transaction.objectStore('new_recipe');
          // clear all items in your store
          recipeObjectStore.clear();

          alert('All saved recipe has been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
  }

  // listen for app coming back online
window.addEventListener('online', uploadRecipe);