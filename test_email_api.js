// Test script to call the email API
const url = 'https://functions.poehali.dev/3b109de4-c279-4008-a2ce-9013c2ed3f42';

const body = {
  "email": "melni-v@yandex.ru",
  "token": "test_melni_v_2024_abc123xyz",
  "plan": "week",
  "expires_date": "05.12.2025"
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body)
})
  .then(async response => {
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    const text = await response.text();
    console.log('Response Body:', text);
    return { status: response.status, body: text };
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
