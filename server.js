const express = require('express');
const path = require('path');

const app = express();

app.use('/static', express.static('src'));

app.get('/*', (req, res) => {
	res.sendFile(path.resolve('public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port ' + port));

