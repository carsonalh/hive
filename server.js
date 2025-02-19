const express = require('express');
const path = require('path');

const app = express();

app.use('/static/js', express.static('src/js'));
app.use('/static/css', express.static('src/css'));
app.use('/static/res', express.static('res'));
app.use('/static/wasm', express.static('dist'));

app.get('/*', (req, res) => {
	res.sendFile(path.resolve('public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port ' + port));

