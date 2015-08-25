(function(RJSmodule) {
	'use strict';
	/*jslint browser: true */

	function parseVar(varType, variable) {
		switch(varType) {
			case 'float':
				variable = parseFloat(variable);
				break;
				
			case 'int':
				variable = parseInt(variable);
				break;
				
			case 'checkbox':
				//variable = JSON.parse(variable.toLowerCase());
				break;
				
			default:
				variable = variable;
		}
		
		return variable;
	}
	
	
	/* Handles ALL controls, popup windows and websocket remote controls */
	// Method must be bound to modV's scope
	var receiveMessage = function(event, websocket) {
		var self = this;

		console.log('message recieved');

		if(event.origin !== self.options.controlDomain && !websocket) return;
		var index;
		if(event.data.type === 'variable') {
			
			console.log(event.data);

			// Parse Variable
			var variable = parseVar(event.data.varType, event.data.payload);
			
			// Set variable value
			if('append' in event.data) {
				self.registeredMods[event.data.modName][event.data.name] = variable + event.data.append;
			} else {
				self.registeredMods[event.data.modName][event.data.name] = variable;
			}
			
			// Set current value for preset purposes
			self.registeredMods[event.data.modName].info.controls[event.data.index].currValue = variable;
			
			// Websocket message? Update the UI
			if(websocket) {
				var payload = event.data.payload;
				
				if('append' in event.data) {
					payload = payload.replace(event.data.append, '');
				}
								
				self.controllerWindow.postMessage({
					type: 'ui',
					varType: event.data.varType,
					modName: event.data.modName,
					name: event.data.name,
					payload: payload,
					index: event.data.index
				}, self.options.controlDomain);
			}
		}
		
		if(event.data.type === 'image') {
			self.registeredMods[event.data.modName][event.data.name].src = event.data.payload;
		}
		
		if(event.data.type === 'video') {
			self.registeredMods[event.data.modName][event.data.name].src = event.data.payload;
			self.registeredMods[event.data.modName][event.data.name].load();
			self.registeredMods[event.data.modName][event.data.name].play();
		}

		if(event.data.type === 'multiimage') {
			if(event.data.wipe) self.registeredMods[event.data.modName][event.data.name].length = 0;
			event.data.payload.forEach(function(file) {
				var newImage = new Image();
				newImage.src = file;
				self.registeredMods[event.data.modName][event.data.name].push(newImage);
			});
		}
		
		if(event.data.type === 'modBlend') {
			self.registeredMods[event.data.modName].info.blend = event.data.payload;

			// Websocket message? Update the UI
			if(websocket) {
				self.controllerWindow.postMessage({
					type: 'ui-blend',
					modName: event.data.modName,
					payload: event.data.payload
				}, self.options.controlDomain);
				console.log(event.data);
			}
		}
		
		if(event.data.type === 'modOpacity') {
			self.registeredMods[event.data.modName].info.alpha = event.data.payload;

			// Websocket message? Update the UI
			if(websocket) {
				self.controllerWindow.postMessage({
					type: 'ui-opacity',
					modName: event.data.modName,
					payload: event.data.payload
				}, self.options.controlDomain);
				console.log(event.data);
			}
		}
		
		if(event.data.type === 'setOrderUp') {
			index = -1;
			self.modOrder.forEach(function(mod, idx) {
				if(event.data.modName === mod) index = idx;
			});
			if(index > 0) {
				index -= 1;
				self.setModOrder(event.data.modName, index);
			}
		}
		
		if(event.data.type === 'setOrderFromElements') {
			index = -1;
			self.modOrder.forEach(function(mod, idx) {
				if(event.data.y === mod) index = idx;
			});
			
			if(index > 0) {
				self.setModOrder(event.data.x, index);
			}
		}
		
		if(event.data.type === 'check') {
			if(!event.data.payload) {
				self.registeredMods[event.data.modName].info.disabled = true;
			} else {
				self.registeredMods[event.data.modName].info.disabled = false;
			}

			// Websocket message? Update the UI
			if(websocket) {
				self.controllerWindow.postMessage({
					type: 'ui-enabled',
					modName: event.data.modName,
					payload: event.data.payload
				}, self.options.controlDomain);
			}
		}
		
		if(event.data.type === 'global') {
			if(event.data.name === 'clearing') {
				if(event.data.payload) {
					self.clearing = true;
				} else {
					self.clearing = false;
				}
			}
			
			if(event.data.name === 'mute') {
				if(event.data.payload) {
					self.gainNode.gain.value = 0;
				} else {
					self.gainNode.gain.value = 1;
				}
			}
			
			if(event.data.name === 'savepreset') {
				var preset = {};
				var name = event.data.payload.name;
				
				for (var mod in self.registeredMods) {
					preset[mod] = self.registeredMods[mod].info;
				}
				
				self.presets[name] = preset;
				localStorage.setItem('presets', JSON.stringify(self.presets));
				console.info('Wrote preset with name:', name);

				self.mediaManager.send(JSON.stringify({
					request: 'save-preset',
					profile: 'harley',
					payload: preset,
					name: name
				}));

				// update preset list in controls window (TODO: THE SAME FOR WEBSOCKET)
			}

			if(event.data.name === 'loadpreset') {
				self.loadPreset(event.data.payload.name);
				// load preset (TODO: THE SAME FOR WEBSOCKET)
			}

			if(event.data.name === 'factory-reset') {
				self.factoryReset();
			}
		}
	};

	modV.prototype.addMessageHandler = function() {
		var self = this;
		window.addEventListener('message', receiveMessage.bind(self), false);
	};

})(module);