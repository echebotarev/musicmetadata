var fs = require('fs');

var from = process.argv[2],
	to = process.argv[3];

transferFile(from, to);

function transferFile(from, to) {
	if (!_checkArguments(from, to)) return;

	from = __dirname + '/../' + from;
	to = __dirname + '/../' + to;

	fs.readFile(from, function (err, data) {
		if (err) throw(err);

		fs.writeFile(to, data, function (err) {
			if (err) throw(err);

			console.log('Файл записан');
		});
	});

	function _checkArguments(arg_1, arg_2) {
		if (typeof arg_1 == 'undefined') {
			console.log('Укажите откуда переместить файл');
			return false;
		}

		if (typeof arg_2 == 'undefined') {
			console.log('Укажите куда переместить файл');
			return false;
		}

		return true;
	}
}