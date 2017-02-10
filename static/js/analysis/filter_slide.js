var filterSlider = $("#filterSlider").slider();

$(document).ready(function() {
    // Create the density selector
    // Add licent event
    filterSlider.on("slide", function(slideEvt) {
	// Get the limits
	var limit_min = slideEvt.value[0];
	var limit_max = slideEvt.value[1];

	// Set the limmits on the bar
	$("#filterLimBottom").text(limit_min);
	$("#filterLimTop").text(limit_max);
	
	function styleDensity(feature) {
	    var density = feature.getProperty('densidad');
	    var show = false;
	    if (limit_min < density && density < limit_max) {
		show = true;
	    }
	    return {
		icon: 'static/img/markers/cortaderos.png',
		strokeColor: '#fff',
		fillOpacity: 0.75,
		visible: show
	    };
	}

	layers['cortaderos'].setStyle(styleDensity);
    });
})
