/*!
 * jQuery Timeline Plugin v0.1
 * URL_PROYECTO
 * Create: 2014/05/09
 * Update: 2014/05/19
 *
 * Copyright 2014 Rodrigo Russell
 * INDICAR_LICENCIA
 */

(function($) {

	defaults = {
		tituloID: 'titulo',
		panelID: 'panel',
		timelineID: 'timeline',
		startImage: 1,
		debug: false,
		data: [],
		beforeInit: function() {},
		afterInit: function() {},
	};

	_keyCode = {
		UP: 38,
		DOWN: 40,
		LEFT: 37,
		RIGHT: 39,
	};

	_v = '0.1';

	_totalElements = 0;

	options = {};

	contenido;

	$.fn.timeline = function(option, param) {

		if(typeof(option) === 'object') {
			options = $.extend({}, defaults, option);
			contenido = options.data;
			var template = '' +
				'<div id="' + options.tituloID + '"><h2>Intraday Metrics (<span></span>)</h2></div>' +
				'<div id="' + options.panelID + '" class="tipo1"><div class="arrow left"></div><div class="arrow right"></div>{imagenes}</div>' +
				'<div id="' + options.timelineID + '"><div class="date"></div><div class="data"></div></div>';
			if(options.data.length != 'undefined' && options.data.length > 0) {
				template = template.replace('{imagenes}', $(this).html());
				$(this).html(template);
				_log('Template cargado');

				_makeTimeline(options.data);

				_init();

				$('#' + options.timelineID + ' .time .dependentAxis').click(function() {
					_show($(this).attr('id'));
				});

				$('body').keydown(function(e) {
					if(e.which == _keyCode.UP || e.which == _keyCode.RIGHT || e.which == _keyCode.DOWN || e.which == _keyCode.LEFT) {
						e.preventDefault();
						move(e.which);
					}
				});
				
			} else {
				_error('No se a cargado la data');
			}
		} else if(typeof(option) === 'string') {
			if(contenido) {
				switch(option) {
					case 'reload': reload(); break;
					case 'version': version(); break;
					case 'current': console.log('Posición actual -> ' + current()); break;
					case 'previous': move(_keyCode.LEFT); break;
					case 'next': move(_keyCode.RIGHT); break;
					case 'up': move(_keyCode.UP); break;
					case 'down': move(_keyCode.DOWN); break;
					case 'goto': goto(param); break;
					default: break;
				}
			} else {
				_error('No se a cargado la data');
			}
		}
		return;
	};

	var reload = function() {
		options.debug = true;
		_log('reload');
	};

	var version = function() {
		console.log('Timeline msg: Version: ' + _v);
	};

	var current = function() {
		var elementos = $('#' + options.timelineID + ' a');
		for(var i = 0; i < elementos.length; i++) {
			if($(elementos[i]).find('img').hasClass('current'))
				return i;
		};		
		return options.startImage;
	};

	var move = function(type) {
		if(type) {
			var id = $($('#' + options.timelineID + ' .time').find('.current')[0]).attr('id'), flag1 = false, flag2 = false, current = _findById(id);
			switch(type) {
				case _keyCode.UP:
					if(id == 1)
						_show(_totalElements);
					else
						_show(--id);
					break;
				case _keyCode.DOWN:
					if(id == _totalElements)
						_show(1);
					else
						_show(++id);
					break;
				case _keyCode.LEFT:
					for(var i = contenido.length - 1; i > -1; i--) {
						for(var j = contenido[i].data.length - 1; j > -1; j--) {
							if(flag1 && contenido[i].data[j].metricName == current.metricName && contenido[i].data[j].cameraName == current.cameraName) {
								flag2 = true;
								break;
							}
							if(contenido[i].data[j].id == current.id) {
								flag1 = true;
							}
						}
						if(flag2)
							break;
						if(i == 0)
							i = contenido.length;
					}
					if(flag1 && flag2)
						_show(contenido[i].data[j].id);
					break;
				case _keyCode.RIGHT:
					for(var i = 0; i < contenido.length; i++) {
						for(var j = 0; j < contenido[i].data.length; j++) {
							if(flag1 && contenido[i].data[j].metricName == current.metricName && contenido[i].data[j].cameraName == current.cameraName) {
								flag2 = true;
								break;
							}
							if(contenido[i].data[j].id == current.id) {
								flag1 = true;
							}
						}
						if(flag2)
							break;
						if(i == contenido.length - 1)
							i = -1;
					}
					if(flag1 && flag2)
						_show(contenido[i].data[j].id);
					break;
			}
		}
	};

	var goto = function(id) {
		_show(id);
	};

	var _init = function() {
		_log('Inicializando...');
		if(document.URL.split('#').length > 1)
			_show(document.URL.split('#')[1]);
		else
			_show(options.startImage);
		_log('...OK');
	};

	var _makeTimeline = function(data) {
		_log('Creando timeline...');
		var htmlListTimeline, count = 1;
		for(var i = 0; i < data.length; i++) {
			if(data[i].date && data[i].date != '' && data[i].data && data[i].data.length != 'undefined' && data[i].data.length > 0) {
				$('#' + options.timelineID + ' > .date').append('<div class="time">' + _parseDate(data[i].date) + '</div>');
				htmlListTimeline = '<div class="time">';
				for(var j = 0; j < data[i].data.length; j++) {
					htmlListTimeline += '<div id="' + count + '" class="dependentAxis">';
					htmlListTimeline += '<span>' + data[i].data[j].metricName + ': ' + data[i].data[j].metricValue + '</span>';
					htmlListTimeline += '<span>' + data[i].data[j].cameraName + '</span>';
					htmlListTimeline += '</div>';
					data[i].data[j].id = count;
					count++
				};
				htmlListTimeline += '</div>';
				$('#' + options.timelineID + ' > .data').append(htmlListTimeline);
			} else {
				_error('Formato incorrecto en pos: ' + i);
			}
		};
		contenido = options.data;
		_totalElements = count - 1;
		_log('...timeline OK');
	};

	var _show = function(id) {
		$('#' + options.panelID + ' img').fadeOut(500);
		$('.dependentAxis').removeClass('current');
		$('#' + id).addClass('current');
		data = _findById(id);
		$('#' + options.panelID).attr('class', _tipoTemplate(data.media));
		$('#' + options.panelID).html('');
		for (var i = 0; i < data.media.length; i++) {
			$('#' + options.panelID).append('<img src="' + data.media[i].imgMark + '" style="display:none;" />');
		};
		$('#' + options.panelID + ' img').fadeIn(500);
		$('#' + options.tituloID + ' h2 span').html(_findById(id, true));
		parent.location.hash = id;
		_log('Posición actual -> ' + current());
	};

	var _findById = function(id, time) {
		for(var i = 0; i < contenido.length; i++)
			for(var j = 0; j < contenido[i].data.length; j++)
				if(contenido[i].data[j].id == id)
					if(time)
						return contenido[i].date;
					else
						return contenido[i].data[j];
		return null;
	};

	var _tipoTemplate = function(media) {
		if(media.length == 1)
			return 'tipo1';
		else if(media.length == 2)
			return 'tipo2';
		else
			return null;
	};

	var _parseDate = function(date, format) {
		date = new Date(date);
		A = date.getHours() < 12 ? 'AM' : 'PM';
		H = date.getHours() > 12 ? (date.getHours() - 12) < 10 ? '0' + (date.getHours() - 12) : date.getHours() - 12 : date.getHours()  < 10 ? '0' + date.getHours() : date.getHours();
		M = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
		if(format)
			return H + '_' + M + '_' + A;
		else
			return H + ':' + M + ' ' + A;
	};

	var _dependentAxisId = function(data, j) {
		return _parseDate(data.date, true) + '-' + data.data[j].metricName.replace(' ', '') + '-' + data.data[j].cameraName.replace(' ', '')
	};

	var _log = function(message) {
		if(message && options.debug && typeof(console) === 'object')
			if($.isFunction(console.log))
				console.log('Timeline msg: ' + message);
	};

	var _warn = function(message) {
		if(message && typeof(console) === 'object')
			if($.isFunction(console.warn))
				console.warn('Timeline warning msg: ' + message);
	};

	var _error = function(message) {
		if(message && typeof(console) === 'object')
			if($.isFunction(console.error))
				console.error('Timeline error msg: ' + message);
	};

})(jQuery);
