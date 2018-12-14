(function () {
	/**
	 * Корректировка округления десятичных дробей.
	 *
	 * @param {String}  type  Тип корректировки.
	 * @param {Number}  value Число.
	 * @param {Integer} exp   Показатель степени (десятичный логарифм основания корректировки).
	 * @returns {Number} Скорректированное значение.
	 */
	function decimalAdjust(type, value, exp) {
		// Если степень не определена, либо равна нулю...
		if (typeof exp === 'undefined' || +exp === 0) {
			return Math[type](value);
		}
		value = +value;
		exp = +exp;
		// Если значение не является числом, либо степень не является целым числом...
		if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
			return NaN;
		}
		// Сдвиг разрядов
		value = value.toString().split('e');
		value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
		// Обратный сдвиг
		value = value.toString().split('e');
		return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
	}

	// Десятичное округление к ближайшему
	if (!Math.round10) {
		Math.round10 = function (value, exp) {
			return decimalAdjust('round', value, exp);
		};
	}
	// Десятичное округление вниз
	if (!Math.floor10) {
		Math.floor10 = function (value, exp) {
			return decimalAdjust('floor', value, exp);
		};
	}
	// Десятичное округление вверх
	if (!Math.ceil10) {
		Math.ceil10 = function (value, exp) {
			return decimalAdjust('ceil', value, exp);
		};
	}
})();

var fs = require('fs');
var mm = require('musicmetadata');

var LIST = {};
LIST.categories = [];
LIST.audio = [];

var localPath = process.argv[2] ? process.argv[2] : __dirname + '/../';
var PATH = 'mod';

console.log('PATH', PATH);
console.log('ARG', process.argv[2]);
console.log('TYPEOF ARG', typeof process.argv[2]);

var categoryId = 10000,
	countCategory = 1,
	countAudio = 1;

createList({path: PATH + '/music'});

function createList(folder) {
	console.log('START');

	readDir(folder)
		.then(function () {
			console.time('Parsing_audio_data');
			console.log('****************  STEP 1: READ DIRECTORIES  ****************');

			return Promise.all(LIST.categories.map(readDir));
		})
		.then(function () {
			return Promise.all(LIST.categories.map(readDir));
		})
		.then(function () {
			return Promise.all(LIST.categories.map(readDir));
		})
		.then(function () {
			return Promise.all(LIST.categories.map(readDir));
		})
		.then(function () {
			return Promise.all(LIST.categories.map(readDir));
		})
		.then(function () {
			console.log('****************  STEP 2: READ AUDIO DATA  ****************');

			return Promise.all(LIST.audio.map(async function (audio) {
				var data = await getAudioData(audio);
				audio.image = await writeImgAudio(data.audio, data.metadata);

				// console.log('Read and write audio data ' + audio.title + ' end\r\n');
			}));
		})
		.then(function () {
			console.log('****************  STEP 3: IMAGE CATEGORY  ****************');

			return Promise.all(LIST.categories.map(async function (category) {
				await writeImgCategory(category);
			}));
		})
		.then(function () {
			createDirectory(PATH + '/data');
			renderChildsItem();

			writeFile(PATH + '/data/mod.json', JSON.stringify(LIST));
		})
		.catch(handlerError);
}

function getAudioData(audio) {
	return new Promise(function (resolve, reject) {
		var path = audio.path;

		// console.log('Start reading audio metadata: ' + audio.title);
		// console.log('Total audio: ' + LIST.audio.length);
		// console.log('Image audio in progress: ' + countAudio++);

		mm(fs.createReadStream(localPath + path), {duration: true}, function (err, metadata) {
			if (err) {
				console.log(err);
				resolve({audio: {}, metadata: {picture: ''}});
				return;
			}

			// console.log('End reading audio metadata: ' + audio.title);

			audio.title = metadata.title;
			audio.genre = getGenre(metadata.genre[0]);
			audio.duration = getDuration(metadata.duration);
			audio.album = metadata.album;

			audio.artist = '';
			for (var i = 0; i < metadata.artist.length; i++) {
				if (audio.artist === '') {
					audio.artist = metadata.artist[i];
				} else {
					audio.artist += ', ' + metadata.artist[i];
				}
			}

			resolve({audio, metadata});

		})
	});

	function getGenre(string) {
		var arr = [];

		if (string) {
			arr = (string.indexOf(',') != -1 ? string.split(',') : string.split('/'));

			if (arr.length > 0) {
				for (var i = 0; i < arr.length; i++) {
					arr[i] = arr[i].trim();
				}
			}

		}

		return arr;
	}

	function getDuration(sec) {
		sec = Math.floor(sec);

		var minute = Math.floor(sec / 60);
		var second = (sec % 60).toString();

		if (second.length > 2) second = second.substring(0, 2);
		if (second.length < 2) second = "0" + second;

		return minute + ':' + second;
	}
}

