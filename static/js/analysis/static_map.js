/*
  Visualizacion de los datos en un mapa de google

  Desarrollador: Franco N. Bellomo - @fnbellomo

  Global variables previously declared
  ------------------------------------
  serverUrl: str
    Base url of the server
  layersNames: object
    Names of all the layers
  layersFullName: object
    Full name of each layer
*/

var map; // General map variable
var layers = {}; // Object with all the layers
var infoWindow; // General infoWindow variable
var url = serverUrl + "api/v1.0/datos/completos/"; // Base url from get the data
var legend; // Legend of the map

// Variables used with the new markers
// ===================================
var markers = {};
var currentId = 0;
var uniqueId = function() {
    return ++currentId;
}

// Personal icons for each layer
// The style depending if the point is valid, to validate or to delete
// =====================================
var iconBase = 'static/img/markers/';
var icons = {};
for (layer of layersNames) {
    icons[layer] = {'name': layersFullName[layer],
		   icon: iconBase + layer + '.png'}
}


function initMap() {
    // Create the map
    map = new google.maps.Map(document.getElementById('map'), {
	zoom: 12,
	center: {lat: -31.45, lng: -64.18}
    });

    // Create a global infowindow
    infoWindow = new google.maps.InfoWindow({
        content: "",
        pixelOffset: new google.maps.Size(0, -30)
    });

    // Initialize all the layers
    for (var layer of layersNames) {
	layers[layer] = new google.maps.Data();
    }

    // Load GeoJSON with the data of each layer
    for (var layer of layersNames) {
	layers[layer].loadGeoJson(url + layer);
    }

    // Set the style to each layer
    for (var layer of layersNames) {
	layers[layer].setStyle(function (feature) {
	    var type = feature.getProperty('type');
	    return icons[type];
	});
    }
    
    // Generate map legend
    legend = createLegend();
    // Show in map only if the size width of the screen is > 359
    if ($(document).width() > 359) {
	// Push the legend
	map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    }

    // Show popup on click event
    layers.cortaderos.addListener('click', function(event) {
	cortaderosPopup(event);
    })
    
    // Display layers in the map
    for (layer of layersNames) {
	layers[layer].setMap(map);
    }
};


// Function to create the ledeng and add a listened
// when the window size change
// ================================================

function createLegend() {
    /*
      Create the map legend
    */

    // If the legend exist, fisrt delete it
    if (document.getElementById('legend')) {
	document.getElementById('legend').remove();
    }
    
    // Create the legend container
    var mapContainer = document.getElementById('mapContainer');
    var legendDiv = document.createElement('div');
    legendDiv.id = "legend";
    mapContainer.appendChild(legendDiv);

    // Append the laters icon reference
    for (var key in icons) {
        var type = icons[key];
        var name = type.name;
        var icon = type.icon;
        var div = document.createElement('div');
	div.className = "legend-item";
        div.innerHTML = '<img src="' + icon + '"> ' + '<p onclick="showHideLayers(' + "'" + key + "'" + ');">' + name + '</p>';
        legendDiv.appendChild(div);
    }

    return legendDiv;
}

window.addEventListener('resize', function() {
    var mapsControls = map.controls[google.maps.ControlPosition.RIGHT_BOTTOM];

    if (mapsControls.length > 0) {
	mapsControls.pop();
    }
    
    if ($(document).width() > 359) {
	// Push the legend
	var legend = createLegend();
	mapsControls.push(legend);
    }
    else {
	createLegend();
    }
});


// Open cortadero popup
function cortaderosPopup(event) {
    var name = event.feature.getProperty('name');
    infoWindow.setContent(infoWindowTemplate.format(name));
    
    // Position of the point
    var anchor = new google.maps.MVCObject();
    anchor.setValues({
        position: event.latLng,
	// Ofset del text-box a las coordenadas
        anchorPoint: new google.maps.Point(0, 0) 
    });
    infoWindow.open(map, anchor);
}


// Show hide the differents layers
function showHideLayers(layer) {
    /*
      Show hide the differents layers

      layer: name of the layer
    */
    if (layers[layer].getMap()){
	layers[layer].setMap(null);
    }
    else {
	layers[layer].setMap(map);
    }
}

// Templates
// {0}: event.feature.getProperty('name')
var infoWindowTemplate = `
<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">
  <h4>{0}</h4>
</div>`
