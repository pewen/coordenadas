/*
  Script para mostrar los valos correctos en los distintos 
  modales (ventanas emergentes) pasando los valores mediante 
  data-atributeName.

  Global variables previously declared
  ------------------------------------
  serverUrl: str
    Base url of the server
  layersNames: object
    Names of all the layers
  layersFullName: object
    Full name of each layer
*/

// Modal para agregar una nueva institucion
// ========================================
$('#createWindow').on('show.bs.modal', function (event) {
    // Button that triggered the modal
    var button = $(event.relatedTarget)

    // Extract coordinate
    var lat = button.data('lat');
    var lng = button.data('lng');
    var id = button.data('id');

    var modal = $(this)
    modal.find('#showCoord').html(lat + ' ' + lng);

    // onclick event in button
    var request = createButtonTemplate.format(lat, lng, id);
    document.getElementById('createButton')
	.setAttribute('onclick', request);
})


// Modal para eliminar instituciones
// =================================
$('#deletWindow').on('show.bs.modal', function (event) {
    // Button that triggered the modal
    var button = $(event.relatedTarget)

    var name = button.data('name');     // Extract name
    var layer = button.data('element'); // Extract type of element
    var id = button.data('id');         // Extract the id

    var modal = $(this)
    modal.find('.modal-title').text('Eliminar ' + name)

    // onclick event in button
    var request = delButtonTemplate.format(layer, id);
    document.getElementById('deletButton')
	.setAttribute('onclick', request);
})

// Modal para modificar atributos
// ==============================
$('#modifyWindow').on('show.bs.modal', function (event) {
    // Button that triggered the modal
    var button = $(event.relatedTarget)

    // Extract name
    var name = button.data('name');
    name = name.split('_').join(' ');
    // Extract coordinate
    var lat = button.data('lat');
    var lng = button.data('lng');
    // Extract type of element
    var elemento = button.data('element');
    
    var modal = $(this)
    modal.find('.modal-title').text('Modificar  ' + name)
    modal.find('.modal-body input').val(name)
    modal.find('#showCoord').text('Coordinadas ' + lat + ' ' + lng)

    // onclick event in button
    var request = 'modifyRequest("' + elemento + '",' + lat + ',' + lng + ')';
    document.getElementById('modifyButton').setAttribute('onclick', request);
})


/* 
   Request functions
   =================
*/

// Request para crear una institucion
function createRequest(lat, lng, id) {
    var layer = document.getElementById("formType").value;
    var name = document.getElementById("formNameCreate").value;
    
    var data = {"capa": layer,
		"nombre": name,
		"lat": lat,
		"lng": lng};
    var data = JSON.stringify(data);

    // Send the request
    var createUrl = serverUrl + 'api/v1.0/datos/modificar/';
    var xhr = new XMLHttpRequest();

    // Use the cookies in the post
    xhr.withCredentials = true;
    xhr.open("POST", createUrl);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);

    // Hide modal and close infoWindow
    $('#createWindow').modal('hide');
    closeInfoWindow();
}

// Request para borrar una institucion
function deletRequest(layer, id) {
    var data = {"capa": layer,
		"id": id};
    data = JSON.stringify(data);

    // Send the request
    var createUrl = serverUrl + 'api/v1.0/datos/modificar/';
    var xhr = new XMLHttpRequest();

    // Use the cookies in the post
    xhr.withCredentials = true;
    xhr.open("DELETE", createUrl);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);

    // Hide the "delete" point
    hidePoint(layer, id);
    
    // Hide modal and close infoWindow
    $('#deletWindow').modal('hide');
    closeInfoWindow();
}

// Request para validar una institucion
function validateRequest(layer, id) {
    var data = {"capa": layer,
		"id": id};
    data = JSON.stringify(data);

    // Send the request
    var createUrl = serverUrl + 'api/v1.0/datos/modificar/';
    var xhr = new XMLHttpRequest();

    // Use the cookies in the post
    xhr.withCredentials = true;
    xhr.open("PUT", createUrl);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);

    // Change the style of the validate point
    validateStyle(layer, id);
    
    // Hide modal and close infoWindow
    $('#deletWindow').modal('hide');
    closeInfoWindow();
}


// Templates
// =========
// {0}: lat
// {1}: lng
// {2}: id
var createButtonTemplate = `createRequest('{0}', '{1}', '{2}')`;

// {0}: layer
// {1}: id
var delButtonTemplate = `deletRequest('{0}', '{1}')`;
