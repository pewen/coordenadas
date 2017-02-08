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
var icons2Validate = {};
for (layer of layersNames) {
    icons2Validate[layer] = {'name': layersFullName[layer],
			    icon: iconBase + layer + '_validar.png'}
}
var icons2Delete = {};
for (layer of layersNames) {
    icons2Delete[layer] = {'name': layersFullName[layer],
			  icon: iconBase + layer + '_borrar.png'}
}

// Variables used to generate the legend
// =====================================
// {0} : icon url
// {1} : full name of the layer
var validateTem = `
<img src="{0}" />
    <p onclick="showHide2Validate();">{1}</p>`;
var deleteTem = `
<img src="{0}" />
    <p onclick="showHide2Delete();">{1}</p>`;

var loginLegend = {
    'delete': {'name': 'Elementos a borrar',
	       'icon': iconBase + 'delete.png',
	       'text': deleteTem},
    'validate': {'name': 'Elementos a Validar',
	       'icon': iconBase + 'question.png',
	       'text': validateTem}
};

// Variables used to show - hide point to validate
var show2ValidatePoints = true;
var show2DeletePoints = true;

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

    // Set the style for each layer
    // Depending if the point is validate or not
    setStyle();

    // Generate map legend
    var legend = document.getElementById('legend');
    for (var key in icons) {
        var div = document.createElement('div');
	div.className = "legend-item";
        div.innerHTML = legendTemplate.format(icons[key]['icon'],
					      icons[key]['name'],
					      key);
        legend.appendChild(div);
    }
    if (getCookie('status')) {
	for (var key in loginLegend) {
	    var div = document.createElement('div');
	    div.className = "legend-item";
            div.innerHTML = loginLegend[key]['text']
		.format(loginLegend[key]['icon'],
			loginLegend[key]['name']);
            legend.appendChild(div);
	}
    }
    // Push the legend
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);

    // Show the infoWindow when the user click in a point
    for (layer of layersNames) {
	layers[layer].addListener('click', function (event) {
	    layerInfoWindow(event);
	});
    }

    // Create a new point when the user click on the map
    map.addListener('click', function(event) {
        createMarker(event);
	markerInfoWindow(currentId);
    });

    // Display layers in the map
    for (layer of layersNames) {
	layers[layer].setMap(map);
    }
};


// Function to set the style 
// =========================

function setStyle() {
    /*
      Set the normal style to each point
     */
    for (var layer of layersNames) {
	layers[layer].setStyle(function (feature) {
	    var type = feature.getProperty('type');
	    if (!feature.getProperty('valido')) {
		return icons2Validate[type];
	    }
	    else if (feature.getProperty('borrar_contador')) {
		return icons2Delete[type];
	    }
	    else {
		return icons[type];
	    }
	});
    }
}

function validateStyle(layer, id) {
    /*
      When the user validate a point,
      change the style of this point
    */
    layers[layer].forEach(function (feature) {
	if (feature.getProperty('id') == id) {
	    feature.setProperty('valido', true);
	    feature.setProperty('borrar_contador', null);
	}
    });
}

function deleteStylr(layer, id) {
    /*
      When the user delete a point,
      change th estyle of this point
    */
}

// InfoWindow functions
// ====================

// Display the infoWindow when the user click on existent point
function layerInfoWindow(event) {
    var name = event.feature.getProperty('name');
    var type = event.feature.getProperty('type');
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();
    var id = event.feature.getProperty('id');

    var toValidate = event.feature.getProperty('valido') == false;
    var toDelete = event.feature.getProperty('borrar_contador') == true;

    // Text to show
    if (toValidate || toDelete) {
	var text = infoWindowValidateTemplate.format(name, type, id);
    }
    else {
	var text = infoWindowTemplate.format(name, lat, lng, type, id);
    }
    
    infoWindow.setContent(text);
    // Position of the point
    var anchor = new google.maps.MVCObject();
    anchor.setValues({
        position: event.latLng,
	// Ofset del text-box a las coordenadas
        anchorPoint: new google.maps.Point(0, 0) 
    });
    infoWindow.open(map, anchor);
}

// Display the infoWindow of the new points
function markerInfoWindow(id) {
    // Coordinate of the new points
    var lat = markers[id].position.lat()
    var lng = markers[id].position.lng()
    
    // Text to show
    var text = newPointInfoTemplate.format(id, lat, lng);
    infoWindow.setContent(text);
    // Position of the point
    var anchor = new google.maps.MVCObject();
    anchor.setValues({
        position: markers[id].position,
	// Ofset del text-box a las coordenadas
        anchorPoint: new google.maps.Point(0, 0)
    });

    infoWindow.open(map, anchor);
}

