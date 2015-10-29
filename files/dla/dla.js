window.onload = function () { 
	var initialParameters = { width : 800, height:800, particle_density:0.25, stopping_fraction:0.5};
	document.getElementById("parameters").value = JSON.stringify(initialParameters);
};

var CLUSTER = 1;

function createField(width, height) {
	var field = { width:width, height:height, field: new Uint8Array(width * height)	};
	field.field[Math.floor(width / 2) + Math.floor(height / 2) * width] = CLUSTER;
	return field;
}

function resetParticle(particles, field, i) {
	var x = Math.floor(Math.random() * field.width);
	var y = Math.floor(Math.random() * field.height);

	while(field[y*field.width+x]) {
		x = Math.floor(Math.random() * field.width);
		y = Math.floor(Math.random() * field.height);
	}

	particles.x[i] = x;
	particles.y[i] = y;
}

function createParticles(field, count) {
	var particles = {
		count: count,
		stuck: new Uint8Array(count),
		x: new Uint16Array(count), 
		y: new Uint16Array(count), 
	};

	var i = count;
	while (i--) 
		resetParticle(particles, field, i);

	return particles;
}

function isNextToCluster(particles, field, i) {
	var cx = particles.x[i], cy = particles.y[i];
	var lx = cx - 1, rx = cx + 1;
	var ty = cy - 1, by = cy + 1;

    // if we are at boundary
	if (lx < 0 || rx >= field.width ||  ty < 0 || by >= field.height) {
		return false;
	}
		
	cy *= field.width;     
	by *= field.width;     
	ty *= field.width;

	// the check if we have neighour
	return field.field[cx + ty] || field.field[lx + cy] || field.field[rx + cy] || field.field[cx + by] || 
		field.field[lx + ty] || field.field[lx + by] ||  field.field[rx + ty] || field.field[rx + by];
}

function updateParticle(particles,field, i) {
	var xmove = Math.random();
	var ymove = Math.random();
	var x = particles.x[i] + (xmove > 2/3 ? 1 : xmove > 1/3 ? 0 : -1);
	var y = particles.y[i] + (ymove > 2/3 ? 1 : ymove > 1/3 ? 0 : -1);

	if ( (x < 0) || (y < 0) || (x >= field.width) || (y >= field.height)) {
		resetParticle(particles, field, i);
	}

    particles.x[i] = x;
    particles.y[i] = y;
    
	if (isNextToCluster(particles, field, i)) {
		particles.stuck[i] = CLUSTER;
		field.field[y*field.width + x] = CLUSTER;
	}
}


function render(field, canvas, particles) {
	var i = particles.count;
	while (i--) {
    	var index = (particles.y[i] * field.width + particles.x[i]) * 4;
    	var isStuck = particles.stuck[i];
    	canvas[index] = isStuck ? 231 : 52; // red
        canvas[++index] = isStuck ? 76 : 152; // green
        canvas[++index] = isStuck ? 60 : 219; // blue
        canvas[++index] = 255; // alpha 
	}
}

function start() {
	var parameters = JSON.parse(document.getElementById("parameters").value);
	var canvas = document.getElementById("canvas");
	canvas.width = parameters.width;
	canvas.height = parameters.height;
	var ctx = canvas.getContext('2d');
	
	var field = createField(parameters.width, parameters.height);
	var particleCount = Math.floor(parameters.width * parameters.height * parameters.particle_density);
	var particles = createParticles(field, particleCount);

	var imageData = ctx.getImageData(0, 0, field.width, field.height);
	var clearCanvas = new Uint8Array(4*field.width * field.height)
	
	function step() {
		var j = particles.count;
		while (j--) {
			if (particles.stuck[j] != CLUSTER) {
				updateParticle(particles, field, j);
			}
		}	
		
		imageData.data.set(clearCanvas);
		render(field, imageData.data, particles);
		
		ctx.putImageData(imageData, 0, 0);
		
		var idle = 0;
		var i = particles.count;
		while (i--) 
			idle += particles.stuck[i];

		if (idle < parameters.stopping_fraction * particles.count) {
			requestAnimationFrame(step);
		}
		else {
			imageData.data.set(clearCanvas);
			render(field, imageData.data, particles);
			ctx.putImageData(imageData, 0, 0);
		}
	}

	requestAnimationFrame(step);
}