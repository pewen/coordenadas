/*
  Visualizacion de los datos en un mapa de google

  Desarrollador: Franco N. Bellomo - @fnbellomo
*/

// General map variable
var map;

// Name of the 3 differents layers
var cortaderosLayer;
var healthLayer;
var primaryLayer;
var secondaryLayer;

// Variables used to show or hide the different layers
var showCortaderosLayer = true;
var showHealtLayer = true;
var showPrimaryLayer = true;
var showSecondaryLayer = true;

// Variables used with the new markers
var markers = {};
var currentId = 0;
var uniqueId = function() {
    return ++currentId;
}

// General infoWindow variable
var infoWindow;

// Base url from get the data
//var url = "http://127.0.0.1:5000/api/v1.0/datos/";
var url = "https://raw.githubusercontent.com/pewen/mapa_cortaderos/master/datos/"


function initMap() {
    // Create the map
    map = new google.maps.Map(document.getElementById('map'), {
	zoom: 12,
	center: {lat: -31.45, lng: -64.18}
    });
    
    // Initialize all the layers
    cortaderosLayer = new google.maps.Data();
    healthLayer     = new google.maps.Data();
    primaryLayer    = new google.maps.Data();
    secondaryLayer  = new google.maps.Data();

    // Create a global infowindow
    infoWindow = new google.maps.InfoWindow({
        content: "",
        pixelOffset: new google.maps.Size(0, -30)
    });
    
    // Load GeoJSON with the data of each layer
    cortaderosLayer.loadGeoJson(url + "cortaderos.geojson");
    healthLayer.loadGeoJson(url + "salud.geojson");
    primaryLayer.loadGeoJson(url + "primarios.geojson");
    secondaryLayer.loadGeoJson(url + "secundarios.geojson");

    
    // Personal icons for each layer
    var iconBase = '../img/markers/';
    var icons = {
        Cortadero: {
            name: 'Cortaderos',
	    icon: iconBase + 'brick.png'
        },
        Healt: {
            name: 'Centro de Salud',
	    icon: iconBase + 'health.png'
        },
	Primary: {
            name: 'Instituto Primario',
	    icon: iconBase + 'primary.png'
        },
	Secondary: {
            name: 'Instituto Secundario',
	    icon: iconBase + 'secondary.png'
        }
    };

    // Set the style for each layer
    cortaderosLayer.setStyle(icons['Cortadero']);
    healthLayer.setStyle(icons['Healt']);
    primaryLayer.setStyle(icons['Primary']);
    secondaryLayer.setStyle(icons['Secondary']);

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
    cortaderosLayer.addListener('click', function(event) {
	cortaderosPopup();
    })
    
    // Display layers in the map
    cortaderosLayer.setMap(map);
    healthLayer.setMap(map);
    primaryLayer.setMap(map);
    secondaryLayer.setMap(map);
};

// Open cortadero popup
function cortaderosPopup() {
    infoWindow.setContent('<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' +
			  '<h4>' + event.feature.getProperty('name') + '</h4>' +
			  '</div>')
}


// Show hide the differents layers
function showHideLayers(element) {
    if (element == 'Cortaderos') {
	showCortaderosLayer = !showCortaderosLayer
	if (showCortaderosLayer) {
	    cortaderosLayer.setMap(map);
	} else {
	    cortaderosLayer.setMap(null);
	}

    } else if (element == 'Centro de Salud') {
	showHealtLayer = !showHealtLayer;
	if (showHealtLayer) {
	    healthLayer.setMap(map);
	} else {
	    healthLayer.setMap(null);
	}

    } else if (element == 'Instituto Primario') {
	showPrimaryLayer = !showPrimaryLayer;
	if (showPrimaryLayer) {
	    primaryLayer.setMap(map);
	} else {
	    primaryLayer.setMap(null);
	}
    } else if (element == 'Instituto Secundario') {
	showSecondaryLayer = !showSecondaryLayer;
	if (showSecondaryLayer) {
	   secondaryLayer.setMap(map);
	} else {
	    secondaryLayer.setMap(null);
	}
    }
}
