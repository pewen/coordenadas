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
var url = serverUrl + "api/v1.0/datos/"; // Base url from get the data

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
var iconBase = '../static/img/markers/';
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
    var legend = document.getElementById('legend');
    for (var key in icons) {
        var type = icons[key];
        var name = type.name;
        var icon = type.icon;
        var div = document.createElement('div');
	div.className = "legend-item";
        div.innerHTML = '<img src="' + icon + '"> ' + '<p onclick="showHideLayers(' + "'" + name + "'" + ');">' + name + '</p>';
        legend.appendChild(div);
    }
    // Push the legend
    map.controls[google.maps.ControlPosition.LEFT].push(legend);

    // Show popup on click event
    layers.cortaderos.addListener('click', function(event) {
	cortaderosPopup();
    })
    
    // Display layers in the map
    for (layer of layersNames) {
	layers[layer].setMap(map);
    }
};

// Open cortadero popup
function cortaderosPopup(event) {
    var name = event.feature.getProperty('name');
    infoWindow.setContent(infoWindowTemplate.format(name));
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
