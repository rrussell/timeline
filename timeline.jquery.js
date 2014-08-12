/*!
 * jQuery Timeline Plugin v0.1
 * https://github.com/rrussell/timeline
 * Create: 2014/05/09
 * Update: 2014/08/12
 *
 * Copyright 2014 Rodrigo Russell
 * rodrigo.russell@eureka.cl
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
		RIGHT: 39
	};

	_v = '0.1';

	_typeData = {
		COUNTING: 'COUNTING',
		WAITING_TIME: 'WAITING_TIME'
	};

	_totalElements = 0;

	options = {};

	contenido;

	$.fn.timeline = function(option, param) {

		if(typeof(option) === 'object') {
			options = $.extend({}, defaults, option);
			contenido = options.data;
			var template = '\
				<div id="' + options.tituloID + '"><h2>Intraday Metrics (<span></span>)</h2></div>\
				<div id="viewType" class="hide" style="float:right;margin:-30px 25px 0 0;">\
					<div class="btn-group btn-group-xs" data-toggle="buttons">\
						<label class="btn btn-default active">\
							<input type="radio" name="options" value="galeria" checked> <span class="glyphicon glyphicon-picture"></span>\
						</label>\
						<label class="btn btn-default">\
							<input type="radio" name="options" value="grid"> <span class="glyphicon glyphicon-th"></span>\
						</label>\
					</div>\
  				</div>\
				<div id="' + options.panelID + '" class="tipo1"><div class="arrow left"></div><div class="arrow right"></div></div>\
				<div id="' + options.timelineID + '"><div class="date"></div><div class="data"></div></div>';

			if(options.data && typeof options.data == 'object') {
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

				$('input[name=options]').change(function() {
					console.log($(this).val());
				});
				
			} else {
				_error('No se a cargado la data');
			}
		} else if(typeof(option) === 'string') {
			if(contenido) {
				switch(option) {
					case 'reload': reload(); break;
					case 'version': version(); break;
					case 'current': console.log('Posición actual: ' + current()); break;
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
		} else {
			_error('No se a cargado la data');
		}
		return;
	};

	var reload = function() {
		$('#' + options.timelineID).html('<div class="date"></div><div class="data"></div>');
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

		$('input[name=options]').change(function() {
			console.log($(this).val());
		});
	};

	var version = function() {
		console.log('Version: ' + _v);
	};

	var current = function() {
		var elementos = $('#' + options.timelineID + ' .dependentAxis');
		for(var i = 0; i < elementos.length; i++) {
			if($(elementos[i]).hasClass('current'))
				return ++i;
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
		if(data.length == undefined) {

			if(data.date && data.date != '' && data.data && data.data.length == undefined) {

				$('#' + options.timelineID + ' > .date').append('<div class="time">' + _parseDate(data.date) + '</div>');
				htmlListTimeline = '<div class="time">';
				htmlListTimeline += '<div id="' + count + '" class="dependentAxis">';
				//htmlListTimeline += '<span>' + data.data[j].name + ': ' + data.data[j].value + '</span>';
				htmlListTimeline += '<span>' + data.data.name + ': 5</span>';
				htmlListTimeline += '</div>';
				data.data.idDiv = count;
				count++;
				htmlListTimeline += '</div>';
				$('#' + options.timelineID + ' > .data').append(htmlListTimeline);

			} else if(data.date && data.date != '' && data.data && data.data.length != undefined && data.data.length > 0) {
				
				$('#' + options.timelineID + ' > .date').append('<div class="time">' + _parseDate(data.date) + '</div>');
				htmlListTimeline = '<div class="time">';
				for(var j = 0; j < data.data.length; j++) {
					htmlListTimeline += '<div id="' + count + '" class="dependentAxis">';
					//htmlListTimeline += '<span>' + data.data[j].name + ': ' + data.data[j].value + '</span>';
					htmlListTimeline += '<span>' + data.data[j].name + ': 5</span>';
					htmlListTimeline += '</div>';
					data.data[j].idDiv = count;
					count++;
				};
				htmlListTimeline += '</div>';
				$('#' + options.timelineID + ' > .data').append(htmlListTimeline);

			} else {
				_error('Formato incorrecto en pos: ' + i);
			}

		} else if(data.length != undefined && data.length > 1) {

			for(var i = 0; i < data.length; i++) {

				$('#' + options.timelineID + ' > .date').append('<div class="time">' + _parseDate(data[i].date) + '</div>');
				htmlListTimeline = '<div class="time">';
				if(data[i].date && data[i].date != '' && data[i].data && data[i].data.length == undefined) {

					htmlListTimeline += '<div id="' + count + '" class="dependentAxis">';
					//htmlListTimeline += '<span>' + data.data[j].name + ': ' + data.data[j].value + '</span>';
					htmlListTimeline += '<span>' + data[i].data.name + ': ' + _random() + '</span>';
					htmlListTimeline += '</div>';
					data[i].data.idDiv = count;
					count++;

				} else if(data[i].date && data[i].date != '' && data[i].data && data[i].data.length != undefined && data[i].data.length > 0) {

					for(var j = 0; j < data[i].data.length; j++) {
						htmlListTimeline += '<div id="' + count + '" class="dependentAxis">';
						//htmlListTimeline += '<span>' + data.data[j].name + ': ' + data.data[j].value + '</span>';
						htmlListTimeline += '<span>' + data[i].data[j].name + ': ' + _random() + '</span>';
						htmlListTimeline += '</div>';
						data[i].data[j].idDiv = count;
						count++;
					};

				} else {
					_error('Formato incorrecto en pos: ' + i);
				}
				htmlListTimeline += '</div>';
				$('#' + options.timelineID + ' > .data').append(htmlListTimeline);
			};

		}
		contenido = options.data;
		_totalElements = count - 1;
		_log('...timeline OK');
	};

	var _random = function() {
		return Math.floor((Math.random() * 10) + 1);
	};

	var _show = function(id) {
		$('#' + options.panelID + ' img').fadeOut(500);
		$('.dependentAxis').removeClass('current');
		$('.loading').fadeIn(1000);
		$('#' + id).addClass('current');
		data = _findById(id);
		$('#' + options.panelID).attr('class', _tipoTemplate(data.type));
		$('#' + options.panelID).html('');
		if(!_hideViewType(data.type))
			$('#viewType').removeClass('hide');
		else if(!$('#viewType').hasClass('hide'))
			$('#viewType').addClass('hide');
		/*
		 * ANTES DE ESTO VER QUE VISTA ESTÁ SELECCIONADA SI ES QUE HAY OPCION A VISTA (COUNTING POR EL MOMENTO DOS VISTAS)
		*/
		if(data.cameras && data.cameras.length == undefined) {
			
			if(data.cameras.medias && data.cameras.medias.length == undefined) {//TODO: leer filtro con o sin marca
				
				$('#' + options.panelID).append('<img src="' + data.cameras.medias.imgMark + '" style="display:none;" />');

			} else if(data.cameras.medias && data.cameras.medias.length != undefined && data.cameras.medias.length > 0) {

				for(var i = 0; i < data.cameras.medias.length; i++) {
					$('#' + options.panelID).append('<img src="' + data.cameras.medias[i].imgMark + '" style="display:none;" />');
				};

			}

		} else if(data.cameras && data.cameras.length != undefined && data.cameras.length > 0) {//TODO: ver las dos opciones en medias
			
			for(var i = 0; i < data.cameras.length; i++) {
				
				if(data.cameras[i].medias && data.cameras[i].medias.length == undefined) {//TODO: leer filtro con o sin marca
					
					$('#' + options.panelID).append('<img src="' + data.cameras[i].medias.imgMark + '" style="display:none;" />');

				} else if(data.cameras[i].medias && data.cameras[i].medias.length != undefined && data.cameras[i].medias.length > 0) {
					
					for(var i = 0; i < data.cameras[i].medias.length; i++) {
						$('#' + options.panelID).append('<img src="' + data.cameras[i].medias[i].imgMark + '" style="display:none;" />');
					};

				}

			};

		}
		
		$('#' + options.tituloID + ' h2 span').html(_findById(id, true));
		//parent.location.hash = id;
		_loadTemplate(data.type);
		$('#' + options.panelID + ' img').load(function() {
			$(this).fadeIn(500);
			$('.loading').fadeOut(2000);
		});
		_log('Posición actual -> ' + current());
	};

	var _findById = function(id, time) {

		if(contenido && contenido.length == undefined) {//OK

			if(contenido.data && contenido.data.length == undefined) {//OK

				if(contenido.data.id == id)
					if(time)
						return contenido.date;
					else
						return contenido.data;

			} else if(contenido.data && contenido.data.length != undefined && contenido.data.length > 0) {//OK

				for(var j = 0; j < contenido.data.length; j++)
					if(contenido.data[j].id == id)
						if(time)
							return contenido.date;
						else
							return contenido.data[j];

			}

		} else if(contenido && contenido.length != undefined && contenido.length > 0) {//OK
			
			for(var i = 0; i < contenido.length; i++) {
				
				if(contenido[i].data && contenido[i].data.length == undefined) {//OK

					if(contenido[i].data.id == id)
						if(time)
							return contenido[i].date;
						else
							return contenido[i].data;

				} else if(contenido[i].data && contenido[i].data.length != undefined && contenido[i].data.length > 0) {//OK

					for(var j = 0; j < contenido[i].data.length; j++)
						if(contenido[i].data[j].id == id)
							if(time)
								return contenido[i].date;
							else
								return contenido[i].data[j];

				}

			};

		}
		return null;
	};

	var _tipoTemplate = function(type) {
		if(type == _typeData.COUNTING)
			return 'tipo1';
		else if(type == _typeData.WAITING_TIME)
			return 'tipo2';
		else
			return null;
	};

	var _loadTemplate = function(type) {
		if(type == _typeData.COUNTING) {
			if($('input[name=options]:checked').val() == 'galeria') { //mostrar galería de las n cámaras

				$('#' + options.panelID).prepend('<div class="arrow left"></div><div class="arrow right"></div>');

			} else if($('input[name=options]:checked').val() == 'grid') { //mostrar grilla de las n cámaras



			}
		} else if(type == _typeData.WAITING_TIME) {



		} else {
			return null;
		}
	}

	var _hideViewType = function(type) {
		if(type == _typeData.COUNTING)
			return false;
		else if(type == _typeData.WAITING_TIME)
			return true;
		else
			return true;
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