function writeImgAudio(audio, data) {
	return new Promise(function (resolve, reject) {
		// console.log('Start writing audio image: ' + audio.title);

		if (data.picture.length === 0) {
			resolve('i/mod_default.png');
			console.log(audio.title + ' NO IMAGE');

			return;
		}

		createDirectory(PATH + '/image');

		var imageName = audio.title.replace(/[ |,|'|"|/|?|!|.|(|)]/g, '_');
		var path = localPath + PATH + '/image/' + imageName + '.' + data.picture[0].format;
		fs.writeFile(path, data.picture[0].data, function (err) {
			if (err) {
				reject(err);
				return;
			}

			// console.log('End writing audio image: ' + audio.title);

			resolve(PATH + '/image/' + imageName + '.' + data.picture[0].format);
		});
	});
}

function writeImgCategory(category) {
	return new Promise(function (resolve, reject) {
		var src;

		fs.readdir(localPath + category.path, function (err, result) {
			if (err) {
				reject(err);
				return;
			}

			for (var i = 0; i < result.length; i++) {
				if (result[i].match(/jpg$|png$|jpeg$/) && !result[i].includes('big')) {
					src = result[i];
					break;
				}
			}

			console.log('Total categories: ' + LIST.categories.length);
			console.log('Category in process: ' + countCategory++);

			if (!src) {
				category.image = 'i/mod_default.png';
				resolve();
			} else {
				createDirectory(PATH + '/image');

				fs.readFile(localPath + category.path + '/' + src, function (err, data) {
					if (err) {
						reject(err);
						return;
					}

					console.log('Category read: ' + category.title);
					console.log('Category read image: ' + src);
					fs.writeFile(localPath + PATH + '/image/' + src, data, function (err) {
						if (err) {
							category.image = 'i/mod_default.png';
							resolve();
							return;
						}

						console.log('Category write: ' + category.title);
						console.log('Category write image: ' + src);

						category.image = PATH + '/image/' + src;
						resolve();
					});
				});
			}
		})
	})
}

function writeFile(path, data) {

	fs.writeFile(localPath + path, data, function (err) {
		if (err) throw err;

		if (path == '/data/mod.json') {
			console.timeEnd('Parsing_audio_data');
			console.log('Playlist done');
		}

	});
}

function readDir(object) {
	return new Promise(function (resolve, reject) {
		var variableList = [];
		var path = object.path;

		console.log('Reading directory start: ' + path);
		fs.readdir(localPath + path, function (err, result) {
			if (err) {
				reject(err);
				return;
			}

			for (var i = 0; i < result.length; i++) {
				var obj = {};

				if (result[i] == '.DS_Store' ||
					result[i].match(/jpg$|png$|jpeg$/)) {

					result.splice(i, 1);
					i--
				} else {
					obj.title = result[i];
					obj.path = path + '/' + result[i];

					variableList.push(obj);
				}
			}

			Promise.all(variableList.map(getStats))
				.then(function () {
					console.log('Reading directory end: ' + path);
					resolve();
				});

		})
	})
}

function getStats(item) {
	return new Promise(function (resolve, reject) {
		var path = localPath + item.path;

		fs.stat(path, function (err, stats) {
			if (err) {
				reject(err);
				return;
			}

			if (stats.isFile()) {
				if (!hasItem(item, LIST.audio)) {
					LIST.audio.push(item);
				}
			} else if (stats.isDirectory()) {
				if (!hasItem(item, LIST.categories)) {
					LIST.categories.push(item);
				}
			}

			resolve(item);
		})
	});
}

function hasItem(item, list) {
	var has = false;
	for (var i = 0; i < list.length; i++) {
		if (list[i].title == item.title) {
			has = true;
			break;
		}
	}

	return has;
}

function handlerError(err) {
	console.log(err);
}

function createDirectory(path) {
	if (!fs.existsSync(localPath + path)) {
		fs.mkdirSync(localPath + path);
	}
}

function renderChildsItem() {
	for (var i = 0; i < LIST.categories.length; i++) {
		getCategory(LIST.categories[i]);
	}

	function getCategory(category) {
		var childs = {};
		childs.type = 'category';
		childs.items = [];

		if (typeof category.id == 'undefined') {
			var id = categoryId++;
			category.id = "mid_" + id;
			category.link = '#' + category.id;
		}

		for (var i = 0; i < LIST.categories.length; i++) {
			var checkingCategory = LIST.categories[i];

			if (checkingCategory.path.includes(category.path) && !checkingCategory.title.includes(category.title)) {
				checkingCategory.parent = category.id;
				childs.items.push(checkingCategory)
			}

		}

		if (childs.items.length) {
			category.childs = childs;
		} else {
			getAudio(category);
		}

		if (!category.parent) category.parent = null;
	}

	function getAudio(category) {
		var childs = {};
		childs.type = 'audio';
		childs.items = [];

		for (var i = 0; i < LIST.audio.length; i++) {
			var checkingAudio = LIST.audio[i];

			if (typeof checkingAudio.id == 'undefined') {
				var id = categoryId++;
				checkingAudio.id = "mid_" + id;
				checkingAudio.link = '#' + checkingAudio.id;

				// TODO удалить перед production
				// checkingAudio.path = 'http://10.12.0.200/' + checkingAudio.path;
			}

			if (checkingAudio.path.includes(category.path)) {
				childs.items.push(checkingAudio);
			}
		}

		category.childs = childs;
	}
}
