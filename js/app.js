const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/account/register', (req, res) => {
    console.log(req.body);
    res.status(200).json({ message: 'Registration successful!', token: 'fake-jwt-token' });
});

app.post('/api/account/login', (req, res) => {
    console.log(req.body);
    res.status(200).json({ token: 'fake-jwt-token' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
