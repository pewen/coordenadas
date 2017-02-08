// Margin of the SVG plots
var margin = {top: 60, right: 80, bottom: 60, left: 60};
// Plots div id
var ids = ["aguaPlot", "gasPlot", "educacionPlot",
	   "bañoPlot", "hacinamientoPlot", "viviendaPlot"];


$(document).ready(function () {
    // Initial SVG size
    var ele = document.getElementsByClassName("tab-content")[0],
	eleStyle = window.getComputedStyle(ele);
    var containerWidth = parseFloat(eleStyle.width);

    var width = containerWidth - margin.left - margin.right;
    var height = 470 - margin.top - margin.bottom;
    
    // Create all the SVG canvas
    for (var i = 0; i < ids.length; i++){
	var svg = d3.select("#" + ids[i])
	    .append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform",
		  "translate(" + margin.left + "," + margin.top + ")");
    }

    // Draw for the first time to initialize.
    redrawPlot("aguaPlot", "acceso_agua");

    // Redraw based on the new size whenever the browser window is resized.
    window.addEventListener("resize", function(){
	redrawPlot("aguaPlot", "acceso_agua")});
})




function redrawPlot(divId, typeData){
    /*
      Make the bar plot

      Parameters
      ----------
      divId: ej: aguaPlot, gasPlot
      typeData: ej: acceso_agua, acceso_gas
    */

    // Calculate the responsibe size
    var ele = document.getElementsByClassName("tab-content")[0],
	eleStyle = window.getComputedStyle(ele);
    var containerWidth = parseFloat(eleStyle.width);
    
    width = containerWidth - margin.left - margin.right;
    height = 470 - margin.top - margin.bottom;

    // Set the dimensions of the canvas / graph
    var div = document.getElementById(divId);
    var svg = d3.select(div.getElementsByTagName('g')[0]);    
    svg.attr("width", width)
	.attr("height", height);
    
    // Set the ranges
    var x0 = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var x1 = d3.scale.ordinal();
    var y = d3.scale.linear().range([height, 0]);

    var color = d3.scale.ordinal()
	.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b",
		"#784B4B", "#a05d56", "#d0743c", "#ff8c00",
		"#FF4B0D"]);

    // Define the axes
    var xAxis = d3.svg.axis()
	.scale(x0)
	.orient("bottom");

    var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left")
	.tickFormat(d3.format(".2s"));

    // El popup!
    var tip = d3.tip()
	.attr('class', 'd3-tip')
	.offset([-10, 0])
	.html(function(d) {
	    return "Cantidad de radios censales en el cual un " + d.y_value +
		" de hogares tienen acceso a gas mediante " + d.name;
	})
    
    svg.call(tip);
    
    // Get the data
    d3.csv("../data/" + typeData + "_hist.csv", function(error, data) {
	if (error) throw error;
	
	var ageNames = d3.keys(data[0]).filter(function(key) {
	    return key !== "Franja";
	});
	
	// Estos son los atributos que va a tener el elemto d
	data.forEach(function(d) {
	    d.ages = ageNames.map(function(name) {
		return {name: name,
			value: +d[name],
			y_value: d.Franja,
			type: typeData};
	    });		
	});

	x0.domain(data.map(function(d) { return d.Franja; }));
	x1.domain(ageNames).rangeRoundBands([0, x0.rangeBand()]);
	y.domain([0, d3.max(data, function(d) {
	    return d3.max(d.ages, function(d) {
		return d.value;
	    });
	})]);

	// Borra los ejes si estan de antes
	d3.selectAll(".axis").remove();

	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis)
	    .append("text")
	    .style("text-anchor", "end")
	    .attr("x", width / 2 + 30)
	    .attr("y", 40)
	    .text("Porcentaje");

	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", -50)
	    .attr("x", -height / 2 + 60)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text("Cantidad de Cortaderos");

	var state = svg.selectAll(".state")
	    .data(data)
	    .enter().append("g")
	    .attr("class", "state")
	    .attr("transform", function(d) {
		return "translate(" + x0(d.Franja) + ",0)";
	    });

	state.selectAll("rect")
	    .data(function(d) { return d.ages; })
	    .enter().append("rect")
	    .attr("width", x1.rangeBand())
	    .attr("x", function(d) { return x1(d.name); })
	    .attr("y", function(d) { return y(d.value); })
	    .attr("height", function(d) { return height - y(d.value); })
	    .style("fill", function(d) { return color(d.name); })
	    .on('mouseover', tip.show)
	    .on('mouseout', tip.hide)
	    .on('click', function(d) {
		console.log("dentro del click");
		filterPlot(d);
		
	    });

	var legend = svg.selectAll(".legend")
	    .data(ageNames.slice().reverse())
	    .enter().append("g")
	    .attr("class", "legend")
	    .attr("transform", function(d, i) {
		return "translate(0," + i * 20 + ")";
	    });

	legend.append("rect")
	    .attr("x", width - 18)
	    .attr("width", 18)
	    .attr("height", 18)
	    .style("fill", color);

	legend.append("text")
	    .attr("x", width - 24)
	    .attr("y", 9)
	    .attr("dy", ".35em")
	    .style("text-anchor", "end")
	    .text(function(d) { return d; });

	
    });
}


function filterPlot(d) {
    /*
      Filtro los cortaderos por alguna variable de los plots de barra
    */    
    var type = d.type;
    var sub_type = d.name;
    var y_value = d.y_value;
    
    function styleDensity(feature) {
	var local_value = feature.getProperty(type)[sub_type][2];
	var show = false;
	if (local_value == y_value) {
	    show = true;
	}
	return {
	    icon: '../img/markers/brick.png',
	    strokeColor: '#fff',
	    fillOpacity: 0.75,
	    visible: show
	};
    }
    cortaderosLayer.setStyle(styleDensity);
}


function resetFilterPlot() {
    /*
      Reseteo todos los puntos.
    */
    function styleDensity(feature) {
	return {
	    icon: '../img/markers/brick.png',
	    strokeColor: '#fff',
	    fillOpacity: 0.75,
	    visible: true
	};
    }
    cortaderosLayer.setStyle(styleDensity);

    // Reseteo la barra de densidad
    var filterSlider = $("#filterSlider").slider();
    filterSlider.slider("setValue", [0, 2000]);
}