// Dummy function to close infoWindow from other function
var closeInfoWindow = function(){
    infoWindow.close();
}


// New markers function
// ====================

// Create a new marker and display in the map
var createMarker = function(event) {
    var id = uniqueId(); // get new id
    var marker = new google.maps.Marker({
	// create a marker and set id
        id: id,
        position: event.latLng,
        map: map,
        draggable: false,
	animation: google.maps.Animation.DROP,
    });    
    
    // Cache created marker to markers object with id as its key
    markers[id] = marker;

    marker.addListener('click', function() {
	markerInfoWindow(id);
    });
    
    // Center the map in the new point
    map.panTo(event.latLng);
}

// Removes a marker that created the user
var deleteMarker = function(id) {
    var marker = markers[id]; // find the marker by given id
    marker.setMap(null);
    infoWindow.close();
}

// Show Hide layers and markers functions
// ======================================

function hidePoint(layer, id) {
    /*
      Hide point of some layer after user removen them

      layer: name of the layer
      id: id of the potin to hide
    */
    layers[layer].setStyle(function (feature) {
	var type = feature.getProperty('type');
	if (feature.getProperty('id') == id) {
	    return {visible: false}
	}
	else if (feature.getProperty('valido')) {
		return icons[type];
	}
	else {
	    return icons2Validate[type];
	}
    })
}

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

function showHide2Validate() {
    /*
      Show or hide the points to validate in all the layers.
    */

    if (show2ValidatePoints) {
	for (var layer of layersNames) {
	    layers[layer].setStyle(function (feature) {
		var type = feature.getProperty('type');
		if (!feature.getProperty('valido')) {
		    return {visible: false};
		}
		else if (feature.getProperty('borrar_contador')) {
		    return icons2Delete[type];
		}
		else {
		    return icons[type];
		}
	    })
	}
	show2ValidatePoints = false;
    }
    else {
	setStyle();
	show2ValidatePoints = true;
    }
    
}

function showHide2Delete() {
    /*
      Show or hide the points to delete in all the layers.
    */

    if (show2ValidatePoints) {
	for (var layer of layersNames) {
	    layers[layer].setStyle(function (feature) {
		var type = feature.getProperty('type');
		if (!feature.getProperty('valido')) {
		    return icons2Validate[type];
		}
		else if (feature.getProperty('borrar_contador')) {
		    return {visible: false};
		}
		else {
		    return icons[type];
		}
	    })
	}
	show2ValidatePoints = false;
    }
    else {
	setStyle();
	show2ValidatePoints = true;
    }
    
}

// Templates
// =========
// {0} : icon url
// {1} : full name of the layer
// {2} : name of layer
var legendTemplate = `
<img src="{0}" />
    <p onclick="showHideLayers('{2}');">{1}</p>`;

// Layer info windown to validate
// {0}: name of point
// {1}: type of point
// {2}: id of the point
var infoWindowValidateTemplate = `
<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">
  <h4>{0}</h4>
  <button type="button" class="btn btn-primary btn-sm"
          onclick="validateRequest('{1}', {2})">
    Validar
  </button>
  <button type="button" class="btn btn-danger btn-sm"
          data-toggle="modal" data-target="#deletWindow"
          data-name='{0}' data-element='{1}' data-id={2}>
    Eliminar
  </button>
</div>`;

// Layer info windown
// {0}: name of point
// {1}: latitude
// {2}: longitude
// {3}: type of point
// {4}: id of the point
var infoWindowTemplate = `
<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">
  <h4>{0}</h4>
  <button type="button" class="btn btn-primary btn-sm"
          data-toggle="modal" data-target="#modifyWindow"
          data-name='{0}' data-lat='{1}' data-lng='{2}'
          data-element='{3}'>
    Modificar
  </button>
  <button type="button" class="btn btn-danger btn-sm"
          data-toggle="modal" data-target="#deletWindow"
          data-name='{0}' data-element='{3}' data-id={4}>
    Eliminar
  </button>
</div>`;

// {0}: id
// {1}: latitude
// {2}: longitude
var newPointInfoTemplate = `
<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">
  <h4>Nuevo Punto {0}</h4>
  <button type="button" class="btn btn-primary btn-sm"
          data-toggle="modal" data-target="#createWindow"
	  data-lat='{1}' data-lng='{2}' data-id='{0}'>
    Agregar
  </button>
  <button type="button" class="btn btn-danger btn-sm"
          data-toggle="modal" data-target="#EliminarModal"
          data-lat='{1}' data-lng='{2}'
          onclick="deleteMarker('{0}')">
    Eliminar
  </button>
</div>`;
