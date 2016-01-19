'use strict';
var qtools = require('qtools'),
	qtools = new qtools(module),
	events = require('events'),
	util = require('util'),
	fs = require('fs'),
	walk = require('fs-walk');

//START OF moduleFunction() ============================================================

var moduleFunction = function(args) {
	events.EventEmitter.call(this);
	this.forceEvent = forceEvent;
	this.args = args;
	this.metaData = {};
	this.addMeta = function(name, data) {
		this.metaData[name] = data;
	}

	qtools.validateProperties({
		subject: args || {},
		targetScope: this, //will add listed items to targetScope
		propList: [
			{
				name: 'router',
				optional: false
			},
			{
				name: 'filePathList',
				optional: false
			},
			{
				name: 'default',
				optional: true
			},
			{
				name: 'systemParameters',
				optional: true
			}
		]
	});

	var self = this,
		forceEvent = function(eventName, outData) {
			this.emit(eventName, {
				eventName: eventName,
				data: outData
			});
		};

	self.systemParameters = self.systemParameters ? self.systemParameters : {};
	self.default = self.default ? self.default : 'index.html';

	//LOCAL FUNCTIONS ====================================

	var sendTestInputPage = function(req, res, next) {
		var pathTest = req.path.match(/(\w+).*$/);

		if (pathTest && typeof (pathTest[1]) != 'undefined') {
			var pageIndex = req.path.replace(/\/+/g, '/');
		} else {
			pageIndex = (req.path == '/') ? defaultPageIndex : '';
		}
		
		pageIndex=pageIndex.replace(/^\//, '').replace(/\/+/, '/');

		if (!self.pageList[pageIndex]) {
			pageIndex=pageIndex+'.html'
		}
		
		if (!self.pageList[pageIndex]) {
			next();
			return;
		}
		
		var html = qtools.fs.readFileSync(self.pageList[pageIndex].filePath);
		html = qtools.templateReplace({
			template: html.toString(),
			replaceObject: self.systemParameters
		});

var extension=pageIndex.match(/\.(\w+)$/);
	if (extension){
		extension=extension[1];
	}
	switch (extension){
		case 'css':
		res.set('Content-Type', 'text/css');
			break;
		default:
		res.set('Content-Type', 'text/html');
		break;
	}

		res.status('200').send(new Buffer(html));

		//		res.status('200').sendFile(fileDirectoryPath + '/'+fileName + '.html');

	};
	var defaultPageIndex = '';
	var fileInfoList = [];
	self.pageList = {};

	for (var i = 0, len = self.filePathList.length; i < len; i++) {

		var fileDirectoryPath = self.filePathList[i].replace(/\/+/g, '/');

		walk.walkSync(fileDirectoryPath, function(basedir, filename, stat) {
			if (filename.match(/^\./)) {
				return;
			}
			var filePath = basedir + '/' + filename;
			fileInfoList.push({
				filename: filename,
				filePath: filePath,
				urlSegment: filePath.replace(fileDirectoryPath, '')
			})
		});

		for (var j = 0, len2 = fileInfoList.length; j < len2; j++) {
			var element = fileInfoList[j];

			var fileName = element.filename;
			var urlSegment = element.urlSegment;
			
			urlSegment=urlSegment.replace(/^\//, '').replace(/\/+/, '/');
			self.pageList[urlSegment] = element;

			var pathName = fileName;
			if (fileName == self.default) {
				urlSegment = ''; //change this one into the default
				defaultPageIndex = element.urlSegment;
			}

			self.router.get(new RegExp(urlSegment), function(req, res, next) {
				sendTestInputPage(req, res, next);
				return;
			});

		}

	}

	//METHODS AND PROPERTIES ====================================

	//INITIALIZATION ====================================

	return this;
};

//END OF moduleFunction() ============================================================

util.inherits(moduleFunction, events.EventEmitter);
module.exports = moduleFunction;

