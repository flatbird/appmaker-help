(function() {
	// 'use strict';
	var dialogStyle = {
		autoOpen: false,
		modal: true,
		position: { my: 'top', at: 'top', of: window },
		width: '90%',
		show: { effect: "fade", duration: 300 },
		hide: { effect: "fade", duration: 300 }
	};

	$(document).ready(function() {
    var ceciLinks = document.querySelectorAll('link[rel=component][type="text/ceci"]');

    if (ceciLinks.length === 0) {
      return processComponents(false, callOnComplete);
    }

    var linksLeft = ceciLinks.length,
        fragments = document.createElement("div"),
        loadComponents = function (componentLink) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', componentLink.getAttribute('href'), true);
          xhr.onload = function (e) {
            var fragment = document.createElement('div');
            fragment.innerHTML = xhr.response;
            fragments.appendChild(fragment);
            if (--linksLeft === 0) {
              processComponents(fragments);
            }
          };
          xhr.overrideMimeType('text/plain');
          xhr.send(null);
        };
      Array.prototype.forEach.call(ceciLinks, loadComponents);
	});

	var processComponents = function(fragments) {
		if (fragments) {
      var elements = fragments.querySelectorAll('element');
      elements = Array.prototype.slice.call(elements);
      elements.forEach(handleElement);
		}
    prettyPrint(); // google-code-prettify
		$('.view-source, .listener').click(viewSource);
	};

	var handleElement = function(element) {
		var component = getComponent(element);
    if (!component) {
      console.log('Failed to eval script for ' + $(element).attr('name'));
      return;
    }
		var div = $('<div>').addClass('component').attr('id', component.name);
		// console.log(component.name);
		div.append(composeThumbnail(component));
		div.append(composeProfile(component));
    div.appendTo('#list');
	};

	// Fake objects for Ceci script
	var gProperties;
	function Ceci(element, properties) { gProperties = properties; }
	function require(depends, cb) { cb(); }
  function AudioContext() { return {}; }

	var getComponent = function(element) {
		var elm = $(element);
		var component = {
      name: elm.attr('name'),
      html: elm.html(),
      script: elm.find('script[type="text/ceci"]'),
      description: elm.find('description'),
      thumbnail: elm.find('thumbnail'),
      friends: elm.find('friends'),
      template: elm.find('template')
		};

    gProperties = null;
    try {
      eval('function callback() {};' + component.script.html());
    } catch (e) {
      console.log('eval ' + component.name + ' error: ' + (e.message ? e.message : e));
    }
    if (!gProperties) {
      return null;
    }
    component.properties = gProperties;
    gProperties = null;
    return component;
  };

	var composeThumbnail = function(component) {
		var thumb = $('<div>').addClass('thumbnail').html(component.thumbnail.html());
		return thumb;
	};

	var composeProfile = function(component) {
		var name = $('<div>').addClass('name').text(componentName(component.name));
		var desc = $('<div>').addClass('description').text(component.description.html());

		var div = $('<div>').addClass('profile');
		div.append(name);
		div.append(desc);
		div.append(composeFriends(component));
		div.append(composeListeners(component));
		div.append(composeBroadcasts(component));
		div.append(composeSource(component));

		return div;
	};

	var composeFriends = function(component) {
		var div = $('<div>').addClass('friends');
		div.text('Friends: ');
    var terms = $('<div>').addClass('term');
    div.append(terms);
		var friendText = (component.friends[0] ? component.friends.text() : '');
		var first = true;
		friendText.split(',').forEach(function (friend) {
			if (first) first = false;
			else terms.append(', ');
			var a = $('<a>').attr('href', '#' + friend).text(componentName(friend));
			terms.append(a);
		});
		return div;
	};

	var composeListeners = function(component) {
		var divListeners = $('<div>').addClass('listeners');
		divListeners.text('Listeners: ');
    var terms = $('<div>').addClass('term');
    divListeners.append(terms);

		var listeners = component.properties.listeners;
		if (listeners) {
			var first = true;
			for (var name in listeners) {
				var dialogID = component.name + '-listener-' + name;

				// console.log('listener: ' + name);
				if (first) first = false;
				else terms.append(', ');
        // split by inflector.js
        var splitted = name.underscore().titleize();
				var a = $('<a>').addClass('listener').attr('href', '/').text(splitted);
				a.attr('name', dialogID);
				terms.append(a);
				// make a source dialog
        var sourceDialog = $('<div>').addClass('listener-source').attr('id', dialogID);
				var style = { title: name };
				$.extend(true, style, dialogStyle);
				sourceDialog.dialog(style);
        var src = listeners[name].toString();
				var pre = $('<pre>').addClass('prettyprint').text(src);
				sourceDialog.append(pre);
			}
		}
		return divListeners;
	};

	var composeBroadcasts = function(component) {
		var broadcasts = [];
		if (component.properties.broadcasts) {
			component.properties.broadcasts.forEach(function (broadcast) {
				// console.log('broadcast: ' + broadcast);
        // split by inflector.js
        var splitted = broadcast.underscore().titleize();
				broadcasts.push(splitted);
			});
		}
		var div = $('<div>').addClass('broadcasts');
    // div.text('Broadcasts: ' + broadcasts.join(', '));
    div.text('Broadcasts: ');
    div.append($('<div>').addClass('term').text(broadcasts.join(', ')));
		return div;
	};

	var composeSource = function(component) {
		var id = 'source-' + component.name;
		var a = $('<a>').addClass('view-source').attr('href', '/').text('View Source');
    a.addClass('term');
		a.attr('name', id);

    var sourceDialog = $('<div>').addClass('source').attr('id', id);
		var style = { title: component.name };
		$.extend(true, style, dialogStyle);
		sourceDialog.dialog(style);

    var src = component.html;
    var pre = $('<pre>').addClass('prettyprint').text(src);
		sourceDialog.append(pre);

		return a;
	};

	var componentName = function(name) {
		return name.split('-').slice(1).join(' ');
	};

	var viewSource = function(evt) {
		var target = $(evt.target);
		var id = target.attr('name');
		$('#' + id).dialog('open');
		return false;
	};

}).call(this);