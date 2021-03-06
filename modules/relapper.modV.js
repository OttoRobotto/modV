var relapper = function() {

	this.info = {
		name: 'relapper',
		author: '2xAA',
		version: 0.1,
		controls: [
			{type: 'range', variable: 'overlaps', label: 'Overlaps', min: 0, max: 100, varType: 'int', step: 1}
		]
	};
	
	var newCanvas2 = document.createElement('canvas');
	var newCtx2 = newCanvas2.getContext('2d');
	
	this.overlaps = 50;

	this.init = function(canvas) {
		newCanvas2.width = canvas.width;
		newCanvas2.height = canvas.height;
	};

	this.draw = function(canvas, ctx) {

		newCtx2.clearRect(0, 0, canvas.width, canvas.height);
		newCtx2.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newCanvas2.width, newCanvas2.height);
		
		for(var i=0; i < canvas.width; i+= Math.floor(canvas.width/this.overlaps)) {
			ctx.drawImage(newCanvas2, i, 0, this.overlaps, canvas.height, i, 0, canvas.width, canvas.height);
		}
	};
};