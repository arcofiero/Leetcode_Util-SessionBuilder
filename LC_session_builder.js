const fs = require('fs').promises;
const path = require('path');

// Function to read the config file
const readConfig = async () => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config file:', error);
    throw error;
  }
};

const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        console.log('Request succeeded:', await response.json());
        return response;
      } else {
        console.error(`Request failed: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Fetch error on attempt ${attempt}:`, error);
    }

    // Exponential backoff: increase delay after each failed attempt
    const backoff = delay * Math.pow(2, attempt);
    console.log(`Retrying in ${backoff / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, backoff));
  }

  console.log(`All ${retries} attempts failed.`);
  return null;
};

const createSession = async () => {
  try {
    const { LEETCODE_SESSION, CSRF_TOKEN, NEW_SESSION_NAME } = await readConfig();

    const headers = {
      "content-type": "application/json",
      "x-csrftoken": CSRF_TOKEN,
      "x-requested-with": "XMLHttpRequest",
      "cookie": `LEETCODE_SESSION=${LEETCODE_SESSION};`
    };

    const options = {
      headers,
      body: JSON.stringify({ func: "create", name: NEW_SESSION_NAME }),
      method: "PUT"
    };

    const url = "https://leetcode.com/session/";
    const result = await fetchWithRetry(url, options, 5, 1000);

    if (!result) {
      console.error("Failed to create a session after multiple attempts.");
    }
  } catch (error) {
    console.error("Error creating session:", error);
  }
};

// Initiate the session creation
createSession();
