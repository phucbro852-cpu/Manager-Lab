const axios = require('axios');
axios.post('http://localhost:5000/api/auth/login', { username: 'admin', password: 'admin123' })
  .then(res => console.log('SUCCESS:', res.data))
  .catch(err => console.log('ERROR:', err.message));
